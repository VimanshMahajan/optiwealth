# OptiWealth

Advanced portfolio management & analytics platform combining a Spring Boot backend, a Python quantitative analytics microservice, and a React + Vite frontend.

## Documentation
- Setup & run: `RUNNING.md`
- System design: `ARCHITECTURE.md`

## Features
- Portfolio management (multiple portfolios, holdings, P&L)
- JWT authentication
- Descriptive analytics (returns, volatility, Sharpe ratio, cumulative return)
- Risk diagnostics (VaR, CVaR, beta, max drawdown, diversification score)
- Forecasting (ARIMA price trend, GARCH volatility, Monte Carlo price paths)
- Optimization (efficient frontier simulation, max Sharpe, min volatility, CVaR estimate)
- AI narrative summaries (Gemini)
- Scheduled daily job for top picks (APSheduler)

## Technology Stack
- Backend: Spring Boot 3 (Java 17), Spring Security, Spring Data JPA (PostgreSQL)
- Analytics Microservice: Python (Flask, pandas, numpy, statsmodels, arch, yfinance, APScheduler, google-genai)
- Frontend: React, TypeScript, Vite
- Database: PostgreSQL

## Architecture Overview
Frontend ↔ Backend ↔ Python Analytics ↔ Market Data

Backend persists domain data and forwards analytics requests. Python microservice performs quantitative computations and returns structured JSON enriched with an AI summary.

## Analytics Flow
1. User submits holdings in the frontend.
2. Backend validates request and user auth.
3. Backend POSTs to Python `/analyze-portfolio`.
4. Python service computes metrics, risk, forecasts, optimization, AI summary.
5. Consolidated JSON returns to backend and is delivered to frontend.

## Configuration
Secrets and environment-specific values are not committed.
- Backend: `application-local.properties` based on example file.
- Python: `.env` with `GOOGLE_API_KEY`.
- Frontend: optional `.env` (e.g. `VITE_API_BASE`).

## Quick Start
Backend (port 8080):
```bash
./mvnw spring-boot:run
```
Python microservice (port 8000):
```bash
python microservice-python/controller.py
```
Frontend (port 5173):
```bash
cd frontend-react
npm install
npm run dev
```

## License
See `LICENSE` for licensing terms.

For deeper design details consult `ARCHITECTURE.md`. For full operational steps see `RUNNING.md`.
