# Running and deployment

This guide covers local development and the current hosted layout: Vercel for the React frontend, Render for the Spring Boot API and Python analytics service, and PostgreSQL configured as an external database. The GitHub Actions workflow runs the scheduled symbol and Top Picks refresh.

## Service layout

| Service | Host/root directory | Build and start |
| --- | --- | --- |
| Frontend | Vercel; root `frontend-react/` | Build: `npm run build`; output: `dist` |
| Spring Boot API | Render Docker web service; root `backend-springboot/` | Dockerfile builds and runs the application JAR |
| Python analytics API | Render Docker web service; root `microservice-python/` | Dockerfile runs Gunicorn with `controller:app` |
| Symbol and Top Picks refresh | GitHub Actions | `python symbol_refresh_worker.py --once` from `microservice-python/` |
| PostgreSQL | Supabase or the configured PostgreSQL provider | Both backend services must use the same database |

Render and Vercel should be configured to deploy the `main` branch if that is the branch used for production. Do not create a second continuous scheduler on Render while the GitHub Actions workflow is enabled.

The browser calls the public Spring Boot API. Spring Boot calls the Python analytics service. The browser must not connect directly to PostgreSQL or to an internal/private Python address.

## Local development

Prerequisites: Java 17, Node.js 20 or later, Python 3.11, and PostgreSQL. Maven is optional if you use the Maven wrapper.

### PostgreSQL

Create a local database named `portfolio_db` (or choose a different name and use it consistently in the environment variables below). Hibernate currently uses `ddl-auto=update`; no separate migration command is required by this project.

### Spring Boot API

From the repository root in PowerShell, set the local environment variables and start the API:

```powershell
$env:JWT_SECRET = '<fresh local base64 secret, at least 32 random bytes>'
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://localhost:5432/portfolio_db'
$env:SPRING_DATASOURCE_USERNAME = 'postgres'
$env:SPRING_DATASOURCE_PASSWORD = '<local database password>'
$env:PYTHON_SERVICE_URL = 'http://localhost:8000'
$env:FRONTEND_ORIGIN = 'http://localhost:5173'
.ackend-springboot\mvnw.cmd -f .\backend-springboot\pom.xml spring-boot:run
```

For Git Bash or another Unix-like shell, set the same variables with `export` and run `./mvnw spring-boot:run` from `backend-springboot/`. Generate a fresh development JWT secret with `openssl rand -base64 32`. The old signing secret was removed from tracked configuration; do not reuse it. Spring Boot listens on `PORT` when provided, otherwise port `8080`.

### Python analytics service

From `microservice-python/`, create and activate a virtual environment, install the service dependencies, set the database variables, and run the Flask app locally:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
$env:DB_HOST = 'localhost'
$env:DB_PORT = '5432'
$env:DB_NAME = 'portfolio_db'
$env:DB_USER = 'postgres'
$env:DB_PASSWORD = '<local database password>'
$env:GOOGLE_API_KEY = '<optional Gemini API key>'
python controller.py
```

The local Flask process listens on `0.0.0.0:8000` by default; set `PORT` to override it. `GOOGLE_API_KEY` is optional. If it is absent, the service starts without Gemini-generated summaries. The Python database variables are required by the symbol and Top Picks worker and database-backed Python modules when they access PostgreSQL.

### Frontend

From `frontend-react/`:

```bash
npm install
npm run dev
```

The Vite development server defaults to `http://localhost:5173`. API requests default to `http://localhost:8080`. Set `VITE_API_BASE_URL` before starting/building the frontend to use a different Spring Boot URL. `VITE_API_URL` remains as a compatibility fallback.

### Local verification

Run these commands from their respective service roots:

```bash
# frontend-react/
npm run lint
npm run build

# backend-springboot/ (set JWT_SECRET and datasource variables first)
./mvnw test
./mvnw package

# microservice-python/
python -m pip install -r requirements.txt
python -c "import controller; print(controller.app.url_map)"
```

The Maven wrapper on Windows is `mvnw.cmd`. Check service health at `http://localhost:8080/health` for Spring Boot and `http://localhost:8000/health` (or `/`) for Flask.

## Render deployment

Deploy the backend services as Docker web services. For each service, select the `main` branch, set the indicated root directory, and use the Dockerfile in that root. The Dockerfiles handle image build and start commands; do not override the container command unless you intentionally change the service role.

### PostgreSQL connection

Use one PostgreSQL database for Spring Boot and Python. The project has previously been configured with Supabase; if continuing with that database, copy its host, port, database name, username, and password from the Supabase dashboard. Do not put credentials in repository files or frontend variables.

