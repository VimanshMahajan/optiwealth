# OptiWealth: local development and deployment

## Architecture and service roots

- Vercel frontend root: `frontend-react/`; build `npm run build`; output `dist`.
- Railway Spring Boot root: `backend-springboot/`; Dockerfile builds the executable JAR.
- Railway analytics root: `microservice-python/`; Dockerfile runs `controller:app` with Gunicorn.
- Railway scheduler root: `microservice-python/`; start command `python symbol_refresh_worker.py`.
- The browser calls Spring Boot. Spring Boot calls Python over Railway private networking. Both backend services use the same PostgreSQL database; the browser never connects to PostgreSQL or the private Python service.

## Local development

Prerequisites: Java 17, Maven (or `mvnw.cmd`), Node.js 20+, Python 3.11+, and PostgreSQL 14+.

Set backend environment variables in the shell (PowerShell example):

```powershell
$env:JWT_SECRET = '<a fresh local base64 secret of at least 32 bytes>'
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/portfolio_db'
$env:SPRING_DATASOURCE_USERNAME = 'postgres'
$env:SPRING_DATASOURCE_PASSWORD = '<your local database password>'
$env:PYTHON_SERVICE_URL = 'http://localhost:8000'
```

The JWT signing key previously present in the tracked properties file has been removed. Create a fresh local secret, for example with `openssl rand -base64 32`; do not reuse the old exposed value.

Run Python from `microservice-python/`:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_NAME = 'portfolio_db'
$env:DB_USER = 'postgres'
$env:DB_PASSWORD = '<your local database password>'
$env:GOOGLE_API_KEY = '<optional Gemini key>'
python controller.py
```

The API runs on `0.0.0.0:8000` by default; set `PORT` to override. Gemini summaries are unavailable without `GOOGLE_API_KEY`, but the service still starts. The worker requires the Python DB variables when it accesses PostgreSQL.

Run Spring Boot from `backend-springboot/` with `mvnw.cmd spring-boot:run` (or `mvn spring-boot:run`). Run the frontend from `frontend-react/` with `npm install` then `npm run dev`. Its default backend URL is `http://localhost:8080`; use `VITE_API_BASE_URL` for a different URL. The previous `VITE_API_URL` remains a compatibility fallback.

## Railway deployment

Create one Railway PostgreSQL service, then configure both application services to use that same database. Railway exposes `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, and `PGPASSWORD` for service connections ([Railway PostgreSQL docs](https://docs.railway.com/databases/postgresql)). In each app service's Variables, use Railway reference variables (replace `Postgres` with the actual database service name):

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
SPRING_DATASOURCE_USERNAME=${{Postgres.PGUSER}}
SPRING_DATASOURCE_PASSWORD=${{Postgres.PGPASSWORD}}
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_NAME=${{Postgres.PGDATABASE}}
DB_USER=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
```

This constructs JDBC format from Railway's individual fields; do not assume `DATABASE_URL` is JDBC formatted. Keep credential references inside Railway variables, never repository files.

**Spring Boot service** (root `backend-springboot/`, Dockerfile build):

- Required: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `PYTHON_SERVICE_URL`, `FRONTEND_ORIGIN`.
- Railway supplies `PORT`; the app listens on it, with local default `8080`.
- `JWT_SECRET` must be a newly generated, strong base64 key (at least 32 random bytes). Never reuse the removed committed value.
- Set `PYTHON_SERVICE_URL` to the Python service's Railway private-network URL, typically `http://<service-name>.railway.internal:<port>` using the actual service name and listening port shown by Railway. Railway documents this private hostname pattern and recommends internal HTTP for same-environment service calls ([private networking docs](https://docs.railway.com/networking/private-networking)).
- Set `FRONTEND_ORIGIN` to the exact deployed Vercel origin, without a path. That URL is intentionally not assumed here.

**Python analytics service** (root `microservice-python/`, Dockerfile build):

