//! Zero-dependency RFC-8259 JSON parser and serializer.

use std::collections::BTreeMap;
use std::fmt;

#[derive(Debug, Clone, PartialEq)]
pub enum JsonValue {
    Null,
    Bool(bool),
    Number(f64),
    String(String),
    Array(Vec<JsonValue>),
    Object(BTreeMap<String, JsonValue>),
}

impl JsonValue {
    pub fn as_str(&self) -> Option<&str> {
        match self {
            JsonValue::String(s) => Some(s.as_str()),
            _ => None,
        }
    }

    pub fn as_bool(&self) -> Option<bool> {
        match self {
            JsonValue::Bool(b) => Some(*b),
            _ => None,
        }
    }

    pub fn as_f64(&self) -> Option<f64> {
        match self {
            JsonValue::Number(n) => Some(*n),
            _ => None,
        }
    }

    pub fn as_u64(&self) -> Option<u64> {
        self.as_f64().map(|n| n as u64)
    }

    pub fn as_array(&self) -> Option<&[JsonValue]> {
        match self {
            JsonValue::Array(a) => Some(a.as_slice()),
            _ => None,
        }
    }

    pub fn as_object(&self) -> Option<&BTreeMap<String, JsonValue>> {
        match self {
            JsonValue::Object(m) => Some(m),
            _ => None,
        }
    }

    pub fn get(&self, key: &str) -> Option<&JsonValue> {
        self.as_object()?.get(key)
    }

    pub fn to_json_string(&self) -> String {
        let mut out = String::new();
        self.write_compact(&mut out);
        out
    }

    pub fn to_json_pretty(&self) -> String {
        let mut out = String::new();
        self.write_pretty(&mut out, 0);
        out
    }

    fn write_compact(&self, out: &mut String) {
        match self {
            JsonValue::Null => out.push_str("null"),
            JsonValue::Bool(b) => out.push_str(if *b { "true" } else { "false" }),
            JsonValue::Number(n) => {
                if n.is_finite() {
                    if n.fract() == 0.0 && *n >= (i64::MIN as f64) && *n <= (i64::MAX as f64) {
                        out.push_str(&(*n as i64).to_string());
                    } else {
                        out.push_str(&n.to_string());
                    }
                } else {
                    out.push_str("null");
                }
            }
            JsonValue::String(s) => write_escaped_string(s, out),
            JsonValue::Array(arr) => {
                out.push('[');
                for (i, v) in arr.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    v.write_compact(out);
                }
                out.push(']');
            }
            JsonValue::Object(map) => {
                out.push('{');
                for (i, (k, v)) in map.iter().enumerate() {
                    if i > 0 {
                        out.push(',');
                    }
                    write_escaped_string(k, out);
                    out.push(':');
                    v.write_compact(out);
                }
                out.push('}');
            }
        }
    }

    fn write_pretty(&self, out: &mut String, indent: usize) {
        match self {
            JsonValue::Array(arr) if !arr.is_empty() => {
                out.push_str("[\n");
                for (i, v) in arr.iter().enumerate() {
                    if i > 0 {
                        out.push_str(",\n");
                    }
                    for _ in 0..(indent + 2) {
                        out.push(' ');
                    }
                    v.write_pretty(out, indent + 2);
                }
                out.push('\n');
                for _ in 0..indent {
                    out.push(' ');
                }
                out.push(']');
            }
            JsonValue::Object(map) if !map.is_empty() => {
                out.push_str("{\n");
                for (i, (k, v)) in map.iter().enumerate() {
                    if i > 0 {
                        out.push_str(",\n");
                    }
                    for _ in 0..(indent + 2) {
                        out.push(' ');
                    }
                    write_escaped_string(k, out);
                    out.push_str(": ");
                    v.write_pretty(out, indent + 2);
                }
                out.push('\n');
                for _ in 0..indent {
                    out.push(' ');
                }
                out.push('}');
            }
            _ => self.write_compact(out),
        }
    }
}

pub fn write_escaped_string(s: &str, out: &mut String) {
    out.push('"');
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\u{08}' => out.push_str("\\b"),
            '\u{0C}' => out.push_str("\\f"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c if (c as u32) < 0x20 => {
                out.push_str(&format!("\\u{:04x}", c as u32));
            }
            c => out.push(c),
        }
    }
    out.push('"');
}

