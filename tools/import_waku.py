"""Import only AI configuration from waku; never copies bot tokens or user data."""
import argparse
import json
import sys
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def quoted(value):
    return json.dumps(value, ensure_ascii=False)


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser(description="Nhập cấu hình AI Waku vào Amadeus; không sao chép token Telegram.")
    parser.add_argument("--source", type=Path, required=True, help="Đường dẫn settings.toml của Waku")
    parser.add_argument("--output", type=Path, default=ROOT / "settings.toml")
    args = parser.parse_args()
    if args.output.exists():
        parser.error("File đích đã tồn tại. Đổi --output để tránh ghi đè cấu hình riêng.")
    source = tomllib.loads(args.source.read_text(encoding="utf-8-sig"))
    providers = source.get("agent_providers", {})
    if not providers:
        parser.error("Không có agent_providers trong cấu hình nguồn.")
    sample = (ROOT / "settings.ex.toml").read_text(encoding="utf-8")
    prefix = sample.split("[agent_providers.default]", 1)[0]
    prefix = prefix.replace('"default/your-model-name"', quoted(source.get("agent_chat_model", "default/your-model-name")), 1)
    parts = [prefix]
    for name, provider in providers.items():
        parts.append(f"[agent_providers.{quoted(name)}]\n")
        for key in ("url", "key", "type", "api_type", "proxy", "api_key_env"):
            if isinstance(provider.get(key), str):
                parts.append(f"{key} = {quoted(provider[key])}\n")
        parts.append("\n")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    # Exclusive create protects against a concurrent configuration writer.
    with args.output.open("x", encoding="utf-8", newline="\n") as file:
        file.write("".join(parts))
    print("Đã nhập cấu hình AI. Không sao chép token bot, lịch sử hay dữ liệu người dùng.")


if __name__ == "__main__":
    main()
