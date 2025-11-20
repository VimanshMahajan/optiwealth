# OptiWealth – Running & Operations Guide

This guide explains how to set up, run, and validate the three components of the OptiWealth platform:

1. Spring Boot backend (portfolio & auth service)
2. Python analytics microservice (risk, forecasting, optimization, AI summaries)
3. React frontend (user interface)

---
## 1. Prerequisites

Install locally:

| Component | Version |
|-----------|---------|
| Java      | 17      |
| Maven     | 3.9+    |
| Node.js   | 20+     |
| npm       | Bundled |
| Python    | 3.11+   |
| PostgreSQL| 14+     |

---
## 2. Repository Structure (Simplified)
```
backend-springboot/    Spring Boot API (auth, portfolios, orchestration)
frontend-react/        React + Vite client application
microservice-python/   Analytics & AI microservice (Flask + scheduling)
```
Supporting folders: `microservice-python/utils/`, `microservice-python/top_picks/`.

---
## 3. Configuration & Secrets

Do not commit secrets.

### Backend (Spring Boot)
Create `src/main/resources/application-local.properties` from the example:
```
spring.datasource.url=jdbc:postgresql://localhost:5432/portfolio_db
spring.datasource.username=postgres
spring.datasource.password=yourpassword
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

jwt.secret=replace-with-long-base64-secret
jwt.expiration=86400000

microservice.python.url=http://localhost:8000
```

### Python Microservice (.env)
Create `microservice-python/.env`:
```
GOOGLE_API_KEY=your-google-genai-key
PYTHON_ENV=local
```

### Frontend (.env)
```
VITE_API_BASE=http://localhost:8080
```
Access via `import.meta.env.VITE_API_BASE`.

---
## 4. Python Analytics Microservice Setup

From the repository root (or `microservice-python/`):
```
python -m venv .venv
.venv\Scripts\activate
```
Install dependencies (requires `requirements.txt` in project root):
```
pip install -r requirements.txt
```
Run service:
```
python microservice-python/controller.py
```
Listens on `0.0.0.0:8000`.

Health check:
```
curl http://localhost:8000/
```
Expect JSON status response.

---
## 5. Spring Boot Backend Setup

From `backend-springboot/`:
```
./mvnw clean install
./mvnw spring-boot:run
```
(Windows alternative: `mvnw.cmd spring-boot:run`)

Package:
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
Visit: `http://localhost:5173`.

Production build:
```
npm run build
```
Output: `dist/`.

---
## 7. End-to-End Flow: Portfolio Analysis

1. Start Python microservice (port 8000).
2. Start Spring Boot backend (configured with `microservice.python.url`).
3. Start React frontend.
4. User submits holdings → backend forwards to Python `/analyze-portfolio` → returns JSON (descriptive, risk, forecasts, optimization, AI summary).

The microservice appends `.NS` automatically for NSE symbols.

---
## 8. Scheduler Behavior

- On startup `controller.py` executes a Top Picks update once.
- APScheduler schedules a 24‑hour interval job.
- Avoid duplicate jobs by keeping `debug=True` only in development; reloader gating is handled with `WERKZEUG_RUN_MAIN`.

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
Python (manual checks): run individual modules or invoke `/analyze-portfolio`.

---
## 10. Common Issues & Resolutions

| Symptom | Cause | Resolution |
|--------|-------|------------|
| 404 to microservice | Property key mismatch | Use `microservice.python.url` consistently |
| CORS errors | Missing CORS config | Add Spring CORS configuration bean |
| Empty analytics response | No market data | Verify symbol & network connectivity |
| AI summary raw text | Response not valid JSON | Check `GOOGLE_API_KEY` and `.env` load |
| Duplicate scheduler runs | Flask reloader | Keep gating logic, set `debug=False` in production |

---
## 11. Security

- Externalize secrets (JWT, DB credentials) via environment variables.
- Enforce symbol whitelist using `valid_symbols.csv`.
- Use HTTPS in front of services.
- Apply rate limiting on analytics endpoints.

---
## 12. Quick Reference Commands

Backend:
```
./mvnw spring-boot:run
```
Python:
```
python microservice-python/controller.py
```
Frontend:
```
cd frontend-react
npm run dev
```
Tests:
```
./mvnw test
```

---
Architectural details: see `ARCHITECTURE.md`.
