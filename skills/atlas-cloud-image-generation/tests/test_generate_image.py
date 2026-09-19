import importlib.util
import io
import json
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from urllib.error import URLError


SCRIPT = Path(__file__).parents[1] / "scripts" / "generate_image.py"
SPEC = importlib.util.spec_from_file_location("generate_image", SCRIPT)
generate_image = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(generate_image)


class Response(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()


def json_response(value):
    return Response(json.dumps(value).encode())


class FakeOpener:
    def __init__(self, responses):
        self.responses = list(responses)
        self.requests = []

    def open(self, request, timeout):
        self.requests.append((request, timeout))
        response = self.responses.pop(0)
        if isinstance(response, Exception):
            raise response
        return response


class GenerateImageTests(unittest.TestCase):
    def test_submit_posts_exactly_once(self):
        opener = FakeOpener([json_response({"code": 200, "data": {"id": "pred-1"}})])

        prediction_id = generate_image.submit_once(
            {"model": generate_image.MODEL, "prompt": "kite"},
            opener=opener,
            api_key="test-key",
        )

        self.assertEqual(prediction_id, "pred-1")
        self.assertEqual(len(opener.requests), 1)
        self.assertEqual(opener.requests[0][0].method, "POST")

    def test_submit_network_error_is_not_retried(self):
        opener = FakeOpener([URLError("timeout"), json_response({"data": {"id": "duplicate"}})])

        with self.assertRaisesRegex(generate_image.AtlasError, "not retried"):
            generate_image.submit_once(
                {"model": generate_image.MODEL, "prompt": "kite"},
                opener=opener,
                api_key="test-key",
            )

        self.assertEqual(len(opener.requests), 1)

    def test_get_retries_then_succeeds(self):
        opener = FakeOpener([URLError("temporary"), json_response({"data": {"ok": True}})])
        sleeps = []

        result = generate_image._get_json(
            "https://example.test/catalog", opener=opener, sleep=sleeps.append
        )

        self.assertEqual(result["data"]["ok"], True)
        self.assertEqual(len(opener.requests), 2)
        self.assertEqual(sleeps, [1])

    def test_live_schema_validation_rejects_stale_enum(self):
        schema = {
            "components": {
                "schemas": {
                    "Input": {
                        "required": ["model", "prompt"],
                        "properties": {
                            "model": {"type": "string"},
                            "prompt": {"type": "string"},
                            "aspect_ratio": {"enum": ["1:1"]},
                        },
                    }
                }
            }
        }

        with self.assertRaisesRegex(generate_image.AtlasError, "Invalid aspect_ratio"):
            generate_image.validate_payload(
                {"model": generate_image.MODEL, "prompt": "kite", "aspect_ratio": "16:9"},
                schema,
            )

    def test_download_adds_extension_after_magic_byte_check(self):
        opener = FakeOpener([Response(b"\x89PNG\r\n\x1a\nimage-bytes")])
        with TemporaryDirectory() as tmp:
            output = generate_image.download_image(
                "https://example.test/image", Path(tmp) / "result.txt", opener=opener
            )

            self.assertEqual(output.suffix, ".png")
            self.assertEqual(output.read_bytes(), b"\x89PNG\r\n\x1a\nimage-bytes")


if __name__ == "__main__":
    unittest.main()
