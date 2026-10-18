# Axiologic Platform

A metadata-driven business application platform built with Next.js, FastAPI and PostgreSQL. Pages, layouts, entities, themes and workflows are described by metadata so developers can build industry-specific CRM and ERP applications. The repository includes administration tools and a legal-practice application for clients, matters and time tracking.

This is an active development project. Some services and vertical applications are scaffolding; production readiness and regulatory compliance have not been established.

## Development setup

Prerequisites: Node.js/npm, Python 3.11+, Poetry, and Docker Compose.

1. Copy `env.example` to `.env`. Fill the blank credential fields locally. Never commit `.env`.
2. Set `DATABASE_URL` to your local PostgreSQL connection URL. Set `DOCKER_DATABASE_URL` to a connection URL using host `postgres`, and `DOCKER_TENANT_DB_TEMPLATE` to the tenant connection template appropriate for your database setup. Match `POSTGRES_PASSWORD` to the Docker URLs and URL-encode special characters in URL passwords.
3. Generate independent `SECRET_KEY` and `JWT_SECRET_KEY` values; the JWT key must contain at least 32 characters. Set `ADMIN_PASSWORD` and `DEMO_USER_PASSWORD` before running optional seed scripts.
4. Run `docker compose up --build` to start PostgreSQL, Redis, authentication and API services. Database initialization scripts run on a fresh Docker volume. Existing volumes retain their state.
5. Run `npm install`, then `npm run dev:legal` or `npm run dev:client` for a frontend.

For services run outside Docker, install each service's Poetry dependencies from its own directory (`services/api` and `services/auth`). Put the required settings in an ignored `.env` in that service directory or export them in the process environment. Standalone database utilities read exported environment variables; running a Python script does not automatically load the root `.env`.

Backend ports: API 8000 and authentication 8001. The legal app uses port 3006. Additional applications and services are under `apps/`, `services/` and `packages/`.

## Credentials and data

Runtime credentials come from environment variables; tracked templates leave sensitive values empty. OAuth and SMTP settings are optional until those integrations are enabled. Supply provider API keys only through ignored local environment files or process environment variables. Database exports and local repair scripts are excluded. Demo user records use example.invalid addresses and contain no password hashes; seed scripts require a locally supplied password.

Review migration and database-reset scripts before running them: they can alter or replace local database contents. This publication was checked without starting services or changing existing databases.

## License

MIT. See [LICENSE](LICENSE).
