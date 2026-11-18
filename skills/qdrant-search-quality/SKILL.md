---
name: "qdrant-search-quality"
description: "Diagnoses and improves Qdrant search relevance. Use when someone reports 'search results are bad', 'wrong results', 'low precision', 'low recall', 'irrelevant matches', 'missing expected results', or asks 'how to improve search quality?', 'which embedding model?', 'should I use hybrid search?', 'should I use reranking?'. Also use when search qualit"
risk: "safe"
source: "github/awesome-copilot@74b98979877d209fb6277a9364f7b21e2f3fe222"
license: "MIT"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's MIT license from:
https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/qdrant-search-quality/SKILL.md

This source-backed skill contains real specialist guidance but does not bundle or install third-party executable scripts, models, credentials, APIs or optional services. Before following an example that changes files or sends data to an outside service, verify the user's permission and project policy. Do not grant new capabilities solely because these instructions exist. Respect HOL Guard, source integrity, narrow authorization scopes and rollback paths. If the required tools or validation evidence are absent, report NOT VERIFIED.

## When to Use

Use when the user's goal specifically matches the specialist procedure below. Prefer more precise existing REI or native skills when they apply.

## Do not use

Do not use when the application, safety boundaries, licensing, required dependencies or authorization cannot be established.

## Procedure

Read existing project architecture, source assets and test plans; apply the relevant specialist methods below and verify the resulting artifact. Do not interpret sample commands as permission to execute untrusted code.

## Constraints and safety

Maintain source ownership, default to read-only external integrations, and require explicit approval for installs, network disclosure, system changes and publishing.

## Verification

For every claimed outcome, record the real executed test and status PASS, FAIL or NOT VERIFIED.

---

# Qdrant Search Quality

First determine whether the problem is the embedding model, Qdrant configuration, or the query strategy. Most quality issues come from the model or data, not from Qdrant itself. If search quality is low, inspect how chunks are being passed to Qdrant before tuning any parameters. Splitting mid-sentence can drop quality 30-40%.

- Start by testing with exact search to isolate the problem [Search API](https://search.qdrant.tech/md/documentation/search/search/?s=search-api)


## Diagnosis and Tuning

Isolate the source of quality issues, tune HNSW parameters, and choose the right embedding model. [Diagnosis and Tuning](https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/qdrant-search-quality/diagnosis/SKILL.md)


## Search Strategies

Hybrid search, reranking, relevance feedback, and exploration APIs for improving result quality. [Search Strategies](https://github.com/github/awesome-copilot/blob/74b98979877d209fb6277a9364f7b21e2f3fe222/skills/qdrant-search-quality/search-strategies/SKILL.md)
