from __future__ import annotations

import os
import tomllib
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field, model_validator

ROOT = Path.cwd()
Mode = Literal["amadeus", "lab"]


class ProviderConfig(BaseModel):
    """Provider schema adapted from waku/config/__init__.py."""

    url: str = "https://api.openai.com/v1"
    key: str = ""
    api_key_env: str = ""
    type: Literal["chat_completions", "responses"] = "chat_completions"
    api_type: Literal["openai", "ollama"] = "openai"
    proxy: str | None = None

    @property
    def api_key(self) -> str:
        return os.environ.get(self.api_key_env, "") if self.api_key_env else self.key


class Settings(BaseModel):
    agent_chat_model: str = "default/your-model-name"
    agent_providers: dict[str, ProviderConfig] = Field(default_factory=dict)
    host: str = "127.0.0.1"
    port: int = Field(default=8017, ge=1, le=65535)
    default_mode: Mode = "amadeus"
    model_timeout: float = Field(default=90, ge=1, le=300)
    max_output_tokens: int = Field(default=1400, ge=64, le=8192)
    temperature: float | None = Field(default=0.75, ge=0, le=2)
    send_temperature: bool = True
    history_chars: int = Field(default=24000, ge=1000, le=100000)
    web_password: str = ""
    secure_cookie: bool = False
    allowed_hosts: list[str] = Field(default_factory=lambda: ["127.0.0.1", "localhost", "testserver"])
    telegram_enabled: bool = False
    telegram_token: str = ""
    telegram_allowed_users: list[int] = Field(default_factory=list)
    data_dir: Path = ROOT / "data"
    assets_dir: Path = ROOT / "runtime_assets"
    web_search_enabled: bool = True

    @model_validator(mode="after")
    def validate_remote_access(self):
        if self.host not in {"127.0.0.1", "localhost", "::1"} and not self.web_password:
            raise ValueError("Đặt web_password hoặc AMADEUS_WEB_PASSWORD trước khi bind ra mạng.")
        if self.telegram_enabled and not self.telegram_token:
            raise ValueError("telegram_enabled cần token riêng trong telegram_token.")
        return self


def load_settings(path: Path | None = None) -> Settings:
    path = path or Path(os.environ.get("AMADEUS_CONFIG", ROOT / "settings.toml"))
    values = tomllib.loads(path.read_text(encoding="utf-8-sig")) if path.exists() else {}
    for env, key in (("AMADEUS_WEB_PASSWORD", "web_password"), ("AMADEUS_TELEGRAM_TOKEN", "telegram_token")):
        if env in os.environ:
            values[key] = os.environ[env]
    if "AMADEUS_DATA_DIR" in os.environ:
        values["data_dir"] = os.environ["AMADEUS_DATA_DIR"]
    if "AMADEUS_ASSETS_DIR" in os.environ:
        values["assets_dir"] = os.environ["AMADEUS_ASSETS_DIR"]
    settings = Settings.model_validate(values)
    if not settings.data_dir.is_absolute():
        settings.data_dir = path.parent / settings.data_dir
    if not settings.assets_dir.is_absolute():
        settings.assets_dir = path.parent / settings.assets_dir
    return settings
