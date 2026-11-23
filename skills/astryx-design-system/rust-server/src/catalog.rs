//! Embedded Meta Astryx design-system catalog loader and typed domain models.

use crate::json::{self, arr, b, n, obj, s, JsonValue};
use std::collections::BTreeMap;
use std::sync::OnceLock;

const EMBEDDED_CATALOG_JSON: &str = include_str!("../data/astryx_catalog.json");

static CATALOG_INSTANCE: OnceLock<Catalog> = OnceLock::new();

pub fn catalog() -> &'static Catalog {
    CATALOG_INSTANCE.get_or_init(|| {
        Catalog::from_json_str(EMBEDDED_CATALOG_JSON)
            .expect("embedded astryx_catalog.json must be valid")
    })
}

#[derive(Debug, Clone)]
pub struct Catalog {
    pub meta: CatalogMeta,
    pub components: Vec<ComponentDoc>,
    pub tokens: Vec<TokenDoc>,
    pub themes: Vec<ThemeDoc>,
    pub templates: Vec<TemplateDoc>,
    pub docs: Vec<GuideDoc>,
}

#[derive(Debug, Clone)]
pub struct CatalogMeta {
    pub name: String,
    pub upstream: String,
    pub core_version: String,
    pub react_peer: String,
    pub stylex_peer: String,
    pub license: String,
}

#[derive(Debug, Clone)]
pub struct ComponentDoc {
    pub name: String,
    pub display_name: String,
    pub kind: String,
    pub category: String,
    pub group: String,
    pub import_path: String,
    pub description: String,
    pub keywords: Vec<String>,
    pub props: Vec<PropDoc>,
    pub best_practices: Vec<BestPractice>,
    pub accessibility: Vec<A11yRule>,
    pub anatomy: Vec<AnatomyPart>,
    pub example_code: String,
}

