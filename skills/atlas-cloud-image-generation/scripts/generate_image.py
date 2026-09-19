#!/usr/bin/env python3
"""Generate one Atlas Cloud image without retrying the billable POST."""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path
from typing import Any, Callable
from urllib.error import HTTPError, URLError
from urllib.request import Request, build_opener


API_BASE = "https://api.atlascloud.ai"
MODEL = "google/nano-banana-pro/text-to-image-developer"
USER_AGENT = "rei-skills-atlas-image/1.0"
TRANSIENT_HTTP_STATUSES = {408, 425, 429, 500, 502, 503, 504}
TERMINAL_FAILURE_STATUSES = {"canceled", "cancelled", "failed", "error"}


class AtlasError(RuntimeError):
    """Raised when Atlas Cloud cannot complete the requested workflow."""


def _api_key() -> str:
    key = os.environ.get("ATLASCLOUD_API_KEY") or os.environ.get("ATLAS_CLOUD_API_KEY")
    if not key:
        raise AtlasError("Set ATLASCLOUD_API_KEY or ATLAS_CLOUD_API_KEY before running this helper.")
    return key


def _read_json(response: Any) -> dict[str, Any]:
    try:
        value = json.loads(response.read().decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise AtlasError("The server returned an invalid JSON response.") from exc
    if not isinstance(value, dict):
        raise AtlasError("The server returned an unexpected JSON response.")
    return value


def _open_get(
    request: Request,
    *,
    opener: Any,
    retries: int = 3,
    timeout: float = 30,
    sleep: Callable[[float], None] = time.sleep,
) -> Any:
    """Open a GET request with bounded retry for transient failures only."""
    for attempt in range(retries + 1):
        try:
            return opener.open(request, timeout=timeout)
        except HTTPError as exc:
            retryable = exc.code in TRANSIENT_HTTP_STATUSES
            if not retryable or attempt == retries:
                raise AtlasError(f"GET {request.full_url} failed with HTTP {exc.code}.") from exc
        except URLError as exc:
            if attempt == retries:
                raise AtlasError(f"GET {request.full_url} failed: {exc.reason}") from exc
        sleep(2**attempt)
    raise AssertionError("bounded retry loop exhausted unexpectedly")


def _get_json(url: str, *, opener: Any, sleep: Callable[[float], None] = time.sleep) -> dict[str, Any]:
    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with _open_get(request, opener=opener, sleep=sleep) as response:
        return _read_json(response)


def _response_data(body: dict[str, Any]) -> dict[str, Any]:
    data = body.get("data", body)
    if not isinstance(data, dict):
        raise AtlasError("The Atlas Cloud response has no object-valued data field.")
    return data


def load_live_schema(*, opener: Any, sleep: Callable[[float], None] = time.sleep) -> dict[str, Any]:
    catalog = _get_json(f"{API_BASE}/api/v1/models", opener=opener, sleep=sleep)
    models = catalog.get("data", catalog)
    if isinstance(models, dict):
        models = models.get("models") or models.get("items") or models.get("list") or []
    if not isinstance(models, list):
        raise AtlasError("The live model catalog has an unexpected shape.")

    entry = next((item for item in models if isinstance(item, dict) and item.get("model") == MODEL), None)
    if not entry:
        raise AtlasError(f"Model {MODEL} is not present in the live Atlas Cloud catalog.")
    if entry.get("display_console") is not True:
        raise AtlasError(f"Model {MODEL} is not currently available for console/API use.")
    schema_url = entry.get("schema")
    if not isinstance(schema_url, str) or not schema_url.startswith("https://"):
        raise AtlasError(f"Model {MODEL} has no usable live schema URL.")
    return _get_json(schema_url, opener=opener, sleep=sleep)


def validate_payload(payload: dict[str, Any], schema: dict[str, Any]) -> None:
    try:
        input_schema = schema["components"]["schemas"]["Input"]
        properties = input_schema["properties"]
    except (KeyError, TypeError) as exc:
        raise AtlasError("The live model schema has no Input properties.") from exc

    required = input_schema.get("required", [])
    missing = [field for field in required if field not in payload]
    if missing:
        raise AtlasError(f"The request is missing required live-schema fields: {', '.join(missing)}")

    unsupported = sorted(set(payload) - set(properties))
    if unsupported:
        raise AtlasError(f"The live model schema does not accept: {', '.join(unsupported)}")

    for field, value in payload.items():
        allowed = properties.get(field, {}).get("enum")
        if allowed and value not in allowed:
            raise AtlasError(f"Invalid {field}={value!r}; allowed values: {', '.join(map(str, allowed))}")


def submit_once(payload: dict[str, Any], *, opener: Any, api_key: str) -> str:
    """Submit exactly once. Deliberately contains no retry loop."""
    request = Request(
        f"{API_BASE}/api/v1/model/generateImage",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": USER_AGENT,
        },
        method="POST",
    )
    try:
        with opener.open(request, timeout=60) as response:
            data = _response_data(_read_json(response))
    except HTTPError as exc:
        raise AtlasError(f"Generation POST failed with HTTP {exc.code}; it was not retried.") from exc
    except URLError as exc:
        raise AtlasError(f"Generation POST outcome is unknown ({exc.reason}); it was not retried.") from exc

    prediction_id = data.get("id")
    if not isinstance(prediction_id, str) or not prediction_id:
        raise AtlasError("Generation POST returned no prediction ID; it was not retried.")
    return prediction_id


