FROM python:3.13-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 AMADEUS_DATA_DIR=/app/data AMADEUS_CONFIG=/app/settings.toml
COPY pyproject.toml README.md LICENSE ./
COPY src ./src
RUN pip install --no-cache-dir . && useradd --create-home amadeus && mkdir /app/data /app/runtime_assets && chown amadeus:amadeus /app/data /app/runtime_assets
USER amadeus
EXPOSE 8017
HEALTHCHECK --interval=30s --timeout=3s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8017/health',timeout=2)"
CMD ["python", "-m", "amadeus", "--host", "0.0.0.0"]
