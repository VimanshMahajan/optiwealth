# OptiWealth – Architecture & Design Overview

This document provides a high-level and mid-level view of the system design: components, data flows, technology choices, and rationale.

---
## 1. Goals & Non-Functional Requirements

Primary Goals:
- Provide retail investors advanced institutional-grade analytics (risk, optimization, forecasting)
- Modular architecture enabling independent scaling of analytics layer
- Maintain clear separation of concerns (UI, orchestration, analytics computation)

Non-Functional Requirements:
- Scalability: Python analytics can be containerized and replicated separately
- Maintainability: Layered modules with single responsibility
- Extensibility: Plug in new models (e.g., LSTM prediction) without rewriting orchestration
- Security: JWT-based auth, secret isolation, role-based access (future hardening)
- Observability (future): Add centralized logging & metrics exporters

---
## 2. High-Level Component Diagram

```
+-------------------+        REST        +------------------------+
|   React Frontend  |  <-------------->  |  Spring Boot Backend   |
|  (Vite + React)   |                   | (Auth + Portfolio API) |
+-------------------+                   +-----------+------------+
                                                  |
                                                  | REST (JSON)
                                                  v
                                      +----------------------------+
                                      |  Python Analytics Service  |
                                      | (Flask + Scheduler + AI)   |
                                      +-------------+--------------+
                                                    |
                                                    | External API Calls
                                                    v
                                         +---------------------------+
                                         | Market Data Providers     |
                                         | (yFinance / Yahoo APIs)   |
                                         +---------------------------+
```

PostgreSQL (not shown above) is connected to the Spring Boot Backend via JPA/Hibernate for persistence.

---
## 3. Detailed Module Breakdown

### 3.1 Frontend (React + Vite)
Responsibilities:
- User interaction (login, portfolio visualization, analytics dashboards)
- Routing & protected routes
- Calls backend REST endpoints (e.g., /api/portfolios, /api/analytics)

Key Concepts:
- Context-based auth (`AuthContext.tsx`)
- Components for metrics explanation & symbol autocomplete
- Could later consume WebSocket streams (e.g., live prices)

### 3.2 Backend (Spring Boot)
Responsibilities:
- User authentication / JWT issuance & validation
- Portfolio CRUD operations & domain validation
- Orchestrates analytics by proxying requests to Python microservice
- Consolidates responses for frontend consumption

Key Technologies:
- Spring Web (REST Controllers)
- Spring Data JPA (ORM abstraction)
- Spring Security (core + web + config modules)
- JSON Web Tokens (jjwt library)

Extensions (Future):
- Add Spring Cloud Config for externalized configuration
- Add caching (Caffeine / Redis)
- Introduce asynchronous communication (Spring Cloud Stream + Kafka) for heavy analytics jobs

### 3.3 Python Analytics Microservice
Responsibilities:
- Fetch & prepare market data (`data_fetcher.py`)
- Compute descriptive metrics (`descriptive_metrics.py`)
- Risk diagnostics (VaR, CVaR, beta, drawdown) (`risk_diagnostics.py`)
- Time-series & volatility forecasting (ARIMA, GARCH) (`forecasting_models.py`)
- Portfolio optimization (efficient frontier simulation) (`optimization_engine.py`)
- Aggregate final multi-layer report (`report_generator.py`)
- Generate AI natural language summary (Gemini) (`NLP_layer/gemini.py`)
- Daily scheduled job for “Top Picks” (`top_picks/`) via APScheduler

Design Notes:
- Each file = one conceptual layer; keeps mental model clear
- Forecast + optimization intentionally decoupled to allow future optimization algorithms (e.g., genetic algorithms)
- AI summarization is appended post-computation so failures don’t block analytics

---
## 4. Data Flow: Portfolio Analysis Request

Sequence:
1. User submits holdings via frontend.
2. Backend validates request & user auth.
3. Backend constructs JSON and POSTs to Python `/analyze-portfolio`.
4. Python service:
   - Normalizes symbols (appends .NS for NSE)
   - Gathers historical prices & fundamentals
   - Computes descriptive metrics
   - Computes portfolio risk metrics
   - Runs forecasting models
   - Executes optimization simulation
   - Produces AI summary (Gemini)
5. Consolidated JSON returned to backend → delivered to frontend.

Failure Handling:
- Individual model failures (e.g., ARIMA) produce NaNs but don’t abort whole response
- AI summary failure returns fallback raw text field

---
## 5. Domain Model (Backend)

Core Entities (conceptual):
- User: credentials, roles
- Portfolio: owner reference, collection of holdings
- Holding: symbol, quantity, average cost basis

Relationships:
- User 1..* Portfolio
- Portfolio 1..* Holding