pub fn obj(pairs: Vec<(&str, JsonValue)>) -> JsonValue {
    let mut map = BTreeMap::new();
    for (k, v) in pairs {
        map.insert(k.to_string(), v);
    }
    JsonValue::Object(map)
}

pub fn s(val: impl Into<String>) -> JsonValue {
    JsonValue::String(val.into())
}

pub fn n(val: usize) -> JsonValue {
    JsonValue::Number(val as f64)
}

pub fn b(val: bool) -> JsonValue {
    JsonValue::Bool(val)
}

pub fn arr(items: Vec<JsonValue>) -> JsonValue {
    JsonValue::Array(items)
}

#[derive(Debug)]
pub struct ParseError {
    pub msg: String,
    pub pos: usize,
}

impl fmt::Display for ParseError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "JSON parse error at byte {}: {}", self.pos, self.msg)
    }
}

pub fn parse(input: &str) -> Result<JsonValue, ParseError> {
    let mut p = Parser {
        bytes: input.as_bytes(),
        pos: 0,
    };
    let val = p.parse_value()?;
    p.skip_ws();
    if p.pos != p.bytes.len() {
        return Err(p.err("trailing characters after JSON value"));
    }
    Ok(val)
}

struct Parser<'a> {
    bytes: &'a [u8],
    pos: usize,
}

impl<'a> Parser<'a> {
    fn err(&self, msg: &str) -> ParseError {
        ParseError {
            msg: msg.to_string(),
            pos: self.pos,
        }
    }

    fn peek(&self) -> Option<u8> {
        self.bytes.get(self.pos).copied()
    }

    fn next(&mut self) -> Option<u8> {
        let b = self.peek()?;
        self.pos += 1;
        Some(b)
    }

    fn skip_ws(&mut self) {
        while let Some(b) = self.peek() {
            if matches!(b, b' ' | b'\t' | b'\n' | b'\r') {
                self.pos += 1;
            } else {
                break;
            }
        }
    }

    fn parse_value(&mut self) -> Result<JsonValue, ParseError> {
        self.skip_ws();
        match self.peek() {
            Some(b'n') => self.parse_literal(b"null", JsonValue::Null),
            Some(b't') => self.parse_literal(b"true", JsonValue::Bool(true)),
            Some(b'f') => self.parse_literal(b"false", JsonValue::Bool(false)),
            Some(b'"') => self.parse_string().map(JsonValue::String),
            Some(b'[') => self.parse_array(),
            Some(b'{') => self.parse_object(),
            Some(b'-' | b'0'..=b'9') => self.parse_number(),
            Some(_) => Err(self.err("unexpected token")),
            None => Err(self.err("unexpected EOF")),
        }
    }

    fn parse_literal(&mut self, expected: &[u8], value: JsonValue) -> Result<JsonValue, ParseError> {
        if self.bytes[self.pos..].starts_with(expected) {
            self.pos += expected.len();
            Ok(value)
        } else {
            Err(self.err("invalid literal"))
        }
    }

    fn parse_number(&mut self) -> Result<JsonValue, ParseError> {
        let start = self.pos;
        if self.peek() == Some(b'-') {
            self.pos += 1;
        }
        while let Some(b) = self.peek() {
            if matches!(b, b'0'..=b'9' | b'.' | b'e' | b'E' | b'+' | b'-') {
                self.pos += 1;
            } else {
                break;
            }
        }
        let slice = std::str::from_utf8(&self.bytes[start..self.pos])
            .map_err(|_| self.err("invalid utf8 in number"))?;
        let num = slice
            .parse::<f64>()
            .map_err(|_| self.err("invalid number"))?;
        Ok(JsonValue::Number(num))
    }

    fn parse_hex4(&mut self) -> Result<u16, ParseError> {
        if self.pos + 4 > self.bytes.len() {
            return Err(self.err("incomplete unicode escape"));
        }
        let hex = std::str::from_utf8(&self.bytes[self.pos..self.pos + 4])
            .map_err(|_| self.err("invalid unicode escape"))?;
        self.pos += 4;
        u16::from_str_radix(hex, 16).map_err(|_| self.err("invalid hex in unicode escape"))
    }

