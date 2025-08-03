# 📦 Scan Orchestration Platform

A lightweight CI/CD orchestration API backend designed to trigger Jenkins pipelines, track build progress, fetch logs, and handle post-build results in a secure and extensible way.

---

## ✅ Business Requirements Summary

- Trigger Jenkins pipelines from a web-based frontend using configurable parameters.
- Support **multiple types of scans** (e.g., SAST, FOSS, DAST).
- Poll Jenkins job status and logs in near real time.
- Receive and store scan results via **Jenkins callback** (e.g., report URLs, scores, metadata).
- Support simple security using **API Key verification**.
- Support future migration of **some endpoints to GraphQL**, e.g., job status, logs, scan results.
- Designed for **small teams**, with simplicity, readability, and maintainability prioritized.

---

## 🧩 Technical Stack

| Layer          | Technology                         | Notes                                                 |
|----------------|-------------------------------------|--------------------------------------------------------|
| Language       | TypeScript                         | Safer, more maintainable for small teams              |
| Framework      | Express.js                         | REST APIs & GraphQL handled together                  |
| ORM            | Objection.js + Knex                | Maps to Oracle (or any SQL DB)                        |
| Database       | Oracle                             | External or dockerized                                |
| Auth           | API Key header                     | Easy to implement, minimal config                     |
| CI/CD API      | Jenkins HTTP API                   | Trigger pipelines, poll status, get logs              |
| Workflow       | Extendable to Temporal/Workflows   | Future-proofed via modular design                     |
| Logs           | Winston or Pino                    | Structured logging                                     |
| GraphQL        | Apollo Server (optional)           | Used for real-time query: logs/status/report          |
| Dev Tooling    | Docker + Docker Compose            | For local development & isolation                     |
| Tests          | Jest + Supertest                   | REST API + logic unit tests                           |

---

## 📁 API Summary (REST + GraphQL)

| Type       | Endpoint / Query                         | Method | Description                                  |
|------------|-------------------------------------------|--------|----------------------------------------------|
| REST API   | `/api/scan/trigger`                      | POST   | Trigger a Jenkins job with dynamic parameters |
| REST API   | `/api/scan/callback`                     | POST   | Jenkins calls back with scan result data     |


---

## 🔍 GraphQL Query Entry
query { scanJob(id: String!) { ... } }
Combines status, log, and result into a single response:

status: running, completed, failed

log: Jenkins console output

result: report URL, summary, metadata (tool, severity)

---

### 🔄 Why Mixed Design?

- 🔐 **Triggering & Callback**: Still handled by REST (suitable for action endpoints, supports secure API key).
- 📊 **Read APIs (status, logs, result)**: Migrated to GraphQL for:
  - Client-side flexibility
  - Efficient data fetching and UI rendering
  - Support for nested queries in future

---

## 🐳 Docker & Local Dev

- `Dockerfile` builds the TypeScript backend with Node.js.
- `docker-compose.yml` includes:
  - Node.js API service
  - Oracle XE (optional for local)
  - Jenkins mock or real Jenkins endpoint
- Environment config managed via `.env`.

---

## 🔐 Security

- All APIs protected by an `x-api-key` header.
- Only trusted UIs with valid keys can trigger or read scan results.

---

## 🧪 Tests

- Written in Jest with isolated unit tests for trigger logic and callback parsing.
- Mock Jenkins API in integration tests.

---
## 📁 Folder Structure (Planned)

📦 ci-api-service
├── src/
│   ├── api/               # REST and GraphQL route handlers
│   ├── services/          # Jenkins, DB interaction logic
│   ├── db/                # Knex / Objection models
│   ├── auth/              # API key validation
│   ├── graphql/           # Schema, resolvers
│   └── index.ts           # Server entry point
├── docker-compose.yml
├── Dockerfile
├── .env
└── README.md

---
