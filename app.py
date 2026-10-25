"""Vercel's FastAPI entrypoint. Local CLI remains `python -m amadeus`."""
from src.amadeus.app import create_app

app = create_app()
