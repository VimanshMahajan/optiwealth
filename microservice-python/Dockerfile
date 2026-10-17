FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY controller.py data_fetcher.py descriptive_metrics.py forecasting_models.py optimization_engine.py report_generator.py risk_diagnostics.py symbol_refresh_worker.py ./
COPY NLP_layer/gemini.py ./NLP_layer/gemini.py
COPY top_picks/top_picks.py ./top_picks/top_picks.py
COPY utils/symbol_catalog.py utils/finance_prompt.txt ./utils/

EXPOSE 8000
CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-8000} --workers 2 --timeout 300 controller:app"]