Set the Spring datasource URL in JDBC form. For a PostgreSQL provider requiring TLS, include `?sslmode=require`:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://<database-host>:<database-port>/<database-name>?sslmode=require
SPRING_DATASOURCE_USERNAME=<database-user>
SPRING_DATASOURCE_PASSWORD=<database-password>
```

Set the same connection coordinates for Python:

```text
DB_HOST=<database-host>
DB_PORT=<database-port>
DB_NAME=<database-name>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
```

Use the connection method and port recommended by the database provider for persistent application services. For GitHub-hosted Actions runners, use a database endpoint reachable from outside Render; if the provider's direct endpoint is not reachable from the runner, use its supported external pooler endpoint and set its actual port. Supabase documents its connection options and SSL configuration in [Connect to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres). The workflow's `DB_*` secrets must refer to the same database used by the application.

### Spring Boot web service

- Root directory: `backend-springboot/`
- Runtime: Docker; Dockerfile path: `Dockerfile`
- Start command: the image entrypoint runs `java -jar /app/app.jar`
- Health check path: `/health`
- Required variables: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `PYTHON_SERVICE_URL`, and `FRONTEND_ORIGIN`
- Render's web-service `PORT` defaults to `10000`; the application uses the supplied value and defaults to `8080` locally. See [Render web services](https://render.com/docs/web-services).

Set `JWT_SECRET` to a newly generated, high-entropy base64 value containing at least 32 random bytes. Do not reuse the removed committed value. Set `FRONTEND_ORIGIN` to the exact Vercel origin with no path or trailing slash:

```text
https://optiwealth-qpbr.vercel.app
```

`PYTHON_SERVICE_URL` is the base URL of the Python service, without `/analyze-portfolio`. Use the URL shown for that service in Render. Services in the same region and workspace can communicate over Render's private network; use the Python service's internal address from its Render Connect page when that service accepts private traffic. Free Render web services cannot receive private-network traffic, so use the Python service's public HTTPS `onrender.com` URL when it is on the free plan. See [Render private networking](https://render.com/docs/private-network). The exact Python service URL must be supplied from the Render dashboard.

### Python analytics web service

- Root directory: `microservice-python/`
- Runtime: Docker; Dockerfile path: `Dockerfile`
- Start command: the Dockerfile starts Gunicorn with `controller:app` and binds to `0.0.0.0:$PORT` (local default `8000`; Render's web-service port defaults to `10000`)
- Health check path: `/health`
- Required for the analytics database operations and scheduled worker: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- Optional: `GOOGLE_API_KEY`; without it, quantitative analytics remains available but Gemini summaries are unavailable.

### CORS and frontend-to-API configuration

Spring Security provides the application's CORS policy. Set `FRONTEND_ORIGIN` to the deployed Vercel origin. Local HTTP/HTTPS localhost origins remain allowed for development. The policy supports the application's `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` requests and the `Authorization` and `Content-Type` headers; credentialed requests use specific allowed origins, not a wildcard.

The production frontend uses the public Spring Boot API URL:

```text
VITE_API_BASE_URL=https://optiwealth-springboot-backend-service.onrender.com
```

That value is compiled into the Vite build. Add it to Vercel's Production environment (and Preview if preview builds should call the same API), then rebuild/redeploy the frontend after changing it. The frontend uses `vercel.json` to route React Router paths back to `index.html`.

## Vercel deployment

- Project root: `frontend-react/`
- Framework: Vite (or configure the project manually)
- Install command: `npm install` (or `npm ci` when the lockfile is used)
- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `VITE_API_BASE_URL`, set to the public Spring Boot service URL
- Production branch: `main`, if that is the branch selected for production in Vercel

The Vercel project origin currently supplied for CORS is `https://optiwealth-qpbr.vercel.app`. Update Render's `FRONTEND_ORIGIN` if the Vercel production domain changes. Do not add `JWT_SECRET`, database credentials, or `GOOGLE_API_KEY` to Vercel.

## Scheduled symbol and Top Picks refresh

The workflow `.github/workflows/refresh-symbols-and-top-picks.yml` runs at 02:00 UTC, on pushes to `main`, and manually through **Actions → Refresh symbols and Top Picks → Run workflow**. GitHub Actions invokes `python symbol_refresh_worker.py --once`, which refreshes the symbols catalog and then Top Picks, exits nonzero on failure, and does not start APScheduler. Concurrency settings prevent overlapping runs. The workflow is the production scheduler; do not also run the continuous `python symbol_refresh_worker.py` scheduler on Render against the same database.

Add these GitHub repository or environment secrets:

- `DB_HOST`
- `DB_PORT` (workflow defaults to `5432` when unset; supply the actual port when using a pooler)
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

For Supabase, choose a connection endpoint reachable from GitHub-hosted runners and copy its connection fields from the dashboard. Keep all values in GitHub secrets. To test, open the Actions tab, select the workflow, and run it manually. Confirm successful completion in the job log, then check symbol search and Top Picks in the application.

GitHub Actions usage is subject to the included minutes and billing rules for the repository's visibility and account plan; see [GitHub Actions billing](https://docs.github.com/en/actions/concepts/billing-and-usage).

The one-shot worker is also useful locally:

```bash
cd microservice-python
python symbol_refresh_worker.py --once
```

It requires the Python `DB_*` variables. The continuous command `python symbol_refresh_worker.py` runs an initial refresh and schedules subsequent refreshes daily at 02:00; use only one continuous instance per database.

## Post-deployment smoke checks

1. Request `https://<spring-service-host>/health` and `https://<python-service-host>/health` and confirm each responds with a running status.
2. Register a test account and log in through the Vercel site. Confirm browser API requests target the public Spring Boot URL and that the login request's CORS preflight succeeds.
3. Create a portfolio; add, update, list, and delete a holding; and confirm data persists after reloading.
4. Search for symbols and confirm results are populated in the shared `symbols` table.
5. Run portfolio analysis and confirm the result returns through Spring Boot. This is currently a synchronous HTTP request; there is no server-side job queue or durable analysis-status endpoint. The frontend caches completed results in the current browser session.
6. Run the GitHub Actions refresh workflow and verify Top Picks are available through the authenticated application.

## Deployment values to confirm manually

- The exact Python Render URL to use as `PYTHON_SERVICE_URL`.
- The PostgreSQL provider's host, port, database name, username, and password; ensure both backend services and GitHub Actions use the same database.
- The production Vercel domain if it differs from `https://optiwealth-qpbr.vercel.app`.
- Render and Vercel production branch settings, if `main` is not already selected.
