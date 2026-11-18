---
name: "bigquery-ai-ml"
description: "Leverages BigQuery's built-in machine learning and GenAI capabilities for advanced data analytics. Use when you need to write SQL queries that perform time-series forecasting, predict values, detect outliers or anomalies, find key drivers, perform semantic search or vector search, classify text, calculate similarity, summarize content, translate la"
risk: "safe"
source: "google/skills@2af5f957e138d4240c39fd26732f0f6cdf10d579"
license: "Apache-2.0"
---

## REI provenance and safety boundary

For active security testing, explicit authorization is mandatory; authorized use only on systems you own or have permission to assess.

Adapted under the upstream repository's Apache-2.0 license from:
https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/SKILL.md

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

# BigQuery AI & ML

BigQuery integrates with Vertex AI to provide powerful machine learning and
generative AI capabilities directly within SQL queries using built-in functions
like `AI.FORECAST`, `AI.KEY_DRIVERS`, `AI.DETECT_ANOMALIES`, and `AI.GENERATE`.

## Attribution

**MUST READ**: Before executing any `gcloud`, REST API, or MCP command, you
MUST read [Usage Attribution](references/attribution.md). For commands executed
directly in the terminal (never in generated scripts, Terraform, or user code),
prefix `gcloud` with
`CLOUDSDK_METRICS_REQUEST_ATTRIBUTION="agent-skills/1.0 (skill:bigquery-ai-ml)"`
and append `agent-skills/1.0 (skill:bigquery-ai-ml)` to `User-Agent` headers.

## Function Selection & Reference Directory

