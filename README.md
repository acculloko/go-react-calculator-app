# Full-Stack Calculator (Go Microservice & React TypeScript)

A full-stack calculator web application built with a **Go (1.22+)** microservice backend and a **React + TypeScript** frontend, architected around **SOLID principles**, clean separation of concerns, and comprehensive unit test coverage.

---

## Table of Contents
1. [Project Structure](#1-project-structure)
2. [Prerequisites & Setup Instructions](#2-prerequisites--setup-instructions)
3. [How to Run the Application](#3-how-to-run-the-application)
4. [Unit Tests & Coverage Reports](#4-unit-tests--coverage-reports)
5. [REST API Documentation & Examples](#5-rest-api-documentation--examples)
6. [Design Decisions, SOLID Architecture & Assumptions](#6-design-decisions-solid-architecture--assumptions)
7. [AI Tooling & Prompts Used](#7-ai-tooling--prompts-used)

---

## 1. Project Structure

```text
calculator-app/
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go               # HTTP server entrypoint, static serving & graceful shutdown
│   ├── internal/
│   │   ├── calculator/
│   │   │   ├── operations.go         # Strategy pattern implementations for all 7 math operations
│   │   │   ├── service.go            # Service interface & operation registry
│   │   │   └── service_test.go       # Unit tests for calculator domain logic (100% coverage)
│   │   └── handler/
│   │       ├── http.go               # REST endpoints, CORS middleware & strict JSON validation
│   │       └── http_test.go          # Unit tests for HTTP transport layer (100% coverage)
│   ├── go.mod
│   └── Dockerfile                    # Standalone non-root Go backend container
├── frontend/
│   ├── public/
│   │   └── index.html                # Application HTML shell
│   ├── src/
│   │   ├── api/
│   │   │   ├── calculatorApi.ts      # ICalculatorClient interface & Fetch implementation
│   │   │   └── calculatorApi.test.ts # Unit tests for API client layer (100% coverage)
│   │   ├── components/
│   │   │   ├── Calculator.tsx        # Presentational calculator UI component
│   │   │   ├── Calculator.css        # Responsive CSS Grid layout (desktop, mobile & short viewports)
│   │   │   └── Calculator.test.tsx   # Integration & UI unit tests across all operations
│   │   ├── hooks/
│   │   │   └── useCalculator.ts      # Custom state machine hook decoupling logic from UI
│   │   ├── types/
│   │   │   └── calculator.ts         # TypeScript request/response & operation contracts
│   │   ├── App.tsx
│   │   ├── index.tsx
│   │   ├── react-app-env.d.ts
│   │   └── setupTests.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile                    # Standalone non-root Nginx + React container
├── Dockerfile                        # Multi-stage full-stack Dockerfile (Go + React in one image)
├── docker-compose.yml                # Orchestrates frontend and backend containers together
├── .dockerignore
├── .gitignore
└── README.md
```

---

## 2. Prerequisites & Setup Instructions

### Required Versions (Local Development)
- **Go**: `1.22` or newer
- **Node.js**: `20.x LTS` (with `npm`)
- **Docker & Docker Compose** *(Optional, for containerized execution)*

### Clone & Install Dependencies
```bash
git clone https://github.com/acculloko/go-react-calculator-app.git
cd calculator-app

# Install Frontend Dependencies
cd frontend
npm install
cd ..
```
*(Note: The Go backend relies exclusively on the Go 1.22 standard library and requires zero external third-party packages).*

---

## 3. How to Run the Application

### Option A: Run Frontend + Backend Together via Docker Compose (Recommended)
Builds and runs the Go backend microservice (`calculator-backend`) and the unprivileged Nginx + React frontend (`calculator-frontend`), reverse-proxying `/api` calls automatically:

```bash
docker compose up --build
```
- **Frontend UI**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:8080/api/calculate](http://localhost:8080/api/calculate)

To stop the containers:
```bash
docker compose down
```

### Option B: Run via Single All-in-One Root Dockerfile
Compiles both the React static bundle and the Go binary into a single minimal Alpine container where Go serves both the static UI and `/api` routes on port `8080`:

```bash
docker build -t fullstack-calculator .
docker run --rm -p 8080:8080 fullstack-calculator
```
- **Application URL**: [http://localhost:8080](http://localhost:8080)

### Option C: Run Locally (Without Docker)

**1. Start the Go Backend (Terminal 1):**
```bash
cd backend
go run ./cmd/server/main.go
```
The backend microservice will listen on `http://localhost:8080`.

**2. Start the React Frontend (Terminal 2):**
```bash
cd frontend
npm start
```
The React development server will start at `http://localhost:3000` and proxy `/api` requests to `http://localhost:8080`.

---

## 4. Unit Tests & Coverage Reports

### Backend Unit Tests & Coverage
Run unit tests and generate the coverage profile targeting the internal application packages:
```bash
cd backend
go test -v -coverprofile=coverage.out ./internal/...
go tool cover -func=coverage.out
```
To generate an interactive HTML coverage report:
```bash
go tool cover -html=coverage.out -o coverage.html
```

**Backend Coverage Results:**
- `internal/calculator` (`operations.go`, `service.go`): **100.0% statement coverage**
- `internal/handler` (`http.go`): **100.0% statement coverage**
- *(Running `go test -cover ./...` across the entire module including the un-mocked `cmd/server/main.go` entrypoint yields ~80% total statement coverage).*

### Frontend Unit Tests & Coverage
```bash
cd frontend
npm run test:coverage
```
**Frontend Coverage Results:**
- `src/api/calculatorApi.ts`: **100% statement coverage**
- `src/components/Calculator.tsx`: **100% statement coverage**
- `src/hooks/useCalculator.ts`: **~98% statement coverage**
- `src/App.tsx`: **100% statement coverage**

---

## 5. REST API Documentation & Examples

All endpoints accept `POST` requests with `Content-Type: application/json` and return JSON responses.

### Supported Operations

#### 1. Specific Operation Endpoints: `POST /api/calculate/{op}`
Accepts an `OperandsRequest` payload (`{"operands": [number, ...]}`). Unknown fields (such as passing `"operation"` to a specific endpoint) are strictly rejected.

| Operation | Endpoint | Operands | Description |
| :--- | :--- | :--- | :--- |
| **Addition** | `POST /api/calculate/add` | `[a, b]` | Returns $a + b$ |
| **Subtraction** | `POST /api/calculate/subtract` | `[a, b]` | Returns $a - b$ |
| **Multiplication** | `POST /api/calculate/multiply` | `[a, b]` | Returns $a \times b$ |
| **Division** | `POST /api/calculate/divide` | `[a, b]` | Returns $a \div b$ (rejects $b = 0$) |
| **Exponentiation** | `POST /api/calculate/power` | `[base, exp]` | Returns $\text{base}^{\text{exp}}$ |
| **Square Root** | `POST /api/calculate/sqrt` | `[a]` | Returns $\sqrt{a}$ (rejects $a < 0$) |
| **Percentage** | `POST /api/calculate/percentage` | `[a]` or `[a, b]` | Unary: $a / 100$. Binary: $(a \times b) / 100$ |

#### 2. Generic Operation Endpoint: `POST /api/calculate`
Accepts a `GenericCalculationRequest` payload:
```json
{
  "operation": "add | subtract | multiply | divide | power | sqrt | percentage",
  "operands": [10, 5]
}
```

### Example API Calls (`curl`)

**1. Addition (`200 OK`):**
```bash
curl -X POST http://localhost:8080/api/calculate/add \
  -H "Content-Type: application/json" \
  -d '{"operands": [12.5, 7.5]}'
```
Response:
```json
{"result": 20}
```

**2. Exponentiation via Generic Endpoint (`200 OK`):**
```bash
curl -X POST http://localhost:8080/api/calculate \
  -H "Content-Type: application/json" \
  -d '{"operation": "power", "operands": [2, 10]}'
```
Response:
```json
{"result": 1024}
```

**3. Square Root (`200 OK`):**
```bash
curl -X POST http://localhost:8080/api/calculate/sqrt \
  -H "Content-Type: application/json" \
  -d '{"operands": [81]}'
```
Response:
```json
{"result": 9}
```

**4. Division by Zero Edge Case (`422 Unprocessable Entity`):**
```bash
curl -X POST http://localhost:8080/api/calculate/divide \
  -H "Content-Type: application/json" \
  -d '{"operands": [10, 0]}'
```
Response:
```json
{"error": "division by zero is not allowed"}
```

**5. Negative Square Root Edge Case (`422 Unprocessable Entity`):**
```bash
curl -X POST http://localhost:8080/api/calculate/sqrt \
  -H "Content-Type: application/json" \
  -d '{"operands": [-9]}'
```
Response:
```json
{"error": "square root of a negative number is not allowed"}
```

---

## 6. Design Decisions, SOLID Architecture & Assumptions

### SOLID Architecture
1. **Single Responsibility Principle (SRP)**:
   - **Backend**: Arithmetic formulas (`operations.go`), operation registry and overflow verification (`service.go`), and HTTP transport/JSON serialization (`http.go`) are isolated in dedicated layers.
   - **Frontend**: Presentation markup (`Calculator.tsx`), state machine transitions (`useCalculator.ts`), HTTP network calls (`calculatorApi.ts`), responsive styling (`Calculator.css`), and HTML (`index.html`) are strictly separated.
2. **Open/Closed Principle (OCP)**:
   - Every backend arithmetic operation implements the `Operation` interface (`Execute(operands ...float64) (float64, error)`). Adding new mathematical operations requires creating a new struct and registering it in the service map without modifying existing operation logic.
3. **Liskov Substitution Principle (LSP) & Interface Segregation Principle (ISP)**:
   - Narrow, focused interfaces (`calculator.Operation`, `calculator.Service`, and frontend `ICalculatorClient`) ensure implementations and test mocks are 100% interchangeable.
4. **Dependency Inversion Principle (DIP)**:
   - The Go HTTP `Handler` depends on the `calculator.Service` interface rather than concrete structs.
   - The React `<Calculator />` component and `useCalculator` hook accept an injected `ICalculatorClient` abstraction, allowing fast, deterministic unit testing without live network calls.

### Security, Responsiveness & Production Hardening
- **Zero External Go Dependencies**: Uses Go 1.22's enhanced `net/http` path-value routing (`POST /api/calculate/{op}`) and standard library packages.
- **Strict JSON Payload Validation**: Enforces a 1MB request body limit (`http.MaxBytesReader`), rejects unknown fields (`DisallowUnknownFields`), separates DTO structs per endpoint type, and verifies `io.EOF` so trailing JSON data is rejected.
- **HTTP Server Timeouts & Graceful Shutdown**: Configures `ReadTimeout`, `WriteTimeout`, and `IdleTimeout` on `http.Server` and handles `SIGINT`/`SIGTERM` OS signals gracefully.
- **Non-Root Docker Containers**: All Docker runtime images execute under unprivileged non-root users (`appuser` UID 10001 on Alpine and `nginxinc/nginx-unprivileged` on port 8080).
- **Adaptive Responsive UI**: Uses CSS Grid and dynamic viewport height (`dvh`) `clamp()` scaling with dedicated breakpoints for large desktop monitors, tall 20:9 mobile screens, and short/landscape viewports.

### Assumptions
- **Percentage Operation Behavior**: Supports both unary evaluation (`50%` $\rightarrow$ `0.5`) and binary context evaluation (`200 + 15%` $\rightarrow$ evaluates `15%` of `200` as `30`, which then adds to `200` = `230`), matching modern calculators.
- **Floating-Point Representation**: Standard IEEE 754 `float64` precision is used; operations resulting in `Infinity` or `NaN` (e.g., $10^{1000}$) are caught and returned as `422 Unprocessable Entity` overflow errors.

---

## 7. AI Tooling & Prompts Used

In accordance with the assessment instructions, AI assistance was used for initial scaffolding, architectural review, docker setup, and test suite expansion. Below is the list of prompts used during development:

1. **Initial Architecture & Full-Stack Scaffolding:**
   > *"You're an extremely competent developer, who has been working with Go and React ever since both languages were released. You also have a lot of experience with SOLID development practices. You need to build a full-stack app for a calculator, using a React frontend that connects to a backend microservice built in Go. You should use clean design and write maintainable code, with architecture that can be easily tested. The calculator should perform Addition, Subtraction, Multiplication, Division, Exponentiation, Square Root and Percentage operations. The frontend must be an intuitive and responsive UI with basic mobile support. Inputs must be validated and errors must be handled. You should use Typescript. Any html code should be in its own file. Use CSS for styling. For the backend, calculator operations should be linked to endpoints consumable by the frontend. Input must be validated, and edge cases such as division by zero and invalid data must be handled. All results must be returned in JSON format."*
2. **Code Audit & Industry-Standard Refactoring:**
   > *"revise everything you've given me, and check if it does what I asked in the first prompt. If everything is correct, check if there's anything that can be better according to industry standards"*
3. I've also sent some error outputs from docker and had some conversations about additional coverage for the tests.