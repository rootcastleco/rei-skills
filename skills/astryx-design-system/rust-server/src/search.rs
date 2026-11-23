//! Weighted keyword + prefix + fuzzy search engine and `build` page recommender.

use crate::catalog::Catalog;
use crate::json::{arr, n, obj, s, JsonValue};

#[derive(Debug, Clone)]
pub struct SearchHit {
    pub kind: String,
    pub id: String,
    pub title: String,
    pub category: String,
    pub description: String,
    pub score: i32,
    pub follow_up: String,
}

impl SearchHit {
    pub fn to_json(&self) -> JsonValue {
        obj(vec![
            ("kind", s(&self.kind)),
            ("id", s(&self.id)),
            ("title", s(&self.title)),
            ("category", s(&self.category)),
            ("description", s(&self.description)),
            ("score", JsonValue::Number(self.score as f64)),
            ("followUp", s(&self.follow_up)),
        ])
    }
}

fn tokenize(text: &str) -> Vec<String> {
    text.to_lowercase()
        .split(|c: char| !c.is_alphanumeric() && c != '-')
        .filter(|w| !w.is_empty())
        .map(|w| w.to_string())
        .collect()
}

fn is_subsequence(needle: &str, haystack: &str) -> bool {
    let mut n_chars = needle.chars();
    let mut current = match n_chars.next() {
        Some(c) => c,
        None => return true,
    };
    for h in haystack.chars() {
        if h == current {
            match n_chars.next() {
                Some(next_c) => current = next_c,
                None => return true,
            }
        }
    }
    false
}

fn score_text(
    query_lower: &str,
    terms: &[String],
    id: &str,
    title: &str,
    category: &str,
    keywords: &[String],
    description: &str,
) -> i32 {
    let id_l = id.to_lowercase();
    let title_l = title.to_lowercase();
    let cat_l = category.to_lowercase();
    let desc_l = description.to_lowercase();

    let mut score = 0;

    if id_l == query_lower || title_l == query_lower {
        score += 1000;
    } else if id_l.starts_with(query_lower) || title_l.starts_with(query_lower) {
        score += 420;
    } else if id_l.contains(query_lower) || title_l.contains(query_lower) {
        score += 260;
    }

    for term in terms {
        if term.len() < 2 {
            continue;
        }
        if id_l == *term || title_l == *term {
            score += 240;
        } else if id_l.starts_with(term.as_str()) || title_l.starts_with(term.as_str()) {
            score += 120;
        } else if id_l.contains(term.as_str()) || title_l.contains(term.as_str()) {
            score += 80;
        }

        for kw in keywords {
            let kw_l = kw.to_lowercase();
            if kw_l == *term {
                score += 95;
            } else if kw_l.contains(term.as_str()) {
                score += 45;
            }
        }

        if cat_l.contains(term.as_str()) {
            score += 40;
        }
        if desc_l.contains(term.as_str()) {
            score += 28;
        }
        if score == 0 && term.len() >= 3 && is_subsequence(term, &id_l) {
            score += 20;
        }
    }

    score
}

