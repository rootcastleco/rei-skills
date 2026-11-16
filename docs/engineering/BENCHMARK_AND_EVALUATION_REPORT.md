# REI Skills — Hybrid Router Benchmark & Evaluation Report

**Dataset:** `data/benchmarks/routing-benchmark-v1.json` (260 labeled tasks across `train` = 80, `dev` = 60, `eval` = 120 held-out)  
**Evaluation Harness:** `scripts/evaluate-router.js` (`data/benchmarks/routing-evaluation-report.json`) & `lib/evaluation-engine.js`

---

## 1. Summary of Targets vs Measured Results

| Target Metric | Target Requirement | Hybrid Held-Out `eval` Result | Status |
| :--- | :--- | :--- | :--- |
| **Held-Out Recall@3** | `>= 85.0%` | **`96.43%`** (+5.36 pp vs Legacy `91.07%`) | **PASS** |
| **Critical-Risk Misrouting** | `0` under `safeOnly: true` | **`0`** (`0.0%`) | **PASS** |
| **Out-of-Scope False Positive Rate** | `<= Legacy` (`37.5%`) | **`0.0%`** (-37.50 pp reduction) | **PASS** |
| **Turkish Recall@3 (`positive_tr`)** | Bilingual parity | **`100.0%`** on `eval` (`97.37%` overall vs Legacy `65.79%`) | **PASS** |
| **Routing Latency (`p95`)** | Interactive CLI/MCP budget | **`2.919 ms`** (`p95LatencyRatio = 0.112` vs Legacy `26.035 ms`) | **PASS** |

---

## 2. Split-by-Split Comparison (Legacy vs Hybrid Semantic Router)

### Legacy Substring Router (`engine: "legacy"`)

| Split | Tasks | Recall@3 | MRR | nDCG@5 | Out-of-Scope FPR | Crit Misroute | `p50` (ms) | `p95` (ms) | Heap Delta (MB) | `positive_tr` R@3 | Failures |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `train` | 80 | 88.89% | 0.8412 | 0.7376 | 25.0% | 0 | 15.193 | 31.103 | 9.202 | 60.00% | 10 |
| `dev` | 60 | 89.29% | 0.8603 | 0.7854 | 25.0% | 0 | 15.105 | 25.549 | -2.679 | 62.50% | 7 |
| `eval` (held-out) | 120 | 91.07% | 0.8375 | 0.7587 | 37.5% | 0 | 15.973 | 26.035 | 0.736 | 70.00% | 13 |
| **`all`** | **260** | **90.00%** | **0.8439** | **0.7586** | **30.0%** | **0** | **15.081** | **25.226** | **-3.692** | **65.79%** | **30** |

### Hybrid BM25 + Offline Semantic Router (`engine: "hybrid"`)

| Split | Tasks | Recall@3 | MRR | nDCG@5 | Out-of-Scope FPR | Crit Misroute | `p50` (ms) | `p95` (ms) | Heap Delta (MB) | `positive_tr` R@3 | Failures |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `train` | 80 | 98.61% | 0.9132 | 0.8457 | 0.0% | 0 | 1.407 | 3.379 | -1.475 | 100.00% | 1 |
| `dev` | 60 | 94.64% | 0.8786 | 0.8214 | 0.0% | 0 | 1.261 | 3.590 | 1.192 | 87.50% | 3 |
| `eval` (held-out) | 120 | 96.43% | 0.8897 | 0.8456 | 0.0% | 0 | 1.267 | 2.919 | -3.604 | 100.00% | 4 |
| **`all`** | **260** | **96.67%** | **0.8942** | **0.8400** | **0.0%** | **0** | **1.073** | **2.648** | **0.573** | **97.37%** | **8** |

---

## 3. Held-Out `eval` Query-Type Breakdown (Hybrid)

Measured across the 120 held-out tasks in `data/benchmarks/routing-evaluation-report.json`:

- `positive_en` (71 tasks): Recall@3 hit rate `97.18%`, MRR `0.8890`, nDCG@5 `0.8626`
- `positive_tr` (20 tasks): Recall@3 hit rate `100.00%`, MRR `0.9083`, nDCG@5 `0.8973`
- `safety_critical_filter` (8 tasks): Recall@3 hit rate `100.00%`, MRR `0.8750`, nDCG@5 `0.8312`, Critical misroute `0`
- `ambiguous_multi_domain` (7 tasks): Recall@3 hit rate `85.71%`, MRR `0.8857`, nDCG@5 `0.6246`
- `multilingual_mixed` (6 tasks): Recall@3 hit rate `83.33%`, MRR `0.8611`, nDCG@5 `0.7484`
- `negative_out_of_scope` (8 tasks): False positive rate `0.0%` (`high_uncertainty_or_out_of_scope` triggered cleanly)

Remaining held-out `eval` failure samples logged for continuous improvement follow-up (`failureCount = 4`):
- `ev-069`: Node.js microservices backend API & GraphQL architecture (`positive_en`)
- `ev-094`: SPICE simülasyonu ile osiloskop ölçüm dalga formu karşılaştırması (`multilingual_mixed`)
- `ev-103`: BLE vibration sensor to outage-safe timeseries pipeline (`ambiguous_multi_domain`)

*(Optional external `embeddingProvider` hook is supported in `lib/hybrid-router.js`; only deterministic offline mode was benchmarked above with zero cloud API calls.)*
