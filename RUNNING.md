# OptiWealth – Running & Operations Guide

This guide explains how to set up, run, and validate the three major components of the OptiWealth platform:

1. Spring Boot backend (portfolio & auth service)
2. Python analytics microservice (risk, forecasting, optimization, AI summaries)
3. React frontend (user interface)

---
## 1. Prerequisites

Install the following locally:

| Component | Version (recommended) |
|-----------|----------------------|
| Java | 17 (Temurin / OpenJDK) |
| Maven | 3.9+ |
| Node.js | 20+ |
| npm | Comes with Node (v10+) |
| Python | 3.11+ (3.10 may work) |
| PostgreSQL | 14+ |

Optional / Later:
- Docker & Docker Compose (for containerized deployment)
- Git LFS if you later add large assets

---
## 2. Repository Structure (Simplified)
```
backend-springboot/    ← Java Spring Boot API (auth, portfolios, orchestration)
frontend-react/        ← React + Vite client application
microservice-python/   ← Analytics & AI microservice (Flask + scheduling)
```
Supporting folders: `microservice-python/utils/`, `microservice-python/top_picks/`, etc.

---
## 3. Configuration & Secrets

Never commit secrets. Use local override files:

### Backend (Spring Boot)
Create `src/main/resources/application-local.properties` (not committed) based on the example:
```
spring.datasource.url=jdbc:postgresql://localhost:5432/portfolio_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

jwt.secret=replace-with-long-base64-secret
jwt.expiration=86400000

# URL of Python microservice (keep naming consistent!)
microservice.python.url=http://localhost:8000
```

### Python Microservice (.env)
Create `microservice-python/.env`:
```
GOOGLE_API_KEY=your-google-genai-key
PYTHON_ENV=local
```
Never commit `.env`. The Gemini client uses `GOOGLE_API_KEY`.

### Frontend (.env)
If you externalize the backend URL:
```
VITE_API_BASE=http://localhost:8080
```
Access in code via `import.meta.env.VITE_API_BASE`.

---
## 4. Python Analytics Microservice Setup

Inside `microservice-python/` create and activate a virtual environment:
```
python -m venv .venv
.venv\Scripts\activate
```
Install dependencies via requirements.txt

```
Freeze:
```
pip freeze > requirements.txt
```
Run the service:
```
python controller.py
```
It listens by default on `0.0.0.0:8000` (see `app.run` in `controller.py`).

Health check:
```
curl http://localhost:8000/
```
Expected JSON: service name + status.

---
## 5. Spring Boot Backend Setup

From `backend-springboot/`:
```
./mvnw clean install
./mvnw spring-boot:run
```
(On Windows you can run `mvnw.cmd spring-boot:run`.)

The backend should start on port `8080` (default Spring Boot). Confirm logs show HikariCP connection success and no property resolution errors.

If you wish to package:
```
./mvnw package
java -jar target/optiwealth_backend_sb-0.0.1-SNAPSHOT.jar
```

---
## 6. React Frontend Setup

From `frontend-react/`:
```
npm install
npm run dev
```
Vite default dev port is `5173`. Visit: `http://localhost:5173`.

Production build:
```
npm run build
```
Output goes to `dist/`.

---
## 7. End-to-End Flow: Portfolio Analysis

1. Start Python microservice (port 8000).
2. Start Spring Boot backend (must be configured with `microservice.python.url=http://localhost:8000`).
3. Start React frontend.
4. User submits holdings → Backend → Calls Python microservice `/analyze-portfolio` → Returns enriched JSON (descriptive, risk, forecasts, optimization, AI summary).

Note: The microservice appends `.NS` automatically for NSE symbols.

---
## 8. Scheduler Behavior (Top Picks)

- On startup, `controller.py` runs one immediate execution of `execute_picks()` then schedules a 24h interval job using APScheduler.
- Ensure the process stays alive; in production, run under a process manager (systemd, supervisor, Docker).
- Disable `debug=True` when not developing to avoid duplicate scheduler runs from the Flask reloader.

---
## 9. Testing & Quality

Backend:
```
./mvnw test
```
Frontend:
```
npm run lint
npm run build
```
Python (ad hoc):
- Consider adding `pytest` tests; currently testing is manual via script sections.

---
## 10. Common Issues & Troubleshooting

| Symptom | Cause | Fix |
|--------|-------|-----|
| 404 calling microservice from backend | Property key mismatch | Ensure `microservice.python.url` matches docs |
| CORS errors in frontend | Missing CORS config in backend | Add Spring CORS configuration bean |
| Empty analytics response | yFinance returned empty dataframe | Check symbol correctness & network connectivity |
| AI summary raw text only | Gemini response not valid JSON | Fallback formatting in controller logs; inspect `.env` key |
| Scheduler duplicates | Flask auto-reloader | Set `debug=False` or gate on `WERKZEUG_RUN_MAIN` (already present) |

---
## 11. Security & Hardening (Production)

- Replace hard-coded secrets in `application.properties` with environment variables or Spring Cloud Config.
- Use HTTPS & reverse proxy (Nginx / Traefik).
- Rate-limit AI & analytics endpoints.
- Add input validation & symbol whitelist (CSV `valid_symbols.csv`).
- Rotate JWT secret periodically; consider asymmetric signing (RSA) for scalability.

---
## 12. Optional: Docker (Future Step)

Example (conceptual) multi-container approach:
- `backend`: Java 17 base image, exposes 8080.
- `analytics`: Python slim, installs requirements, exposes 8000.
- `frontend`: Node builder → serve static build via Nginx.
- `postgres`: Official image with mounted volume.

Compose services share a network; backend talks to analytics via service DNS (e.g., `http://analytics:8000`).

---
## 13. Upgrade & Maintenance Checklist

- Weekly: Update Python libs (watch for breaking changes in `yfinance`, `arch`).
- Monthly: Dependency CVE scan (OWASP Dependency-Check / Snyk).
- Quarterly: Re-evaluate model parameters (ARIMA order, GARCH config).


---
## 15. Quick Reference Commands

Backend:
```
./mvnw spring-boot:run
```
Python:
```
python controller.py
```
Frontend:
```
npm run dev
```
Tests:
```
./mvnw test
```

---
Need deeper architectural context? See ARCHITECTURE.md.

