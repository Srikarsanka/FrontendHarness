# D&B Jira — Frontend Application

A containerized, production-grade **Jira-style Agile Task & Project Management** web application built with **Angular 17+ (standalone components & signals)**, **Angular Material 17**, **CDK Drag & Drop**, and served via **Nginx** in Docker.

---

## 1. Overview & Jira-like Capabilities

This application delivers a modern Atlassian Jira user experience:
- **Jira Top Navigation**: Global brand bar with waffle app switcher, project selector, quick filters, global **+ Create Issue** modal, search bar with `/` keyboard shortcut, and user profile avatar.
- **Agile Kanban Board**: Full drag-and-drop column workflow (**TO DO**, **IN PROGRESS**, **CODE REVIEW**, **DONE**) with automated status synchronization and optimistic UI updates.
- **Story Points & Estimation**: Real-time sum of story points per column, story point pills on issue cards, and fibonacci estimation (1, 2, 3, 5, 8, 13, 21).
- **Issue Types & Keys**: Project keys (e.g. `PRJ`, `DNB`) and auto-incrementing issue keys (e.g. `PRJ-101`) with colored issue type badges:
  - 📗 **Story** (User Stories & functional deliverables)
  - 📘 **Task** (Technical tasks & chores)
  - 🔴 **Bug** (Defects & incidents)
  - ⚡ **Epic** (High-level initiatives)
- **Quick Filters Bar**: Real-time board search, "Only my issues" toggle, issue type pill filters (Stories, Bugs, Tasks), and interactive assignee avatar filters.
- **2-Column Issue Detail**: Authentic Jira Cloud layout with left column for title, toolbar, description, activity feed, and rich comments; right sidebar for status lozenge, assignee with "Assign to me", reporter, priority, and timestamps.
- **"Your Work" Dashboard**: Jira dashboard gadgets for issues assigned to the user, active project cards with direct board links, and metrics.

---

## 2. Directory Layout

```
frontend/
├── src/
│   ├── app/
│   │   ├── app.component.ts/html/scss
│   │   ├── app.config.ts           # Standalone providers (router, http client, animations)
│   │   ├── app.routes.ts           # Lazy-loaded route map with auth guards
│   │   ├── core/
│   │   │   ├── auth/               # AuthService with signals & JWT storage
│   │   │   ├── guards/             # Functional auth & role guards
│   │   │   ├── interceptors/       # Functional JWT Bearer & Error interceptors
│   │   │   └── services/           # Project, Task, Comment, User, Notification, Env services
│   │   ├── features/
│   │   │   ├── auth/               # Login & Register components
│   │   │   ├── dashboard/          # Jira "Your Work" gadget dashboard
│   │   │   ├── projects/           # Project List, Detail, and Form
│   │   │   └── tasks/              # Jira Kanban Board, Issue Detail, Create Issue Modal
│   │   └── shared/
│   │       ├── components/         # Header, ConfirmDialog, LoadingSpinner, EmptyState
│   │       ├── models/             # Task, Project, User, Auth, Comment TypeScript models
│   │       └── pipes/              # StatusColorPipe, RelativeTimePipe
│   ├── assets/
│   │   ├── env.js                  # Local fallback runtime env
│   │   ├── env.template.js         # Template for container runtime envsubst
│   │   └── health.json             # Static health check endpoint
│   ├── environments/               # Angular CLI environment configurations
│   │   ├── environment.ts          # Default development
│   │   ├── environment.dev.ts      # DEV profile
│   │   ├── environment.qa.ts       # QA profile
│   │   ├── environment.stg.ts      # STG profile
│   │   └── environment.prod.ts     # PROD profile
│   ├── styles/                     # Atlassian design system tokens & variables
│   ├── index.html
│   ├── main.ts
│   └── styles.scss
├── nginx/
│   ├── nginx.conf                  # Base reverse proxy & SPA configuration
│   ├── nginx-dev.conf              # Development profile config
│   ├── nginx-qa.conf               # QA profile config
│   ├── nginx-stg.conf              # Staging profile config
│   └── nginx-prod.conf             # Production hardened config
├── Dockerfile                      # Multi-stage Node 20 builder + Nginx Alpine runner
├── docker-entrypoint.sh            # Runtime environment variable injection script
├── angular.json                    # Angular 17 build configurations
├── package.json
└── tsconfig.json
```

---

## 3. Runtime Environment Injection (No Image Rebuilds)

To adhere to the 12-factor application standard, the frontend container does **not** hardcode environment variables at build time. The exact same Docker image can be deployed across DEV, QA, STG, and PROD.

### Mechanism
1. Container starts via `docker-entrypoint.sh`.
2. `envsubst` reads `src/assets/env.template.js` and produces `src/assets/env.js` with live environment variable values.
3. `envsubst` updates `nginx.conf` with the backend API reverse proxy destination (`${API_BASE_URL}`).
4. `index.html` loads `env.js` before Angular initializes.
5. `EnvService` exposes runtime configuration to all Angular components and services.

### Environment Variable Contract

| Variable | Description | Default | Example |
|---|---|---|---|
| `API_BASE_URL` | Backend REST API address (proxied through `/api`) | `http://localhost:8080` | `http://backend-service:8080` |
| `APP_ENV` | Environment identifier | `dev` | `dev`, `qa`, `stg`, `prod` |

---

## 4. Local Development

### Prerequisites
- Node.js 20+ (LTS)
- npm or pnpm

### Run Locally
```bash
# Install dependencies
npm install

# Start local dev server (proxies to http://localhost:8080)
npm start
# or: ng serve
```

Navigate to `http://localhost:4200`.

### Build Artifacts
```bash
# Build for specific environment
npm run build:dev
npm run build:qa
npm run build:stg
npm run build:prod
```

### Run Tests
```bash
npm test
```

---

## 5. Docker Containerization

The frontend uses an optimized multi-stage build:
- **Build Stage**: `node:20-alpine` builds the Angular production bundle.
- **Runtime Stage**: `nginx:1.25-alpine` serves static assets and reverse proxies `/api` calls.
- **Healthcheck**: Built-in `HEALTHCHECK` pinging `/healthz`.

### Build Container
```bash
docker build -t dnb-taskmanager-frontend:1.0.0 .
```

### Run Container
```bash
docker run -d \
  --name taskmanager-frontend \
  -p 80:80 \
  -e API_BASE_URL="http://host.docker.internal:8080" \
  -e APP_ENV="dev" \
  dnb-taskmanager-frontend:1.0.0
```

Access the application at `http://localhost`.

---

## 6. Future Integration Notes (Healthcheck & Routing)

When setting up external ingress, reverse proxies, or container orchestration:
- **Healthcheck Endpoint**: `GET /healthz` returns HTTP 200 `OK`.
- **API Traffic**: All requests matching `/api/` are forwarded by Nginx to `${API_BASE_URL}` preserving headers and client IP.
- **SPA Routing**: Non-file paths are automatically rewritten by Nginx to `index.html` with HTTP 200.

