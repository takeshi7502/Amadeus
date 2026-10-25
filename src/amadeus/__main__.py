import argparse

import uvicorn

from .app import create_app
from .config import load_settings


def main():
    parser = argparse.ArgumentParser(description="Amadeus — Kurisu web + Telegram")
    parser.add_argument("--host", help="Mặc định 127.0.0.1. Public cần web_password.")
    parser.add_argument("--port", type=int)
    args = parser.parse_args()
    settings = load_settings()
    overrides = {key: value for key, value in vars(args).items() if value is not None}
    settings = type(settings).model_validate({**settings.model_dump(), **overrides})
    # Never run multiple workers: the Telegram poller and chat locks are process-local.
    uvicorn.run(create_app(settings), host=settings.host, port=settings.port, log_level="info")


if __name__ == "__main__":
    main()
