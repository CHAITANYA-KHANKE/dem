# Legacy Customer API (scanner test fixture)

A small Express/SQLite microservice intentionally seeded with security findings for DevSec static-analysis testing. **This repository is deliberately vulnerable. Use only in an isolated, disposable local environment; never deploy it or use real credentials.**

## Run locally

Requires Node.js 18 or newer.

```sh
cp .env.example .env
npm install
npm start
```

The service listens on `http://localhost:3000`. SQLite creates `data/legacy-service.sqlite` on first start.

## Sample routes

- `GET /` — service metadata
- `GET /health` — basic health check
- `GET /api/users?id=1` — seeded users
- `GET /api/echo?text=hello` — shell echo endpoint
- `GET /api/file?file=README.md` — reads a file relative to the process working directory
- `GET /search?q=legacy` — HTML search response

## Deliberate scanner findings

| Category | Location | Finding |
| --- | --- | --- |
| Secrets | `aws-config.js` | Fake AWS access key and secret key in source |
| Secrets | `.env.example`, `server.js` | Dummy JWT secret / unsafe fallback |
| Code | `server.js` | SQL injection via raw `req.query.id` interpolation |
| Code | `server.js` | Command injection through `child_process.exec()` |
| Code | `server.js` | Unvalidated file read / path traversal and missing authorization |
| Code | `server.js` | Reflected XSS from unescaped query text in HTML |
| Dependencies | `package.json` | Intentionally outdated `lodash` 4.17.15 |
| Config | `server.js` | Wildcard CORS origin with credentials; Helmet middleware disabled |
| Config | `Dockerfile` | Runs as root and grants world-writable permissions |

The credentials are fake scanner fixtures, not usable credentials. Keep this app off public networks: in particular, the command endpoint executes shell input, and the Docker image intentionally runs as root.
