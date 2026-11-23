//! Dynamic CSS custom-property stylesheet generator for Astryx core & themes.

use crate::catalog::{Catalog, ThemeDoc};
use std::collections::BTreeMap;

/// Compiles Astryx core default tokens plus optional theme overrides into a CSS stylesheet.
///
/// `mode` can be `"auto"` (emits `light-dark(...)` + `color-scheme`), `"light"`, or `"dark"`.
pub fn generate_theme_css(cat: &Catalog, theme_name: Option<&str>, mode: &str) -> Result<String, String> {
    let theme: Option<&ThemeDoc> = match theme_name {
        Some(name) if !name.is_empty() && !name.eq_ignore_ascii_case("core") && !name.eq_ignore_ascii_case("default") => {
            Some(
                cat.find_theme(name)
                    .ok_or_else(|| format!("Unknown Astryx theme: '{name}'"))?,
            )
        }
        _ => None,
    };

    let mut merged: BTreeMap<String, (String, String)> = BTreeMap::new();
    for tok in &cat.tokens {
        merged.insert(tok.name.clone(), (tok.light.clone(), tok.dark.clone()));
    }

    if let Some(th) = theme {
        for (k, pair) in &th.tokens {
            merged.insert(k.clone(), (pair.light.clone(), pair.dark.clone()));
        }
        if !th.font_body.is_empty() {
            merged.insert(
                "--font-family-body".to_string(),
                (
                    format!(
                        "\"{}\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                        th.font_body
                    ),
                    format!(
                        "\"{}\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                        th.font_body
                    ),
                ),
            );
        }
        if !th.font_heading.is_empty() {
            merged.insert(
                "--font-family-heading".to_string(),
                (
                    format!(
                        "\"{}\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                        th.font_heading
                    ),
                    format!(
                        "\"{}\", -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, sans-serif",
                        th.font_heading
                    ),
                ),
            );
        }
        if !th.font_code.is_empty() {
            merged.insert(
                "--font-family-code".to_string(),
                (
                    format!("\"{}\", ui-monospace, SFMono-Regular, Menlo, monospace", th.font_code),
                    format!("\"{}\", ui-monospace, SFMono-Regular, Menlo, monospace", th.font_code),
                ),
            );
        }
    }

    let slug = theme.map(|t| t.name.as_str()).unwrap_or("core");
    let mode_norm = mode.to_lowercase();
    let is_dark_only = theme
        .map(|t| t.color_modes.len() == 1 && t.color_modes[0] == "dark")
        .unwrap_or(false);

    let effective_mode = if is_dark_only {
        "dark"
    } else if mode_norm == "light" || mode_norm == "dark" {
        mode_norm.as_str()
    } else {
        "auto"
    };

    let mut css = String::with_capacity(12 * 1024);
    css.push_str(&format!(
        "/* Astryx Design System Tokens — theme: {} | mode: {} | @astryxdesign/core@{} */\n",
        slug, effective_mode, cat.meta.core_version
    ));
    css.push_str(&format!(
        ":root, [data-astryx-theme=\"{}\"] {{\n",
        slug
    ));

    match effective_mode {
        "light" => css.push_str("  color-scheme: light;\n"),
        "dark" => css.push_str("  color-scheme: dark;\n"),
        _ => css.push_str("  color-scheme: light dark;\n"),
    }

    for (name, (light, dark)) in &merged {
        let value = match effective_mode {
            "light" => light.clone(),
            "dark" => dark.clone(),
            _ => {
                if light == dark {
                    light.clone()
                } else {
                    format!("light-dark({}, {})", light, dark)
                }
            }
        };
        css.push_str(&format!("  {}: {};\n", name, value));
    }

    css.push_str("}\n");
    Ok(css)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::catalog;

    #[test]
    fn generates_css_for_all_seven_themes() {
        let cat = catalog();
        for th in &cat.themes {
            let css = generate_theme_css(cat, Some(&th.name), "auto").expect("css ok");
            assert!(css.contains(&format!("[data-astryx-theme=\"{}\"]", th.name)));
            assert!(css.contains("--color-accent:"));
            assert!(css.contains("--color-background-body:"));
        }
    }
}