pub fn search_catalog(
    cat: &Catalog,
    query: &str,
    kind_filter: Option<&str>,
    limit: usize,
) -> Vec<SearchHit> {
    let q_trim = query.trim();
    if q_trim.is_empty() {
        return Vec::new();
    }
    let q_lower = q_trim.to_lowercase();
    let terms = tokenize(&q_lower);
    let filter = kind_filter.unwrap_or("all").to_lowercase();

    let mut hits = Vec::new();

    if filter == "all" || filter == "component" || filter == "hook" || filter == "utility" {
        for c in &cat.components {
            if filter != "all" && c.kind != filter {
                continue;
            }
            let sc = score_text(
                &q_lower,
                &terms,
                &c.name,
                &c.display_name,
                &c.category,
                &c.keywords,
                &c.description,
            );
            if sc > 0 {
                let domain_bonus = if c.kind == "component" { 25 } else { 15 };
                hits.push(SearchHit {
                    kind: c.kind.clone(),
                    id: c.name.clone(),
                    title: c.display_name.clone(),
                    category: c.category.clone(),
                    description: c.description.clone(),
                    score: sc + domain_bonus,
                    follow_up: format!("astryx-ds-server component {}", c.name),
                });
            }
        }
    }

    if filter == "all" || filter == "template" {
        for t in &cat.templates {
            let sc = score_text(
                &q_lower,
                &terms,
                &t.slug,
                &t.name,
                &t.category,
                &t.keywords,
                &t.description,
            );
            if sc > 0 {
                hits.push(SearchHit {
                    kind: "template".to_string(),
                    id: t.slug.clone(),
                    title: t.name.clone(),
                    category: t.category.clone(),
                    description: t.description.clone(),
                    score: sc + 18,
                    follow_up: format!("astryx-ds-server template {}", t.slug),
                });
            }
        }
    }

    if filter == "all" || filter == "theme" {
        for th in &cat.themes {
            let kws = vec![
                th.font_body.clone(),
                th.font_heading.clone(),
                "theme".to_string(),
            ];
            let sc = score_text(
                &q_lower,
                &terms,
                &th.name,
                &th.display_name,
                "Theme",
                &kws,
                &th.description,
            );
            if sc > 0 {
                hits.push(SearchHit {
                    kind: "theme".to_string(),
                    id: th.name.clone(),
                    title: th.display_name.clone(),
                    category: "Theme".to_string(),
                    description: th.description.clone(),
                    score: sc + 12,
                    follow_up: format!("astryx-ds-server theme {}", th.name),
                });
            }
        }
    }

    if filter == "all" || filter == "token" {
        for tk in &cat.tokens {
            let kws = vec![tk.family.clone(), "token".to_string(), "css".to_string()];
            let sc = score_text(
                &q_lower,
                &terms,
                &tk.name,
                &tk.name,
                &tk.family,
                &kws,
                &tk.value,
            );
            if sc > 0 {
                hits.push(SearchHit {
                    kind: "token".to_string(),
                    id: tk.name.clone(),
                    title: tk.name.clone(),
                    category: tk.family.clone(),
                    description: format!("light: {} | dark: {}", tk.light, tk.dark),
                    score: sc,
                    follow_up: format!("astryx-ds-server tokens --family {}", tk.family),
                });
            }
        }
    }

    if filter == "all" || filter == "doc" {
        for d in &cat.docs {
            let section_titles: Vec<String> = d.sections.iter().map(|x| x.title.clone()).collect();
            let sc = score_text(
                &q_lower,
                &terms,
                &d.slug,
                &d.title,
                "Docs",
                &section_titles,
                &d.description,
            );
            if sc > 0 {
                hits.push(SearchHit {
                    kind: "doc".to_string(),
                    id: d.slug.clone(),
                    title: d.title.clone(),
                    category: "Docs".to_string(),
                    description: d.description.clone(),
                    score: sc + 5,
                    follow_up: format!("astryx-ds-server docs {}", d.slug),
                });
            }
        }
    }

    hits.sort_by(|a, b| b.score.cmp(&a.score).then_with(|| a.id.cmp(&b.id)));
    hits.truncate(limit);
    hits
}

/// Recommends page templates, core components, and Astryx rules for a UI idea.
pub fn build_plan(cat: &Catalog, idea: &str) -> JsonValue {
    let tpl_hits = search_catalog(cat, idea, Some("template"), 4);
    let comp_hits = search_catalog(cat, idea, Some("component"), 8);
    let hook_hits = search_catalog(cat, idea, Some("hook"), 4);

    let templates: Vec<JsonValue> = tpl_hits
        .iter()
        .filter_map(|h| cat.find_template(&h.id).map(|t| t.to_json()))
        .collect();

    let components: Vec<JsonValue> = comp_hits
        .iter()
        .filter_map(|h| cat.find_component(&h.id).map(|c| c.summary_json()))
        .collect();

    let hooks: Vec<JsonValue> = hook_hits
        .iter()
        .filter_map(|h| cat.find_component(&h.id).map(|c| c.summary_json()))
        .collect();

    let primary_slug = tpl_hits
        .first()
        .map(|h| h.id.as_str())
        .unwrap_or("blank");

    obj(vec![
        ("idea", s(idea)),
        ("recommendedTemplate", s(primary_slug)),
        ("templates", arr(templates)),
        ("components", arr(components)),
        ("hooks", arr(hooks)),
        (
            "workflow",
            arr(vec![
                s(format!(
                    "1. Scaffold page structure: npx @astryxdesign/cli template {} src/pages/Page.tsx",
                    primary_slug
                )),
                s("2. Wrap app chrome in AppShell + TopNav / SideNav and <Theme theme={neutralTheme} mode=\"system\">."),
                s("3. Inspect exact prop names before writing JSX: buttons/badges/tabs use `label`, booleans use `is*`/`has*`, inputs use `value` + `onChange`."),
                s("4. Use dense rows (Table, List/Item) for lists instead of Card grids; reserve Card for discrete widgets/galleries."),
                s("5. Audit generated files with `astryx-ds-server doctor ./src` before shipping."),
            ]),
        ),
        (
            "matchCounts",
            obj(vec![
                ("templates", n(tpl_hits.len())),
                ("components", n(comp_hits.len())),
                ("hooks", n(hook_hits.len())),
            ]),
        ),
    ])
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::catalog::catalog;

    #[test]
    fn search_finds_button_first() {
        let hits = search_catalog(catalog(), "Button", None, 10);
        assert!(!hits.is_empty());
        assert_eq!(hits[0].id, "Button");
        assert_eq!(hits[0].kind, "component");
    }

    #[test]
    fn build_plan_recommends_dashboard() {
        let plan = build_plan(catalog(), "analytics kpi dashboard");
        let rec = plan
            .get("recommendedTemplate")
            .and_then(|v| v.as_str())
            .unwrap_or("");
        assert!(rec.contains("dashboard"), "expected dashboard template, got {rec}");
    }
}
