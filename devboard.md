# Devboard — Progress

Spring Boot microservices + React client. Status of what's implemented so far.

## Services

| Service | Port | Stack |
|---|---|---|
| api-gateway | 8060 | Spring Cloud Gateway (MVC/servlet) |
| auth-service | 8080 | Web, Security, JPA, JWT |
| task-service | 8081 | Web, JPA, Mail, OpenFeign |
| client | 5173 | React 19, Vite, TS, Tailwind |

No service discovery. Eureka was removed; services address each other by URL.
The browser only ever talks to the gateway on 8060.

## api-gateway
- Routes: `/auth/**` → auth-service, `/tasks/**` → task-service.
- Downstream URLs come from `auth.service.url` / `task.service.url`, which read the
  `AUTH_SERVICE_URL` / `TASK_SERVICE_URL` env vars and fall back to `http://localhost:8080`
  and `:8081` for local dev. No env setup needed to run locally.
- `CorsConfig` — the single CORS layer for the whole system (`allowedOriginPatterns("*")`).
  Downstream services must not add their own; two layers made the gateway proxy duplicate
  `Access-Control-Allow-Origin` headers and the browser rejected every request.

## auth-service
- `POST /auth/register` — register user
- `POST /auth/login` — login, returns JWT
- `GET /auth/emails` — list all user emails
- `GET /auth/exists?email=` — existence check (consumed by task-service)
- `User` entity + `UserRepository` (Postgres/Neon)
- JWT generate / extract-email / validate (`JwtService`)
- `JwtAuthFilter` + `SecurityConfig` — CORS disabled (gateway owns it), stateless sessions,
  OPTIONS permitted everywhere, all four `/auth/*` endpoints public, everything else authenticated
- BCrypt password hashing
- DTOs: `RegisterRequest`, `LoginRequest`, `AuthResponse`
- HikariCP tuned for Neon: pool max 10, 30s connection-timeout, 5min max-lifetime,
  keepalive, leak detection at 20s, `initialization-fail-timeout=-1`. Sized for the browser's
  concurrent requests — the old single-connection pool deadlocked under parallel load.

## task-service
- `POST /tasks` — create
- `GET /tasks?ownerEmail=` — list tasks you own
- `GET /tasks?assignedEmail=` — list tasks assigned to you
- `GET /tasks/{id}` — get one
- `PUT /tasks/{id}` — update
- `DELETE /tasks/{id}` — delete
- `Task` entity: title, description, status (TODO default), priority (MEDIUM default), dueDate, startDate, ownerEmail, assignedEmails
- `TaskRepository`: `findByOwnerEmail`, `findByAssignedEmailsContaining`,
  plus `findByOwnerEmailAndStatus` / `findByOwnerEmailAndPriority` (declared, not yet wired to any endpoint)
- `AuthClient` — Feign client to auth-service for email validation, pointed at
  `${auth.service.url}` (same `AUTH_SERVICE_URL` env var as the gateway)
- `EmailService` — `@Async` SMTP assignment notifications on create and on update
  (diffs old vs new assignees), on a dedicated `devboard-mail-` pool so a slow SMTP
  handshake never pins a request thread; 10s connect/read/write timeouts
- Same Hikari tuning as auth-service
- No `CorsConfig` — deliberately removed, see api-gateway

## client
- Pages: Login, Register, Dashboard, AssignedTask
- `DashboardLayout` + `Sidebar`
- `TaskModal` (create/edit), `DeleteModal`, `Loader`, `AddToCalendarButton`
- `lib/calender.ts` — builds Google Calendar links from a task's due date, with an
  overdue/due-today/upcoming prefix
- `UserContext` for auth state
- `App.tsx` route guards: `ProtectedRoute` and `PublicRoute` both decode the JWT and
  check `exp`, so an expired token redirects to /login instead of failing at the API
- Both `VITE_AUTH_URL` and `VITE_TASK_URL` point at the gateway (`:8060`)
- Routing (react-router-dom), axios, react-hot-toast, lucide-react
- Typed task model (`types/task.ts`)

## Not done yet
- JWT validation at the gateway (each service handles its own)
- Task ownership/authorization checks on task endpoints — any caller can read or mutate
  any task by id
- Secrets are hardcoded in `application.properties` (Neon DB password, Gmail app password)
  and committed to git
- `/tasks` and `/architecture` client routes are placeholder divs
- Status/priority filtering exists in the repository but no endpoint exposes it
- Tests are generated context-load stubs only
- Spring Boot version drift: task-service on 4.0.1, others on 4.1.0