- Required for analytics DB access and scheduler: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`.
- `GOOGLE_API_KEY` is optional; without it, quantitative analytics remains available and the AI summary reports unavailable.
- Railway supplies `PORT` (default 8000). Gunicorn serves `controller:app`.

**Scheduler service:** deploy a second Railway service from the same Python root and Dockerfile, overriding its start command to `python symbol_refresh_worker.py`. It performs an initial refresh and repeats daily at 02:00, and writes the `symbols` and `top_picks` tables used by symbol lookup and Top Picks. Run exactly one scheduler instance per database. The Flask API does not start APScheduler in its Gunicorn workers. Supply the same five DB variables to this service. If Top Picks/symbol refresh is required, this worker service is required.

The Java entities use `app_user`, `portfolio`, `holding`, `symbols`, and `top_picks`; Python refreshes `symbols` and writes `top_picks`. Keep all services on the same PostgreSQL database. Hibernate remains configured with `ddl-auto=update`; no migration framework was added.

## GitHub Actions symbol and Top Picks refresh

The workflow at `.github/workflows/refresh-symbols-and-top-picks.yml` runs daily at **02:00 UTC** and can also be started with **Actions → Refresh symbols and Top Picks → Run workflow**. GitHub-hosted runners are outside Railway's private network, so enable Railway PostgreSQL public TCP access and use its public TCP proxy host and port for this workflow; do not use Railway's private `PGHOST` value. Keep the database credentials in GitHub repository or environment secrets. The scheduled workflow must be present on the repository's default branch; manual runs can select a branch that contains the workflow.

Standard GitHub-hosted runner usage is free for public repositories; private repositories use the account plan's included minutes, with additional usage potentially billed ([GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage)).

Add these GitHub Actions secrets (Settings → Secrets and variables → Actions):

- `DB_HOST`: Railway PostgreSQL public TCP proxy hostname.
- `DB_PORT`: Railway PostgreSQL public TCP proxy port (defaults to `5432` when omitted; set the actual port when using a pooler/proxy port).
- `DB_NAME`: database name.
- `DB_USER`: database username.
- `DB_PASSWORD`: database password.

The workflow installs only `microservice-python/requirements-worker.txt` and invokes `python symbol_refresh_worker.py --once`. That entry point runs catalog refresh followed by Top Picks once, then exits nonzero if the run raises an error. The existing `python symbol_refresh_worker.py` command still performs its initial refresh and starts the daily APScheduler for local/Railway worker use. GitHub Actions concurrency prevents two workflow runs from executing at the same time.

To test manually, first confirm the public proxy can reach the same database containing the application tables, add the five secrets, open the Actions tab, select the workflow, and click **Run workflow**. Inspect the job log for the symbol count and `All top picks updated successfully.` Verify symbol search and Top Picks in the application after completion. If the run fails, check the action log and the database proxy host/port and credentials; never print secrets in workflow logs.

## Vercel deployment

- Project root: `frontend-react/`
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL=https://<your-public-spring-service-domain>` (the public Spring Boot URL).
- `vercel.json` rewrites client routes to `index.html` for React Router deep links.

After deploying, copy the actual Vercel origin into Railway's `FRONTEND_ORIGIN`, then rebuild the frontend after setting `VITE_API_BASE_URL`. CORS allows that configured origin plus localhost development origins, with credentials and the Authorization header.

## Build and verification commands

```powershell
# Python (from microservice-python/)
python -m pip install -r requirements.txt
python -c "import controller; print(controller.app.url_map)"

# Spring Boot (JWT_SECRET must be set; from repository root)
.\backend-springboot\mvnw.cmd -f .\backend-springboot\pom.xml test
.\backend-springboot\mvnw.cmd -f .\backend-springboot\pom.xml package

# Frontend (from frontend-react/)
npm ci
npm run build
```

Local smoke checks: `Invoke-RestMethod http://localhost:8000/`, register/login through the UI, then exercise portfolio create/list/update/delete, symbol search, Top Picks (after running the worker), and portfolio analytics. In production, repeat login and portfolio CRUD, call analytics through Spring, verify the worker refreshed symbols/Top Picks, and confirm browser requests target Spring only.

## Operational notes

- Flask health route: `GET /`, returning service/status JSON.
- API routes are Spring-authenticated except `/auth/**`; analytics internally calls Python `POST /analyze-portfolio`.
- Database availability and market-data provider access are required for database-backed routes and analytics respectively.
- Do not run multiple scheduler processes against one database.