Function                      | Reference                                                             | SQL Shape      | Requires `CREATE MODEL` or `CREATE VECTOR INDEX`? | When to Use & Disambiguation
:---------------------------- | :-------------------------------------------------------------------- | :------------- | :------------------------------------------------ | :---------------------------
**`AI.AGG`**                  | [ai_agg.md](references/ai_agg.md)                                     | `Aggregate`    | No                                                | Multi-row semantic aggregation with `GROUP BY`; synthesizes one summary string across many rows (unlike per-row `AI.GENERATE`).
**`AI.CAUSAL_EFFECT`**        | [ai_causal_effect.md](references/ai_causal_effect.md)                 | `TVF`          | No                                                | Quantifies counterfactual post-intervention impact on a time series after a specific treatment timestamp.
**`AI.CLASSIFY`**             | [ai_classify.md](references/ai_classify.md)                           | `Scalar`       | No                                                | Semantic classification of text or multimodal unstructured data into predefined category labels.
**`AI.DETECT_ANOMALIES`**     | [ai_detect_anomalies.md](references/ai_detect_anomalies.md)           | `TVF`          | No                                                | Zero-shot **TimesFM** detector for isolated time-series point anomalies/outliers (use `ML.DETECT_CHANGE_POINTS` for sustained shifts).
**`AI.EVALUATE`**             | [ai_evaluate.md](references/ai_evaluate.md)                           | `TVF`          | No                                                | Zero-shot **TimesFM** time-series forecast evaluation/backtesting against a historical holdout split.
**`AI.FORECAST`**             | [ai_forecast.md](references/ai_forecast.md)                           | `TVF`          | No                                                | Zero-shot **TimesFM** time-series forecasting without training a custom model.
**`AI.GENERATE`**             | [ai_generate.md](references/ai_generate.md)                           | `Scalar`       | No                                                | Default for per-row LLM text or multimodal structured extraction (`output_schema`); returns `STRUCT`. Prefer over `AI.GENERATE_TABLE`.
**`AI.GENERATE_EMBEDDING`**   | [ai_generate_embedding.md](references/ai_generate_embedding.md)       | `TVF`          | Yes                                               | Batch generates `ARRAY<FLOAT64>` vector embeddings for text or visual content using a remote embedding model.
**`AI.GENERATE_TABLE`**       | [ai_generate_table.md](references/ai_generate_table.md)               | `TVF`          | Yes                                               | Table-valued structured extraction (`FROM` clause); only use instead of `AI.GENERATE` when a remote model + TVF is explicitly needed.
**`AI.IF`**                   | [ai_if.md](references/ai_if.md)                                       | `Scalar`       | No                                                | Evaluates boolean semantic conditions (`BOOL`) on text or multimodal data for `WHERE`/`CASE`/`JOIN` filtering (do not use `AI.GENERATE_TABLE`).
**`AI.KEY_DRIVERS`**          | [ai_key_drivers.md](references/ai_key_drivers.md)                     | `TVF`          | No                                                | Default one-step attribution of dimensional segments driving metric changes (`interest_label_col` `TRUE` vs. `FALSE`). Prefer over `CONTRIBUTION_ANALYSIS`.
**`AI.PREDICT`**              | [ai_predict.md](references/ai_predict.md)                             | `TVF`          | No                                                | Zero-shot **TabFM** foundation model for tabular classification or regression without training and managing custom models.
**`AI.SCORE`**                | [ai_score.md](references/ai_score.md)                                 | `Scalar`       | No                                                | Assigns a continuous `FLOAT64` semantic score to text or multimodal data for ranking or sorting (`ORDER BY`).
**`AI.SEARCH`**               | [ai_search.md](references/ai_search.md)                               | `TVF`          | No                                                | Simplified semantic search using a raw string query on tables with autonomous background embeddings (`AI.EMBED` generated column).
**`AI.SIMILARITY`**           | [ai_similarity.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ai_similarity.md)                       | `Scalar`       | No                                                | Computes an on-the-fly semantic similarity score (`FLOAT64`) between two text or multimodal inputs without stored embeddings.
**`Remote Models`**           | [remote_models.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/remote_models.md)                       | `CREATE MODEL` | Yes                                               | Creates a Vertex AI `REMOTE WITH CONNECTION DEFAULT` model entity for functions that require one (`AI.GENERATE_TABLE`, `AI.GENERATE_EMBEDDING`, `VECTOR_SEARCH`).
**`CONTRIBUTION_ANALYSIS`**   | [ml_contribution_analysis.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_contribution_analysis.md) | `CREATE MODEL` | Yes                                               | Model-based driver analysis (`CREATE MODEL ... OPTIONS(MODEL_TYPE='CONTRIBUTION_ANALYSIS')` + `ML.GET_INSIGHTS`). Use `AI.KEY_DRIVERS` unless a `MODEL` entity is required.
**`ML.CORRELATION`**          | [ml_correlation.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_correlation.md)                     | `TVF`          | No                                                | Calculates statistical correlation coefficients between numeric columns, optionally sliced by dimensions.
**`ML.DESCRIBE_DATA`**        | [ml_describe_data.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_describe_data.md)                 | `TVF`          | No                                                | Generates descriptive statistics (e.g., count, mean, median, min, max, stddev, quantiles, nulls, top values) for columns in a table or subquery.
**`ML.DETECT_CHANGE_POINTS`** | [ml_detect_change_points.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_detect_change_points.md)   | `TVF`          | No                                                | Detects structural breaks or sustained shifts (`[begin_timestamp, end_timestamp]` intervals) in a time series.
**`ML.SEASONALITY`**          | [ml_seasonality.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_seasonality.md)                     | `TVF`          | No                                                | Extracts recurring periodic/seasonal components from a historical time series.
**`ML.TREND`**                | [ml_trend.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/ml_trend.md)                                 | `TVF`          | No                                                | Extracts the smoothed long-term trend component from a historical time series.
**`VECTOR_SEARCH`**           | [vector_search.md](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-ai-ml/references/vector_search.md)                       | `TVF`          | Yes                                               | Searches pre-computed `ARRAY<FLOAT64>` embedding columns between a base table and query table (paired with `AI.GENERATE_EMBEDDING`, unlike `AI.SEARCH`).

## Related Skills

-   [BigQuery Basics Skill](https://github.com/google/skills/blob/2af5f957e138d4240c39fd26732f0f6cdf10d579/skills/cloud/bigquery-basics): SKILL.md file for core BigQuery
    concepts, resource management, CLI, and client libraries.