    fn parse_string(&mut self) -> Result<String, ParseError> {
        if self.next() != Some(b'"') {
            return Err(self.err("expected '\"'"));
        }
        let mut out = String::new();
        while self.pos < self.bytes.len() {
            let b = self.bytes[self.pos];
            if b == b'"' {
                self.pos += 1;
                return Ok(out);
            }
            if b == b'\\' {
                self.pos += 1;
                let esc = self.next().ok_or_else(|| self.err("unterminated escape"))?;
                match esc {
                    b'"' => out.push('"'),
                    b'\\' => out.push('\\'),
                    b'/' => out.push('/'),
                    b'b' => out.push('\u{08}'),
                    b'f' => out.push('\u{0C}'),
                    b'n' => out.push('\n'),
                    b'r' => out.push('\r'),
                    b't' => out.push('\t'),
                    b'u' => {
                        let code = self.parse_hex4()?;
                        if (0xD800..=0xDBFF).contains(&code) {
                            if self.bytes.get(self.pos..self.pos + 2) == Some(b"\\u") {
                                self.pos += 2;
                                let low = self.parse_hex4()?;
                                if (0xDC00..=0xDFFF).contains(&low) {
                                    let combined = 0x10000
                                        + (((code as u32 - 0xD800) << 10)
                                            | (low as u32 - 0xDC00));
                                    if let Some(ch) = char::from_u32(combined) {
                                        out.push(ch);
                                    }
                                }
                            }
                        } else if let Some(ch) = char::from_u32(code as u32) {
                            out.push(ch);
                        }
                    }
                    _ => return Err(self.err("unknown escape sequence")),
                }
            } else {
                // Decode UTF-8 char chunk directly for speed and Unicode correctness
                let start = self.pos;
                self.pos += 1;
                while self.pos < self.bytes.len()
                    && self.bytes[self.pos] != b'"'
                    && self.bytes[self.pos] != b'\\'
                {
                    self.pos += 1;
                }
                let segment = std::str::from_utf8(&self.bytes[start..self.pos])
                    .map_err(|_| self.err("invalid UTF-8 in string"))?;
                out.push_str(segment);
            }
        }
        Err(self.err("unterminated string"))
    }

    fn parse_array(&mut self) -> Result<JsonValue, ParseError> {
        self.pos += 1; // skip '['
        let mut items = Vec::new();
        self.skip_ws();
        if self.peek() == Some(b']') {
            self.pos += 1;
            return Ok(JsonValue::Array(items));
        }
        loop {
            items.push(self.parse_value()?);
            self.skip_ws();
            match self.next() {
                Some(b',') => continue,
                Some(b']') => return Ok(JsonValue::Array(items)),
                _ => return Err(self.err("expected ',' or ']'")),
            }
        }
    }

    fn parse_object(&mut self) -> Result<JsonValue, ParseError> {
        self.pos += 1; // skip '{'
        let mut map = BTreeMap::new();
        self.skip_ws();
        if self.peek() == Some(b'}') {
            self.pos += 1;
            return Ok(JsonValue::Object(map));
        }
        loop {
            self.skip_ws();
            let key = self.parse_string()?;
            self.skip_ws();
            if self.next() != Some(b':') {
                return Err(self.err("expected ':'"));
            }
            let val = self.parse_value()?;
            map.insert(key, val);
            self.skip_ws();
            match self.next() {
                Some(b',') => continue,
                Some(b'}') => return Ok(JsonValue::Object(map)),
                _ => return Err(self.err("expected ',' or '}'")),
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn roundtrip_complex_json() {
        let raw = r#"{"name":"Astryx","version":0.7,"ready":true,"tags":["ui","stylex"],"nested":{"emoji":"\uD83C\uDFF0"}}"#;
        let parsed = parse(raw).expect("parse ok");
        assert_eq!(parsed.get("name").and_then(|v| v.as_str()), Some("Astryx"));
        assert_eq!(parsed.get("ready").and_then(|v| v.as_bool()), Some(true));
        assert_eq!(
            parsed
                .get("nested")
                .and_then(|v| v.get("emoji"))
                .and_then(|v| v.as_str()),
            Some("🏰")
        );
        let reparsed = parse(&parsed.to_json_string()).expect("reparse ok");
        assert_eq!(parsed, reparsed);
    }
}
