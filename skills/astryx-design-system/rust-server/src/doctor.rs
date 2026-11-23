//! Static Astryx design-system compliance auditor (`doctor`).

use crate::json::{arr, b, n, obj, s, JsonValue};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone)]
pub struct Finding {
    pub severity: String,
    pub rule: String,
    pub file: String,
    pub line: usize,
    pub message: String,
    pub fix: String,
}

impl Finding {
    pub fn to_json(&self) -> JsonValue {
        obj(vec![
            ("severity", s(&self.severity)),
            ("rule", s(&self.rule)),
            ("file", s(&self.file)),
            ("line", n(self.line)),
            ("message", s(&self.message)),
            ("fix", s(&self.fix)),
        ])
    }
}

pub fn audit_code(filename: &str, source: &str) -> Vec<Finding> {
    let mut findings = Vec::new();
    let is_style_file = filename.ends_with(".css") || filename.ends_with(".scss");
    let is_tsx_file = filename.ends_with(".tsx")
        || filename.ends_with(".jsx")
        || filename.ends_with(".ts")
        || filename.ends_with(".js")
        || filename.is_empty();

    for (idx, raw_line) in source.lines().enumerate() {
        let line_no = idx + 1;
        let line = raw_line.trim();
        if line.starts_with("//") || line.starts_with("/*") || line.starts_with('*') {
            continue;
        }

        // 1. Hardcoded hex color literals outside token definitions
        if !line.contains("--") && contains_hex_color(line) {
            findings.push(Finding {
                severity: "warning".to_string(),
                rule: "no-hardcoded-color".to_string(),
                file: filename.to_string(),
                line: line_no,
                message: "Hardcoded hex color breaks Astryx theming and light/dark mode.".to_string(),
                fix: "Replace with a semantic token such as var(--color-text-primary), var(--color-accent), or var(--color-background-surface).".to_string(),
            });
        }

        if is_tsx_file {
            // 2. Raw <a href=...> instead of Astryx Link / useLinkComponent()
            if line.contains("<a ") && line.contains("href=") {
                findings.push(Finding {
                    severity: "error".to_string(),
                    rule: "use-astryx-link".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Raw <a> tag bypasses Astryx LinkProvider and router integration.".to_string(),
                    fix: "Use <Link href=\"...\"> from '@astryxdesign/core/Link' or useLinkComponent().".to_string(),
                });
            }

            // 3. Inline style={{ ... }} on elements
            if line.contains("style={{") {
                findings.push(Finding {
                    severity: "warning".to_string(),
                    rule: "no-inline-styles".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Inline style objects bypass StyleX/Astryx design tokens.".to_string(),
                    fix: "Use Astryx layout props (Stack/Grid gap/padding), StyleX xstyle, or Tailwind semantic classes.".to_string(),
                });
            }

            // 4. <Button> without label prop (children-only)
            if line.contains("<Button") && !line.contains("label=") && line.contains('>') && !line.contains("/>") {
                findings.push(Finding {
                    severity: "error".to_string(),
                    rule: "button-requires-label".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Astryx Button requires a `label` prop (even when children are provided).".to_string(),
                    fix: "Write <Button label=\"Save\" variant=\"primary\" /> instead of <Button>Save</Button>.".to_string(),
                });
            }

            // 5. <Badge> without label prop
            if line.contains("<Badge") && !line.contains("label=") && line.contains('>') && !line.contains("/>") {
                findings.push(Finding {
                    severity: "error".to_string(),
                    rule: "badge-requires-label".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Astryx Badge takes text in `label`, not children.".to_string(),
                    fix: "Write <Badge label=\"New\" /> (or use StatusDot/Token for status indicators).".to_string(),
                });
            }

            // 6. Non-Astryx boolean prop conventions
            if (line.contains("<Button") || line.contains("<TextInput") || line.contains("<Checkbox") || line.contains("<Switch"))
                && (line.contains(" disabled") || line.contains(" loading"))
            {
                findings.push(Finding {
                    severity: "error".to_string(),
                    rule: "astryx-boolean-prefix".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Astryx boolean props start with `is` or `has` (e.g. `isDisabled`, `isLoading`, `isOpen`).".to_string(),
                    fix: "Rename `disabled` -> `isDisabled` and `loading` -> `isLoading`.".to_string(),
                });
            }

            if (line.contains("<Dialog") || line.contains("<Drawer") || line.contains("<Popover") || line.contains("<AlertDialog"))
                && line.contains(" open=")
            {
                findings.push(Finding {
                    severity: "error".to_string(),
                    rule: "astryx-open-prop".to_string(),
                    file: filename.to_string(),
                    line: line_no,
                    message: "Astryx overlay components use `isOpen` and `onOpenChange`, not `open`.".to_string(),
                    fix: "Rename `open` -> `isOpen` and pair with `onOpenChange`.".to_string(),
                });
            }
        }

        if is_style_file && line.contains("@apply ") {
            findings.push(Finding {
                severity: "warning".to_string(),
                rule: "avoid-css-apply".to_string(),
                file: filename.to_string(),
                line: line_no,
                message: "Avoid custom CSS @apply overrides around Astryx components.".to_string(),
                fix: "Prefer Astryx component props, theme CSS variables, or StyleX xstyle.".to_string(),
            });
        }
    }

    // Whole-file heuristic: Card inside .map() loop
    if is_tsx_file && source.contains(".map(") && source.contains("<Card") {
        let mut saw_map = false;
        for (idx, line) in source.lines().enumerate() {
            if line.contains(".map(") {
                saw_map = true;
            }
            if saw_map && line.contains("<Card") {
                findings.push(Finding {
                    severity: "info".to_string(),
                    rule: "prefer-rows-for-dense-lists".to_string(),
                    file: filename.to_string(),
                    line: idx + 1,
                    message: "Rendering <Card> inside .map() may violate Astryx's dense-data rule.".to_string(),
                    fix: "Use Table or List/Item rows for dense datasets; reserve Card for discrete widgets or visual galleries.".to_string(),
                });
                break;
            }
        }
    }

    findings
}

