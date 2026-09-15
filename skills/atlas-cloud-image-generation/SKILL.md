---
name: atlas-cloud-image-generation
description: "Generate an image through Atlas Cloud with live model validation, one-shot submission, and bounded result polling."
source: rootcastle-rei
risk: safe
category: infrastructure
---

# Atlas Cloud Image Generation

## Purpose

Generate an image with Atlas Cloud while keeping the asynchronous API workflow safe:

1. Read the live model catalog and the selected model's schema.
2. Submit exactly one billable generation request without automatic retries.
3. Poll the prediction endpoint with bounded retries.
4. Download the first completed image and verify its file signature.

The included helper uses only the Python standard library. Atlas Cloud remains an optional provider and does not change any other image-generation setup.

## When to Use

Use this skill when the user asks an agent to:

- Generate an image through Atlas Cloud.
- Add a guarded Atlas Cloud text-to-image step to a local workflow.
- Validate a live Atlas Cloud model before making a paid request.
- Poll an asynchronous Atlas Cloud image prediction and save its output.

Do not use it for image editing, image-to-image input, video generation, or workflows that need more than one output image.

## Requirements

- Python 3.9 or newer.
- An Atlas Cloud API key in `ATLASCLOUD_API_KEY` or `ATLAS_CLOUD_API_KEY`.
- Outbound HTTPS access to `api.atlascloud.ai` and the returned image host.

Never put an API key in a command, source file, prompt, or committed environment file.

## Usage

Run the helper from this skill directory:

```bash
export ATLASCLOUD_API_KEY="..."
python3 scripts/generate_image.py \
  --prompt "A red paper kite above a quiet coastal village, editorial illustration" \
  --aspect-ratio 3:2 \
  --resolution 1k \
  --output generated-kite
```

The command prints the prediction ID and final file path. If `--output` has no suffix, the helper adds `.png`, `.jpg`, or `.webp` after inspecting the downloaded bytes.

The default model is `google/nano-banana-pro/text-to-image-developer`. The helper refuses to submit if that model is absent from the live catalog, hidden from the console, or its live input schema no longer accepts the requested fields.

## Workflow

1. Confirm the API key environment variable is present.
2. Fetch `GET /api/v1/models` with bounded retries.
3. Fetch the model's live OpenAPI schema with bounded retries.
4. Validate `model`, `prompt`, `aspect_ratio`, and `resolution` against that schema.
5. Submit one `POST /api/v1/model/generateImage` request. The helper never retries this POST because another request could create a second billable task.
6. Poll `GET /api/v1/model/prediction/{id}` until completion, failure, or timeout.
7. Download the first output URL with bounded retries and verify the image signature before writing it.

## Limitations

- Supports one verified text-to-image model and the fields exposed by its live schema.
- Downloads only the first URL in `outputs`.
- Does not retry generation submissions, including timeouts where the server outcome is unknown.
- Does not resume polling after the local process exits; retain the printed prediction ID for manual recovery.
- Does not support base64 outputs, synchronous mode, input images, or video generation.
- A completed prediction can still fail locally if the output host is unavailable or returns unsupported bytes.

---

> 🏰 **Rei Skills** — Curated by [Rootcastle Engineering & Innovation](https://www.rootcastle.com) | Batuhan Ayrıbaş
> Engineering Beyond Boundaries | admin@rootcastle.com