---
## 6. API Interaction Patterns

Style: REST + JSON
- Backend endpoints secured via JWT
- Backend <-> Python simple REST (could evolve to gRPC for performance or message bus for async jobs)

Why REST initially?
- Simplicity for iteration
- Browser & tool compatibility (curl / Postman)
- Adequate for current synchronous analytics calls

---
## 7. Technology Rationale

Spring Boot:
- Mature ecosystem for auth, persistence, validation
- Strong security & configuration features

Python Stack:
- Rich ecosystem for data science (pandas, statsmodels, arch)
- Rapid experimentation for financial modeling

React + Vite:
- Fast developer experience
- Modern ES modules, easy environment variable injection

PostgreSQL:
- Reliable relational store for structured financial data
- ACID guarantees for transactional portfolio updates

Gemini (AI summaries):
- Adds human-readable insight layer
- Offloads complexity of natural language generation

APSheduler:
- Lightweight job scheduler without introducing heavyweight queue or cron dependencies initially

---
## 8. Cross-Cutting Concerns

Security:
- JWT secret currently in properties (should migrate to env / vault)
- Need input sanitization for symbols; add whitelist using `valid_symbols.csv`

Performance:
- Heavy operations (optimization simulations) are CPU-bound; consider parallelism or migrating to async task queue (Celery / RQ) for large portfolios

Resilience:
- Add circuit breaker or retry on Python microservice calls (Spring Retry / Resilience4j)
- Implement graceful degradation when external market data fails

Observability (Future):
- Add logging correlation IDs (trace requests across services)
- Metrics (Prometheus exporters) for request latency & model runtimes
- Structured logs in JSON for analytics service

Caching:
- Frequent symbol price fetches can be cached (Redis TTL ~60s)

---
## 9. Potential Evolution Roadmap

Phase 1 (Current): Synchronous REST orchestration.
Phase 2: Introduce message queue for async heavy jobs; add job status endpoint.
Phase 3: Add real-time streaming (WebSockets) for live price updates.
Phase 4: Model registry & versioning (MLflow) for forecasting models.
Phase 5: Multi-cloud deployment with autoscaling analytics workers.

---
## 10. Deployment Topology (Target Future)

```
+------------------+       +------------------+
|  Browser Clients |       |  Mobile Clients  |
+---------+--------+       +---------+--------+
          |                          |
          v                          v
      +-------------------------------+
      |        API Gateway / LB       |
      +---------------+---------------+
                      |
          +-----------+-----------+
          |   Spring Backend      |
          +-----------+-----------+
                      |
          +-----------+-----------+
          |  Python Analytics     |  <-- Horizontally scalable pool
          +-----------+-----------+
                      |
                +-----+-----+
                | PostgreSQL |
                +-----------+
```

Add Redis (cache) & Prometheus (metrics) later.

---
## 11. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| yFinance instability | Missing data / errors | Cache + fallback provider (AlphaVantage) |
| Long-running Monte Carlo | Request timeouts | Async processing + job queue |
| Hard-coded secrets | Security compromise | Use env vars / Vault / SSM |
| Scheduler duplicate runs | Skewed analytics | Prod: disable Flask reloader & container health checks |
| AI dependency outage | Missing summaries | Fallback to computed numerical metrics only |

---
## 12. Data Integrity Considerations

- Transactions: Ensure portfolio updates either fully succeed or roll back.
- Idempotency: Repeated POST of same holdings list should not duplicate portfolio entities (client vs analytics separation).
- Validation: Enforce non-negative quantities, sensible cost basis ranges.

---
## 13. Testing Strategy (Target)

Current: Minimal Java tests + manual Python validation.
Roadmap:
- Unit: Each Python module (risk, forecast) with synthetic data fixtures.
- Integration: Backend -> Python microservice mock tests (WireMock / Testcontainers).
- E2E: Cypress/Playwright for UI flows.
- Load: k6 or Locust for portfolio analysis endpoint.
- Security: JWT auth / permission boundary tests.

---
## 14. Observability Enhancements (Future)

Introduce:
- Structured logging (JSON) with log levels
- Distributed tracing (OpenTelemetry) across backend & Python service
- Metrics: request count, latency, model execution time, cache hit ratio
- Alerting: VaR > threshold for monitored portfolios (user opt-in)

---
## 15. Glossary (Quick Reference)

- VaR: Maximum expected loss over a time horizon at a confidence level
- CVaR: Expected loss given that VaR threshold is breached
- Sharpe Ratio: Risk-adjusted performance metric
- Efficient Frontier: Optimal risk-return tradeoff curve
- Beta: Systematic risk vs benchmark
- Max Drawdown: Largest observed peak-to-trough decline

---
For setup & operational details, see RUNNING.md.