fn contains_hex_color(line: &str) -> bool {
    let bytes = line.as_bytes();
    for i in 0..bytes.len() {
        if bytes[i] == b'#' {
            let mut hex_len = 0;
            while i + 1 + hex_len < bytes.len() && bytes[i + 1 + hex_len].is_ascii_hexdigit() {
                hex_len += 1;
            }
            if matches!(hex_len, 3 | 4 | 6 | 8) {
                // Ensure next char is not alphanumeric
                let end = i + 1 + hex_len;
                if end == bytes.len() || !bytes[end].is_ascii_alphanumeric() {
                    // Ignore URL anchors like href="#section"
                    let prev_is_quote_or_colon = i > 0
                        && matches!(bytes[i - 1], b'\'' | b'"' | b':' | b' ' | b'(' | b',');
                    if prev_is_quote_or_colon {
                        return true;
                    }
                }
            }
        }
    }
    false
}

pub fn audit_path(target: &Path) -> JsonValue {
    let mut findings = Vec::new();
    let mut scanned_files = 0usize;

    if target.is_file() {
        if let Ok(content) = fs::read_to_string(target) {
            scanned_files += 1;
            let name = target.to_string_lossy().to_string();
            findings.extend(audit_code(&name, &content));
        }
    } else if target.is_dir() {
        // Check package.json if present
        let pkg_path = target.join("package.json");
        if pkg_path.is_file() {
            if let Ok(raw) = fs::read_to_string(&pkg_path) {
                if !raw.contains("@astryxdesign/core") {
                    findings.push(Finding {
                        severity: "info".to_string(),
                        rule: "astryx-core-dependency".to_string(),
                        file: pkg_path.to_string_lossy().to_string(),
                        line: 1,
                        message: "@astryxdesign/core is not listed in package.json.".to_string(),
                        fix: "Run: npm install @astryxdesign/core @astryxdesign/theme-neutral @stylexjs/stylex && npm install -D @astryxdesign/cli".to_string(),
                    });
                }
            }
        }
        walk_dir(target, &mut scanned_files, &mut findings, 0);
    }

    report_json(scanned_files, findings)
}

fn walk_dir(dir: &Path, scanned: &mut usize, findings: &mut Vec<Finding>, depth: usize) {
    if depth > 6 || *scanned > 200 {
        return;
    }
    let entries = match fs::read_dir(dir) {
        Ok(e) => e,
        Err(_) => return,
    };
    for entry in entries.flatten() {
        let p = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || name == "node_modules" || name == "dist" || name == "target" || name == "build" {
            continue;
        }
        if p.is_dir() {
            walk_dir(&p, scanned, findings, depth + 1);
        } else if p.is_file() {
            let ext = p.extension().and_then(|e| e.to_str()).unwrap_or("");
            if matches!(ext, "tsx" | "jsx" | "ts" | "js" | "css") {
                if let Ok(content) = fs::read_to_string(&p) {
                    *scanned += 1;
                    findings.extend(audit_code(&p.to_string_lossy(), &content));
                }
            }
        }
    }
}

pub fn report_json(scanned_files: usize, findings: Vec<Finding>) -> JsonValue {
    let errors = findings.iter().filter(|f| f.severity == "error").count();
    let warnings = findings.iter().filter(|f| f.severity == "warning").count();
    let infos = findings.iter().filter(|f| f.severity == "info").count();

    obj(vec![
        ("passed", b(errors == 0)),
        ("scannedFiles", n(scanned_files)),
        (
            "summary",
            obj(vec![
                ("errors", n(errors)),
                ("warnings", n(warnings)),
                ("info", n(infos)),
                ("total", n(findings.len())),
            ]),
        ),
        (
            "findings",
            arr(findings.iter().map(|f| f.to_json()).collect()),
        ),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn catches_common_astryx_antipatterns() {
        let sample = r#"
export function BadPage() {
  return (
    <div style={{ color: '#ff0000' }}>
      <a href="/home">Home</a>
      <Button disabled>Save</Button>
      <Dialog open={true} />
    </div>
  );
}
"#;
        let findings = audit_code("BadPage.tsx", sample);
        let rules: Vec<&str> = findings.iter().map(|f| f.rule.as_str()).collect();
        assert!(rules.contains(&"no-hardcoded-color"));
        assert!(rules.contains(&"use-astryx-link"));
        assert!(rules.contains(&"no-inline-styles"));
        assert!(rules.contains(&"button-requires-label"));
        assert!(rules.contains(&"astryx-boolean-prefix"));
        assert!(rules.contains(&"astryx-open-prop"));
    }
}