#[derive(Debug, Clone)]
pub struct PropDoc {
    pub name: String,
    pub prop_type: String,
    pub default_value: String,
    pub required: bool,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct BestPractice {
    pub do_rule: bool,
    pub text: String,
}

#[derive(Debug, Clone)]
pub struct A11yRule {
    pub name: String,
    pub criterion: String,
    pub requirement: String,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct AnatomyPart {
    pub name: String,
    pub required: bool,
    pub description: String,
}

#[derive(Debug, Clone)]
pub struct TokenDoc {
    pub name: String,
    pub family: String,
    pub value: String,
    pub light: String,
    pub dark: String,
}

#[derive(Debug, Clone)]
pub struct ThemeTokenPair {
    pub light: String,
    pub dark: String,
}

#[derive(Debug, Clone)]
pub struct ThemeDoc {
    pub name: String,
    pub display_name: String,
    pub package_name: String,
    pub description: String,
    pub maintained: bool,
    pub color_modes: Vec<String>,
    pub font_body: String,
    pub font_heading: String,
    pub font_code: String,
    pub scale_base: f64,
    pub scale_ratio: f64,
    pub tokens: BTreeMap<String, ThemeTokenPair>,
}

#[derive(Debug, Clone)]
pub struct TemplateDoc {
    pub slug: String,
    pub name: String,
    pub category: String,
    pub description: String,
    pub keywords: Vec<String>,
    pub components: Vec<String>,
    pub is_ready: bool,
}

#[derive(Debug, Clone)]
pub struct GuideSection {
    pub title: String,
    pub body: String,
}

#[derive(Debug, Clone)]
pub struct GuideDoc {
    pub slug: String,
    pub title: String,
    pub description: String,
    pub sections: Vec<GuideSection>,
}

fn str_field(v: &JsonValue, key: &str) -> String {
    v.get(key)
        .and_then(|x| x.as_str())
        .unwrap_or("")
        .to_string()
}

fn str_vec_field(v: &JsonValue, key: &str) -> Vec<String> {
    v.get(key)
        .and_then(|x| x.as_array())
        .map(|a| {
            a.iter()
                .filter_map(|i| i.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

impl Catalog {
    pub fn from_json_str(raw: &str) -> Result<Self, String> {
        let root = json::parse(raw).map_err(|e| e.to_string())?;
        let meta_v = root.get("meta").ok_or("missing meta")?;
        let meta = CatalogMeta {
            name: str_field(meta_v, "name"),
            upstream: str_field(meta_v, "upstream"),
            core_version: str_field(meta_v, "coreVersion"),
            react_peer: str_field(meta_v, "reactPeer"),
            stylex_peer: str_field(meta_v, "stylexPeer"),
            license: str_field(meta_v, "license"),
        };

        let mut components = Vec::new();
        if let Some(items) = root.get("components").and_then(|v| v.as_array()) {
            for item in items {
                let props = item
                    .get("props")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .map(|p| PropDoc {
                                name: str_field(p, "name"),
                                prop_type: str_field(p, "type"),
                                default_value: str_field(p, "defaultValue"),
                                required: p.get("required").and_then(|x| x.as_bool()).unwrap_or(false),
                                description: str_field(p, "description"),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                let best_practices = item
                    .get("bestPractices")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .map(|bp| BestPractice {
                                do_rule: bp.get("doRule").and_then(|x| x.as_bool()).unwrap_or(true),
                                text: str_field(bp, "text"),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                let accessibility = item
                    .get("accessibility")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .map(|r| A11yRule {
                                name: str_field(r, "name"),
                                criterion: str_field(r, "criterion"),
                                requirement: str_field(r, "requirement"),
                                description: str_field(r, "description"),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                let anatomy = item
                    .get("anatomy")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .map(|r| AnatomyPart {
                                name: str_field(r, "name"),
                                required: r.get("required").and_then(|x| x.as_bool()).unwrap_or(false),
                                description: str_field(r, "description"),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                components.push(ComponentDoc {
                    name: str_field(item, "name"),
                    display_name: str_field(item, "displayName"),
                    kind: str_field(item, "kind"),
                    category: str_field(item, "category"),
                    group: str_field(item, "group"),
                    import_path: str_field(item, "importPath"),
                    description: str_field(item, "description"),
                    keywords: str_vec_field(item, "keywords"),
                    props,
                    best_practices,
                    accessibility,
                    anatomy,
                    example_code: str_field(item, "exampleCode"),
                });
            }
        }

        let mut tokens = Vec::new();
        if let Some(items) = root.get("tokens").and_then(|v| v.as_array()) {
            for item in items {
                tokens.push(TokenDoc {
                    name: str_field(item, "name"),
                    family: str_field(item, "family"),
                    value: str_field(item, "value"),
                    light: str_field(item, "light"),
                    dark: str_field(item, "dark"),
                });
            }
        }

        let mut themes = Vec::new();
        if let Some(items) = root.get("themes").and_then(|v| v.as_array()) {
            for item in items {
                let fonts = item.get("fonts");
                let scale = item.get("typeScale");
                let mut tok_map = BTreeMap::new();
                if let Some(tmap) = item.get("tokens").and_then(|v| v.as_object()) {
                    for (k, v) in tmap {
                        tok_map.insert(
                            k.clone(),
                            ThemeTokenPair {
                                light: str_field(v, "light"),
                                dark: str_field(v, "dark"),
                            },
                        );
                    }
                }
                themes.push(ThemeDoc {
                    name: str_field(item, "name"),
                    display_name: str_field(item, "displayName"),
                    package_name: str_field(item, "packageName"),
                    description: str_field(item, "description"),
                    maintained: item.get("maintained").and_then(|x| x.as_bool()).unwrap_or(false),
                    color_modes: str_vec_field(item, "colorModes"),
                    font_body: fonts.map(|f| str_field(f, "body")).unwrap_or_default(),
                    font_heading: fonts.map(|f| str_field(f, "heading")).unwrap_or_default(),
                    font_code: fonts.map(|f| str_field(f, "code")).unwrap_or_default(),
                    scale_base: scale
                        .and_then(|sc| sc.get("base"))
                        .and_then(|x| x.as_f64())
                        .unwrap_or(14.0),
                    scale_ratio: scale
                        .and_then(|sc| sc.get("ratio"))
                        .and_then(|x| x.as_f64())
                        .unwrap_or(1.2),
                    tokens: tok_map,
                });
            }
        }

        let mut templates = Vec::new();
        if let Some(items) = root.get("templates").and_then(|v| v.as_array()) {
            for item in items {
                templates.push(TemplateDoc {
                    slug: str_field(item, "slug"),
                    name: str_field(item, "name"),
                    category: str_field(item, "category"),
                    description: str_field(item, "description"),
                    keywords: str_vec_field(item, "keywords"),
                    components: str_vec_field(item, "components"),
                    is_ready: item.get("isReady").and_then(|x| x.as_bool()).unwrap_or(true),
                });
            }
        }

        let mut docs = Vec::new();
        if let Some(items) = root.get("docs").and_then(|v| v.as_array()) {
            for item in items {
                let sections = item
                    .get("sections")
                    .and_then(|v| v.as_array())
                    .map(|a| {
                        a.iter()
                            .map(|sec| GuideSection {
                                title: str_field(sec, "title"),
                                body: str_field(sec, "body"),
                            })
                            .collect()
                    })
                    .unwrap_or_default();

                docs.push(GuideDoc {
                    slug: str_field(item, "slug"),
                    title: str_field(item, "title"),
                    description: str_field(item, "description"),
                    sections,
                });
            }
        }

        Ok(Catalog {
            meta,
            components,
            tokens,
            themes,
            templates,
            docs,
        })
    }

    pub fn find_component(&self, name: &str) -> Option<&ComponentDoc> {
        let lower = name.to_lowercase();
        self.components
            .iter()
            .find(|c| c.name.eq_ignore_ascii_case(name) || c.display_name.to_lowercase() == lower)
    }

    pub fn find_theme(&self, name: &str) -> Option<&ThemeDoc> {
        self.themes
            .iter()
            .find(|t| t.name.eq_ignore_ascii_case(name) || t.display_name.eq_ignore_ascii_case(name))
    }

    pub fn find_template(&self, slug: &str) -> Option<&TemplateDoc> {
        let lower = slug.to_lowercase();
        self.templates
            .iter()
            .find(|t| t.slug.eq_ignore_ascii_case(slug) || t.name.to_lowercase() == lower)
    }

    pub fn find_doc(&self, slug: &str) -> Option<&GuideDoc> {
        let lower = slug.to_lowercase();
        self.docs
            .iter()
            .find(|d| d.slug.eq_ignore_ascii_case(slug) || d.title.to_lowercase() == lower)
    }

    pub fn stats_json(&self) -> JsonValue {
        let comp_count = self.components.iter().filter(|c| c.kind == "component").count();
        let hook_count = self.components.iter().filter(|c| c.kind == "hook").count();
        let util_count = self.components.iter().filter(|c| c.kind == "utility").count();
        obj(vec![
            ("name", s(&self.meta.name)),
            ("upstream", s(&self.meta.upstream)),
            ("coreVersion", s(&self.meta.core_version)),
            ("reactPeer", s(&self.meta.react_peer)),
            ("stylexPeer", s(&self.meta.stylex_peer)),
            ("license", s(&self.meta.license)),
            (
                "counts",
                obj(vec![
                    ("components", n(comp_count)),
                    ("hooks", n(hook_count)),
                    ("utilities", n(util_count)),
                    ("totalApiEntries", n(self.components.len())),
                    ("tokens", n(self.tokens.len())),
                    ("themes", n(self.themes.len())),
                    ("templates", n(self.templates.len())),
                    ("docs", n(self.docs.len())),
                ]),
            ),
        ])
    }
}

impl ComponentDoc {
    pub fn summary_json(&self) -> JsonValue {
        obj(vec![
            ("name", s(&self.name)),
            ("displayName", s(&self.display_name)),
            ("kind", s(&self.kind)),
            ("category", s(&self.category)),
            ("group", s(&self.group)),
            ("importPath", s(&self.import_path)),
            ("description", s(&self.description)),
            ("propCount", n(self.props.len())),
            (
                "keywords",
                arr(self.keywords.iter().map(|k| s(k)).collect()),
            ),
        ])
    }

    pub fn detail_json(&self) -> JsonValue {
        obj(vec![
            ("name", s(&self.name)),
            ("displayName", s(&self.display_name)),
            ("kind", s(&self.kind)),
            ("category", s(&self.category)),
            ("group", s(&self.group)),
            ("importPath", s(&self.import_path)),
            ("description", s(&self.description)),
            ("exampleCode", s(&self.example_code)),
            (
                "keywords",
                arr(self.keywords.iter().map(|k| s(k)).collect()),
            ),
            (
                "props",
                arr(self
                    .props
                    .iter()
                    .map(|p| {
                        obj(vec![
                            ("name", s(&p.name)),
                            ("type", s(&p.prop_type)),
                            ("defaultValue", s(&p.default_value)),
                            ("required", b(p.required)),
                            ("description", s(&p.description)),
                        ])
                    })
                    .collect()),
            ),
            (
                "bestPractices",
                arr(self
                    .best_practices
                    .iter()
                    .map(|bp| obj(vec![("do", b(bp.do_rule)), ("text", s(&bp.text))]))
                    .collect()),
            ),
            (
                "accessibility",
                arr(self
                    .accessibility
                    .iter()
                    .map(|a| {
                        obj(vec![
                            ("name", s(&a.name)),
                            ("criterion", s(&a.criterion)),
                            ("requirement", s(&a.requirement)),
                            ("description", s(&a.description)),
                        ])
                    })
                    .collect()),
            ),
            (
                "anatomy",
                arr(self
                    .anatomy
                    .iter()
                    .map(|a| {
                        obj(vec![
                            ("name", s(&a.name)),
                            ("required", b(a.required)),
                            ("description", s(&a.description)),
                        ])
                    })
                    .collect()),
            ),
        ])
    }
}

impl TokenDoc {
    pub fn to_json(&self) -> JsonValue {
        obj(vec![
            ("name", s(&self.name)),
            ("family", s(&self.family)),
            ("value", s(&self.value)),
            ("light", s(&self.light)),
            ("dark", s(&self.dark)),
        ])
    }
}

impl ThemeDoc {
    pub fn summary_json(&self) -> JsonValue {
        obj(vec![
            ("name", s(&self.name)),
            ("displayName", s(&self.display_name)),
            ("packageName", s(&self.package_name)),
            ("description", s(&self.description)),
            ("maintained", b(self.maintained)),
            (
                "colorModes",
                arr(self.color_modes.iter().map(|m| s(m)).collect()),
            ),
            (
                "fonts",
                obj(vec![
                    ("body", s(&self.font_body)),
                    ("heading", s(&self.font_heading)),
                    ("code", s(&self.font_code)),
                ]),
            ),
            (
                "typeScale",
                obj(vec![
                    ("base", JsonValue::Number(self.scale_base)),
                    ("ratio", JsonValue::Number(self.scale_ratio)),
                ]),
            ),
            ("overrideCount", n(self.tokens.len())),
            (
                "cssEndpoint",
                s(format!("/api/themes/{}/tokens.css", self.name)),
            ),
        ])
    }

    pub fn detail_json(&self) -> JsonValue {
        let mut overrides = BTreeMap::new();
        for (k, pair) in &self.tokens {
            overrides.insert(
                k.clone(),
                obj(vec![("light", s(&pair.light)), ("dark", s(&pair.dark))]),
            );
        }
        obj(vec![
            ("name", s(&self.name)),
            ("displayName", s(&self.display_name)),
            ("packageName", s(&self.package_name)),
            ("description", s(&self.description)),
            ("maintained", b(self.maintained)),
            (
                "colorModes",
                arr(self.color_modes.iter().map(|m| s(m)).collect()),
            ),
            (
                "fonts",
                obj(vec![
                    ("body", s(&self.font_body)),
                    ("heading", s(&self.font_heading)),
                    ("code", s(&self.font_code)),
                ]),
            ),
            (
                "typeScale",
                obj(vec![
                    ("base", JsonValue::Number(self.scale_base)),
                    ("ratio", JsonValue::Number(self.scale_ratio)),
                ]),
            ),
            ("tokens", JsonValue::Object(overrides)),
            (
                "cssEndpoint",
                s(format!("/api/themes/{}/tokens.css", self.name)),
            ),
        ])
    }
}

impl TemplateDoc {
    pub fn to_json(&self) -> JsonValue {
        obj(vec![
            ("slug", s(&self.slug)),
            ("name", s(&self.name)),
            ("category", s(&self.category)),
            ("description", s(&self.description)),
            (
                "keywords",
                arr(self.keywords.iter().map(|k| s(k)).collect()),
            ),
            (
                "components",
                arr(self.components.iter().map(|c| s(c)).collect()),
            ),
            ("isReady", b(self.is_ready)),
            (
                "scaffoldCommand",
                s(format!("npx @astryxdesign/cli template {}", self.slug)),
            ),
        ])
    }
}

impl GuideDoc {
    pub fn summary_json(&self) -> JsonValue {
        obj(vec![
            ("slug", s(&self.slug)),
            ("title", s(&self.title)),
            ("description", s(&self.description)),
            ("sectionCount", n(self.sections.len())),
        ])
    }

    pub fn detail_json(&self) -> JsonValue {
        obj(vec![
            ("slug", s(&self.slug)),
            ("title", s(&self.title)),
            ("description", s(&self.description)),
            (
                "sections",
                arr(self
                    .sections
                    .iter()
                    .map(|sec| obj(vec![("title", s(&sec.title)), ("body", s(&sec.body))]))
                    .collect()),
            ),
        ])
    }
}
