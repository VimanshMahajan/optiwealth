# OptiWealth

Advanced portfolio management & analytics platform combining a Spring Boot backend, a Python quantitative analytics microservice, and a modern React frontend.

## Documentation
- Getting started & local setup: see `RUNNING.md`
- System & design overview: see `ARCHITECTURE.md`

## Core Capabilities
- Portfolio CRUD & multi-portfolio support
- Secure authentication (JWT-based)
- Descriptive analytics (P&L, returns, Sharpe, volatility)
- Risk diagnostics (VaR, CVaR, beta, drawdown, diversification)
- Forecasting (ARIMA price trends, GARCH volatility, Monte Carlo simulation)
- Optimization (efficient frontier simulation, max Sharpe, min volatility, CVaR estimation)
- AI summaries (Gemini-generated narrative insights)
- Scheduled jobs (daily Top Picks refresh)

## Technology Stack
- Backend: Spring Boot 3 (Java 17), Spring Security, Spring Data JPA (PostgreSQL)
- Analytics Microservice: Python (Flask, pandas, numpy, statsmodels, arch, yfinance, APScheduler, google-genai)
- Frontend: React + Vite + TypeScript
- Persistence: PostgreSQL (dev), extensible to other RDBMS

## High-Level Architecture
Frontend ↔ Backend ↔ Python Analytics ↔ Market Data (yFinance)

The backend orchestrates analytics requests and persists domain entities. Heavy quantitative work is offloaded to the Python service for isolation and scalability.

## Example Analytics Flow
1. User submits holdings in UI.
2. Backend validates & forwards to Python `/analyze-portfolio`.
3. Python service computes descriptive metrics, risk, forecasts, optimization, and AI summary.
4. Consolidated JSON returned to backend → served to frontend.

## Security & Config
Secrets and environment-specific values are excluded from version control. Use:
- `application-local.properties` for backend overrides (based on example file)
- `.env` in `microservice-python/` for `GOOGLE_API_KEY`
- Optional `.env` for frontend (e.g., `VITE_API_BASE`)

## Development Quick Start (Summary)
- Start Python microservice (port 8000) → `python controller.py`
- Start backend (port 8080) → `./mvnw spring-boot:run`
- Start frontend (port 5173) → `npm run dev`

Details including troubleshooting are in `RUNNING.md`.

## Future Enhancements (Selected)
- Containerization (Docker Compose)
- Caching layer (Redis) for market data
- Async job processing for heavy simulations
- Expanded test suite (pytest, integration tests)
- Observability (metrics, tracing, structured logs)

## License
This project is released under the terms of the license found in `LICENSE`.

---
For deep layer-by-layer explanations of analytics modules, refer to the existing Python source and `ARCHITECTURE.md`. The previous verbose breakdown was moved to dedicated architecture documentation for clarity.
