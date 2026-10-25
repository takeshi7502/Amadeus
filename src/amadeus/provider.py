"""HTTP model adapter; spec parsing/URL normalization derived from waku-bot.

Original: waku/plugins/agent/provider.py, GNU AGPL v3.
This extraction deliberately has no Telegram startup/config singleton dependency.
"""
from __future__ import annotations

import json
from collections.abc import AsyncIterator

import httpx

from .config import ProviderConfig, Settings


class ModelError(Exception):
    """A safe, user-facing model failure; never embeds provider bodies or URLs."""


def _parse_spec(spec: str) -> tuple[str, str]:
    if "/" in spec:
        provider, _, model = spec.partition("/")
        return provider.strip(), model.strip()
    return "default", spec.strip()


def _ollama_root(url: str) -> str:
    url = url.strip().rstrip("/")
    if url.endswith("/v1"):
        url = url[:-3].rstrip("/")
    return url


def _openai_base_url(cfg: ProviderConfig) -> str:
    if cfg.api_type == "ollama":
        return _ollama_root(cfg.url) + "/v1"
    return cfg.url.rstrip("/")


class ModelClient:
    def __init__(self, settings: Settings, *, transport=None):
        self.settings = settings
        name, self.model = _parse_spec(settings.agent_chat_model)
        self.config = settings.agent_providers.get(name)
        self.client = httpx.AsyncClient(
            timeout=httpx.Timeout(settings.model_timeout, connect=10),
            proxy=self.config.proxy if self.config else None,
            transport=transport,
        )

    @property
    def ready(self) -> bool:
        return bool(self.config and self.model and self.model != "your-model-name" and (
            self.config.api_key or self.config.api_type == "ollama"
        ))

    async def close(self):
        await self.client.aclose()

    async def stream(self, messages: list[dict]) -> AsyncIterator[str]:
        if not self.ready:
            raise ModelError("Chưa cấu hình AI. Điền provider và model trong settings.toml rồi khởi động lại.")
        cfg = self.config
        responses = cfg.type == "responses"
        body = {"model": self.model, "stream": True}
        if responses:
            body.update(input=messages, max_output_tokens=self.settings.max_output_tokens, store=False)
        else:
            body.update(messages=messages, max_tokens=self.settings.max_output_tokens)
        if self.settings.send_temperature and self.settings.temperature is not None:
            body["temperature"] = self.settings.temperature
        headers = {"Authorization": f"Bearer {cfg.api_key or 'ollama'}"}
        endpoint = _openai_base_url(cfg) + ("/responses" if responses else "/chat/completions")
        got_text = False
        completed = False
        try:
            async with self.client.stream("POST", endpoint, headers=headers, json=body) as response:
                if response.status_code >= 400:
                    code = response.status_code
                    hint = "Kiểm tra key, URL và tên model." if code in {400, 401, 403, 404, 422} else "Thử lại sau một lát."
                    raise ModelError(f"Kết nối AI trả mã {code}. {hint}")
                async for line in response.aiter_lines():
                    if not line.startswith("data:"):
                        continue
                    data = line[5:].strip()
                    if not data:
                        continue
                    if data == "[DONE]":
                        completed = True
                        break
                    event = json.loads(data)
                    if event.get("error") or event.get("type") in {"error", "response.failed", "response.incomplete"}:
                        raise ModelError("AI không hoàn thành câu trả lời. Bạn có thể gửi lại.")
                    if responses:
                        if event.get("type") == "response.completed":
                            completed = True
                        delta = event.get("delta", "") if event.get("type") == "response.output_text.delta" else ""
                    else:
                        choices = event.get("choices", [])
                        choice = choices[0] if choices else {}
                        finish = choice.get("finish_reason")
                        if finish == "length":
                            raise ModelError("Câu trả lời vượt giới hạn model. Thử hỏi ngắn hơn hoặc tăng max_output_tokens.")
                        if finish in {"content_filter", "tool_calls"}:
                            raise ModelError("Model không trả lời bằng văn bản. Kiểm tra model hoặc thử câu hỏi khác.")
                        if finish == "stop":
                            completed = True
                        delta = choice.get("delta", {}).get("content") or ""
                    if isinstance(delta, str) and delta:
                        got_text = True
                        yield delta
            if not got_text or not completed:
                raise ModelError("Luồng AI bị ngắt trước khi hoàn tất. Hội thoại chưa bị thay đổi; hãy thử lại.")
        except httpx.TimeoutException:
            raise ModelError("Kết nối AI quá thời gian chờ. Hãy thử lại.") from None
        except (httpx.HTTPError, json.JSONDecodeError, TypeError, AttributeError, IndexError):
            raise ModelError("Không đọc được phản hồi từ nhà cung cấp AI. Kiểm tra cấu hình rồi thử lại.") from None