def poll_prediction(
    prediction_id: str,
    *,
    opener: Any,
    api_key: str,
    poll_interval: float,
    max_polls: int,
    sleep: Callable[[float], None] = time.sleep,
) -> str:
    url = f"{API_BASE}/api/v1/model/prediction/{prediction_id}"
    for poll_number in range(1, max_polls + 1):
        request = Request(
            url,
            headers={"Authorization": f"Bearer {api_key}", "User-Agent": USER_AGENT},
            method="GET",
        )
        with _open_get(request, opener=opener, sleep=sleep) as response:
            data = _response_data(_read_json(response))
        status = str(data.get("status", "")).lower()
        print(f"poll {poll_number}/{max_polls}: {status or 'unknown'}", file=sys.stderr)
        if status == "completed":
            outputs = data.get("outputs")
            if not isinstance(outputs, list) or not outputs or not isinstance(outputs[0], str):
                raise AtlasError("The completed prediction returned no output URL.")
            return outputs[0]
        if status in TERMINAL_FAILURE_STATUSES:
            detail = data.get("error") or data.get("message") or "no error detail"
            raise AtlasError(f"Prediction {prediction_id} ended with {status}: {detail}")
        if poll_number < max_polls:
            sleep(poll_interval)
    raise AtlasError(f"Prediction {prediction_id} did not finish after {max_polls} polls.")


def _image_extension(content: bytes) -> str:
    if content.startswith(b"\x89PNG\r\n\x1a\n"):
        return ".png"
    if content.startswith(b"\xff\xd8\xff"):
        return ".jpg"
    if len(content) >= 12 and content[:4] == b"RIFF" and content[8:12] == b"WEBP":
        return ".webp"
    raise AtlasError("The output URL did not return a supported PNG, JPEG, or WebP image.")


def download_image(
    url: str,
    output: Path,
    *,
    opener: Any,
    sleep: Callable[[float], None] = time.sleep,
) -> Path:
    request = Request(url, headers={"User-Agent": USER_AGENT}, method="GET")
    with _open_get(request, opener=opener, timeout=60, sleep=sleep) as response:
        content = response.read()
    extension = _image_extension(content)
    final_path = output.with_suffix(extension)
    final_path.parent.mkdir(parents=True, exist_ok=True)
    final_path.write_bytes(content)
    return final_path


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--prompt", required=True, help="Positive text-to-image prompt")
    parser.add_argument("--aspect-ratio", default="1:1")
    parser.add_argument("--resolution", default="1k")
    parser.add_argument("--output", type=Path, default=Path("atlas-image"))
    parser.add_argument("--poll-interval", type=float, default=3.0)
    parser.add_argument("--max-polls", type=int, default=40)
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    if args.poll_interval < 0 or args.max_polls < 1:
        raise AtlasError("--poll-interval must be non-negative and --max-polls must be positive.")

    opener = build_opener()
    payload = {
        "model": MODEL,
        "prompt": args.prompt,
        "aspect_ratio": args.aspect_ratio,
        "resolution": args.resolution,
    }
    schema = load_live_schema(opener=opener)
    validate_payload(payload, schema)
    prediction_id = submit_once(payload, opener=opener, api_key=_api_key())
    print(f"prediction_id={prediction_id}")
    output_url = poll_prediction(
        prediction_id,
        opener=opener,
        api_key=_api_key(),
        poll_interval=args.poll_interval,
        max_polls=args.max_polls,
    )
    final_path = download_image(output_url, args.output, opener=opener)
    print(f"output={final_path.resolve()}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except AtlasError as exc:
        print(f"error: {exc}", file=sys.stderr)
        raise SystemExit(1)
