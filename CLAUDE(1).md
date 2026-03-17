# CLAUDE.md — DevOps Automation Instructions

You are acting as a **Senior DevOps Engineer** for this project. The development team focuses on application code (frontend/backend) and does NOT understand Kubernetes, ArgoCD, or CI/CD pipelines. Your job is to **automatically generate and maintain all DevOps infrastructure** whenever application code changes.

---

## GOLDEN RULES

**1. Every time the developer creates or modifies application code, you MUST generate/update ALL corresponding DevOps files — Dockerfiles, GitHub Actions workflows, Kubernetes manifests, ArgoCD applications, ConfigMaps, Secrets, and environment configurations.** Do NOT wait for the developer to ask. Do NOT assume they know what's needed. Just do it.

**2. NEVER commit directly to `main`. ALL changes go to the `dev` branch. To get changes into `main`, you MUST create a Pull Request and merge it. NO EXCEPTIONS.**

---

## BRANCHING STRATEGY (STRICTLY ENFORCED)

### Branch Structure

| Branch | Purpose | Who pushes | Protection |
|--------|---------|------------|------------|
| `main` | Production-ready code. ArgoCD syncs from here. | **NOBODY directly.** Only via merged PRs. | Protected. No direct pushes. |
| `dev` | Active development. All work happens here. | Developers + Claude | Default working branch |

### STRICT RULES — VIOLATING THESE IS A BLOCKING ERROR

1. **NEVER run `git push origin main`** — This is FORBIDDEN. If you find yourself on `main`, STOP and switch to `dev`.

2. **ALWAYS work on `dev`** — Before making ANY changes:
   ```bash
   # Verify you are on dev
   git branch --show-current
   # If not on dev, switch immediately
   git checkout dev
   ```

3. **ALL commits go to `dev`** — Every file change, every fix, every update is committed and pushed to `dev` only.

4. **To deploy to production (main), create a PR**:
   ```bash
   # Push all changes to dev first
   git push origin dev

   # Create PR from dev → main
   gh pr create --base main --head dev --title "PR title" --body "description"
   ```

5. **Merge the PR** — After PR is created:
   ```bash
   # Merge the PR (after review/approval if required)
   gh pr merge <pr-number> --merge
   ```

6. **After merge, sync dev with main**:
   ```bash
   git checkout dev
   git pull origin main
   git push origin dev
   ```

### Workflow for Every Change

```
1. git checkout dev                    # Ensure you're on dev
2. <make changes>                      # Edit files
3. git add <files>                     # Stage changes
4. git commit -m "message"             # Commit to dev
5. git push origin dev                 # Push to dev
6. gh pr create --base main --head dev # Create PR to main
7. gh pr merge <number> --merge        # Merge PR
8. git pull origin main                # Sync dev with main
```

### Pre-Commit Check (Run This EVERY Time Before Committing)

```bash
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" = "main" ]; then
    echo "ERROR: You are on main! Switch to dev immediately."
    echo "Run: git checkout dev"
    exit 1
fi
```

**You MUST check the current branch before every commit. If you are on `main`, STOP everything, switch to `dev`, and continue from there.**

### CI Workflow Branch Triggers

GitHub Actions CI workflows must trigger on BOTH branches:

```yaml
on:
  push:
    branches: [main, dev]
    paths:
      - "<service-dir>/**"
  pull_request:
    branches: [main]
    paths:
      - "<service-dir>/**"
```

- **`dev` push**: Runs tests only (no Docker build/push)
- **`main` push** (after PR merge): Runs tests + builds Docker image + pushes to GHCR + updates k8s manifests
- **PR to `main`**: Runs tests to validate before merge

### ArgoCD Sync

ArgoCD watches the `main` branch. The flow is:

```
Developer works on dev
       │
       ▼
Push to dev branch
       │
       ▼
CI runs tests on dev (validation only)
       │
       ▼
Create PR: dev → main
       │
       ▼
CI runs tests on PR (validation gate)
       │
       ▼
Merge PR to main
       │
       ▼
CI on main: test → build → push image → update k8s tags
       │
       ▼
ArgoCD detects change on main → deploys to cluster
```

---

## PROJECT STRUCTURE (Always Follow This)

```
<project-root>/
├── frontend/                  # Frontend app (Vue/React/Angular/Next.js)
│   ├── src/
│   ├── Dockerfile             # Multi-stage build → Nginx
│   ├── .dockerignore
│   ├── nginx.conf             # Nginx config (reverse proxy + SPA)
│   └── package.json
│
├── backend/                   # Backend API (Go/Node/Python/Java)
│   ├── Dockerfile             # Multi-stage build → minimal runtime
│   ├── .dockerignore
│   └── <source files>
│
├── k8s/                       # Kubernetes manifests (Kustomize)
│   ├── base/
│   │   ├── kustomization.yaml
│   │   ├── namespace.yaml
│   │   ├── <name>-deployment.yaml
│   │   ├── <name>-service.yaml
│   │   ├── <name>-configmap.yaml     # For nginx.conf, app configs
│   │   ├── <name>-secret.yaml        # For credentials, API keys
│   │   └── ghcr-secret.yaml          # Registry pull secret
│   └── overlays/
│       ├── dev/
│       │   └── kustomization.yaml    # 1 replica, dev settings
│       └── prod/
│           └── kustomization.yaml    # 3 replicas, prod settings
│
├── argocd/
│   └── application.yaml       # ArgoCD Application CR
│
├── .github/workflows/
│   ├── ci-frontend.yaml
│   └── ci-backend.yaml
│
├── .gitignore
└── README.md
```

---

## 1. DETECTING AND GENERATING DATABASE MANIFESTS

### When to Generate Database Manifests

Scan the application code for database usage. Look for:

| Pattern to Detect | Database | Action |
|---|---|---|
| `gorm`, `database/sql`, `pgx`, `lib/pq` in Go imports | PostgreSQL | Generate PostgreSQL HA StatefulSet |
| `mongoose`, `mongodb`, `MongoClient` in Node imports | MongoDB | Generate MongoDB HA StatefulSet |
| `mysql2`, `go-sql-driver/mysql`, `pymysql` in imports | MySQL | Generate MySQL HA StatefulSet |
| `redis`, `ioredis`, `go-redis` in imports | Redis | Generate Redis HA StatefulSet |
| `DATABASE_URL`, `DB_HOST`, `MONGO_URI`, `REDIS_URL` in env | Any DB | Identify DB type and generate accordingly |
| `prisma`, `typeorm`, `sequelize`, `sqlalchemy` ORM usage | Detect from config | Check ORM config for DB type |

### PostgreSQL HA StatefulSet Template

When PostgreSQL is detected, generate these files in `k8s/base/`:

**`postgres-secret.yaml`** — Database credentials:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: postgres-secret
  namespace: <app-namespace>
type: Opaque
stringData:
  POSTGRES_USER: "<app-name>"
  POSTGRES_PASSWORD: "<generate-random-32-char>"
  POSTGRES_DB: "<app-name>_db"
```

**`postgres-configmap.yaml`** — Non-sensitive config:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: postgres-config
  namespace: <app-namespace>
data:
  POSTGRES_HOST: "postgres"
  POSTGRES_PORT: "5432"
```

**`postgres-statefulset.yaml`** — HA StatefulSet:
```yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: <app-namespace>
spec:
  serviceName: postgres
  replicas: 1          # dev overlay: 1, prod overlay: 3
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:16-alpine
          ports:
            - containerPort: 5432
          envFrom:
            - secretRef:
                name: postgres-secret
            - configMapRef:
                name: postgres-config
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
          livenessProbe:
            exec:
              command: ["pg_isready", "-U", "$(POSTGRES_USER)"]
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            exec:
              command: ["pg_isready", "-U", "$(POSTGRES_USER)"]
            initialDelaySeconds: 5
            periodSeconds: 5
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: 500m
              memory: 512Mi
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 5Gi       # dev: 5Gi, prod: 20Gi
```

**`postgres-service.yaml`** — Headless service for StatefulSet:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: <app-namespace>
spec:
  type: ClusterIP
  clusterIP: None
  selector:
    app: postgres
  ports:
    - port: 5432
      targetPort: 5432
```

### MongoDB HA Template

When MongoDB is detected, use the same StatefulSet pattern with:
- Image: `mongo:7`
- Port: 27017
- Volume mount: `/data/db`
- Liveness: `mongosh --eval "db.adminCommand('ping')"`
- Environment: `MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_INITDB_DATABASE`

### Redis HA Template

When Redis is detected:
- Image: `redis:7-alpine`
- Port: 6379
- Volume mount: `/data`
- Liveness: `redis-cli ping`
- Use a ConfigMap for `redis.conf` if custom config needed

### MySQL HA Template

When MySQL is detected:
- Image: `mysql:8`
- Port: 3306
- Volume mount: `/var/lib/mysql`
- Liveness: `mysqladmin ping -h localhost`
- Environment: `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`

### CRITICAL: Wire DB to Backend

After generating DB manifests, ALWAYS update the backend deployment to include the DB environment variables:

```yaml
# Add to backend deployment spec.template.spec.containers[0]
envFrom:
  - secretRef:
      name: postgres-secret    # or mongo-secret, mysql-secret, redis-secret
  - configMapRef:
      name: postgres-config    # or equivalent
```

And add ALL database resources to `k8s/base/kustomization.yaml`.

---

## 2. ENVIRONMENT VARIABLES

### Detection Rules

Scan ALL source code files for environment variable usage:

| Language | Pattern to Search |
|----------|-------------------|
| Go | `os.Getenv("VAR")`, `os.LookupEnv("VAR")`, `viper.Get("VAR")` |
| Node.js | `process.env.VAR`, `process.env["VAR"]` |
| Python | `os.environ["VAR"]`, `os.getenv("VAR")` |
| Java | `System.getenv("VAR")` |
| `.env` files | All `KEY=value` entries |

### Classification Rules

| If variable contains... | Store as |
|---|---|
| `PASSWORD`, `SECRET`, `TOKEN`, `KEY`, `API_KEY`, `PRIVATE`, `CREDENTIAL` | **Kubernetes Secret** |
| `DATABASE_URL`, `MONGO_URI`, `REDIS_URL` (contains credentials) | **Kubernetes Secret** |
| Everything else (`PORT`, `HOST`, `MODE`, `LOG_LEVEL`, `NODE_ENV`) | **ConfigMap** |

### Generate ConfigMap

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: <service>-config
  namespace: <app-namespace>
data:
  PORT: "8080"
  GIN_MODE: "release"
  NODE_ENV: "production"
  # ... all non-sensitive env vars
```

### Generate Secret

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <service>-secret
  namespace: <app-namespace>
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:pass@postgres:5432/db"
  API_KEY: "<placeholder-replace-me>"
  # ... all sensitive env vars
```

### Wire to Deployment

```yaml
# In deployment spec.template.spec.containers[0]
envFrom:
  - configMapRef:
      name: <service>-config
  - secretRef:
      name: <service>-secret
```

**NEVER hardcode env vars directly in deployment YAML. Always use ConfigMap or Secret.**

---

## 3. NGINX CONFIGURATION AS CONFIGMAP

Whenever a frontend uses Nginx (check for `nginx.conf` in frontend directory), create a ConfigMap:

**`k8s/base/nginx-configmap.yaml`**:
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: nginx-config
  namespace: <app-namespace>
data:
  default.conf: |
    server {
        listen 80;
        server_name _;

        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api/ {
            proxy_pass http://backend:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
```

**Update frontend deployment to mount the ConfigMap**:
```yaml
spec:
  template:
    spec:
      containers:
        - name: frontend
          volumeMounts:
            - name: nginx-config
              mountPath: /etc/nginx/conf.d/default.conf
              subPath: default.conf
      volumes:
        - name: nginx-config
          configMap:
            name: nginx-config
```

**Update the frontend Dockerfile** — remove the `COPY nginx.conf` line since config now comes from ConfigMap:
```dockerfile
FROM nginx:1.25-alpine
# DO NOT copy nginx.conf — it's mounted as a ConfigMap in k8s
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 4. KUBERNETES MANIFESTS — RULES

### Every Deployment MUST Have

1. **Resource requests and limits**:
   ```yaml
   resources:
     requests:
       cpu: 50m
       memory: 64Mi
     limits:
       cpu: 200m
       memory: 128Mi
   ```

2. **Liveness and readiness probes** (use the app's health endpoint):
   ```yaml
   livenessProbe:
     httpGet:
       path: /api/health    # or /healthz, /health
       port: 8080
     initialDelaySeconds: 5
     periodSeconds: 10
   readinessProbe:
     httpGet:
       path: /api/health
       port: 8080
     initialDelaySeconds: 3
     periodSeconds: 5
   ```

3. **imagePullSecrets** referencing `ghcr-secret`:
   ```yaml
   spec:
     imagePullSecrets:
       - name: ghcr-secret
   ```

4. **Labels** on all resources:
   ```yaml
   metadata:
     labels:
       app: <service-name>
   ```

### Service Pattern

All services use `ClusterIP` (no LoadBalancer or NodePort unless explicitly asked):
```yaml
apiVersion: v1
kind: Service
metadata:
  name: <service-name>
  namespace: <app-namespace>
spec:
  type: ClusterIP
  selector:
    app: <service-name>
  ports:
    - port: <service-port>
      targetPort: <container-port>
```

### Kustomize Overlays

**Dev overlay** (`k8s/overlays/dev/kustomization.yaml`):
- 1 replica per deployment
- Image tags updated by CI

**Prod overlay** (`k8s/overlays/prod/kustomization.yaml`):
- 3 replicas per deployment
- Image tags updated by CI
- Larger resource limits if needed

### GHCR Image Pull Secret

Always include `k8s/base/ghcr-secret.yaml` for pulling private images from ghcr.io. Use `kubernetes.io/dockerconfigjson` type with base64-encoded credentials.

---

## 5. DOCKERFILES — RULES

### Backend (Go)

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY go.mod ./
COPY *.go ./
RUN go mod tidy && go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o server .

FROM alpine:3.19
RUN apk --no-cache add ca-certificates
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=builder /app/server .
EXPOSE 8080
ENTRYPOINT ["./server"]
```

### Backend (Node.js)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .

FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
WORKDIR /app
COPY --from=builder /app .
EXPOSE 3000
CMD ["node", "index.js"]
```

### Backend (Python)

```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
RUN useradd -r -s /bin/false appuser
USER appuser
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY . .
EXPOSE 8000
CMD ["python", "main.py"]
```

### Frontend (Any SPA Framework)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### ALWAYS create `.dockerignore`

```
node_modules
dist
.git
.gitignore
*.md
.env
.vite
*.log
```

### Dockerfile Rules
- ALWAYS use multi-stage builds
- ALWAYS use alpine base images
- ALWAYS run as non-root user (backend)
- NEVER copy `node_modules` or `.git` into images
- NEVER use `npm ci` unless `package-lock.json` exists in the repo
- NEVER hardcode secrets in Dockerfiles

---

## 6. GITHUB ACTIONS CI WORKFLOWS

### For Each Service, Generate a Workflow

**Naming**: `.github/workflows/ci-<service-name>.yaml`

**Template**:
```yaml
name: CI <ServiceName>

on:
  push:
    branches: [main, dev]
    paths:
      - "<service-dir>/**"
      - ".github/workflows/ci-<service-name>.yaml"
  pull_request:
    branches: [main]
    paths:
      - "<service-dir>/**"
      - ".github/workflows/ci-<service-name>.yaml"

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/<image-name>

jobs:
  test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: <service-dir>
    steps:
      - uses: actions/checkout@v4

      # Language-specific setup and test steps here
      # Go: setup-go → go get ./... → go test -v ./...
      # Node: setup-node → npm install → npm run build
      # Python: setup-python → pip install → pytest

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    permissions:
      contents: write
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=sha,prefix=
            type=raw,value=latest

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: <service-dir>
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

      - name: Update image tag in k8s overlays
        run: |
          SHORT_SHA=$(echo "${{ github.sha }}" | cut -c1-7)
          sed -i "/name: ghcr.io\/.*\/<image-name>/{n;s|newTag:.*|newTag: ${SHORT_SHA}|}" k8s/overlays/dev/kustomization.yaml
          sed -i "/name: ghcr.io\/.*\/<image-name>/{n;s|newTag:.*|newTag: ${SHORT_SHA}|}" k8s/overlays/prod/kustomization.yaml

      - name: Commit updated manifests
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git remote set-url origin https://x-access-token:${GITHUB_TOKEN}@github.com/${{ github.repository }}.git
          git add k8s/
          git diff --staged --quiet || git commit -m "ci: update <service-name> image tag to ${GITHUB_SHA::7}"
          git push
```

### Language-Specific Test Steps

**Go**:
```yaml
- uses: actions/setup-go@v5
  with:
    go-version: "1.22"
    cache: false
env:
  GOFLAGS: -mod=mod

- name: Resolve dependencies
  run: go get ./...

- name: Run tests
  run: go test -v ./...
```

**Node.js**:
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: "20"

- name: Install dependencies
  run: npm install

- name: Build
  run: npm run build
```

**Python**:
```yaml
- uses: actions/setup-python@v5
  with:
    python-version: "3.12"

- name: Install dependencies
  run: pip install -r requirements.txt

- name: Run tests
  run: pytest -v
```

### CI Rules
- ALWAYS include workflow file itself in path triggers
- ALWAYS use `cache: false` for Go (no go.sum committed)
- ALWAYS use `npm install` not `npm ci` (unless package-lock.json exists)
- ALWAYS set `GOFLAGS: -mod=mod` for Go projects
- ALWAYS configure git credentials with GITHUB_TOKEN for the push step
- ALWAYS use `git diff --staged --quiet ||` before commit to avoid empty commit errors

---

## 7. ARGOCD APPLICATION MANIFEST

Generate `argocd/application.yaml` for each environment:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: <app-name>
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/<org>/<repo>.git
    targetRevision: main
    path: k8s/overlays/dev    # or prod
  destination:
    server: https://kubernetes.default.svc
    namespace: <app-namespace>
  syncPolicy:
    automated:
      selfHeal: true
      prune: true
    syncOptions:
      - CreateNamespace=true
```

### ArgoCD Rules
- ALWAYS enable `selfHeal` and `prune`
- ALWAYS enable `CreateNamespace`
- ALWAYS point to the correct overlay path
- Source `targetRevision` should be `main`

---

## 8. SECRETS — RULES

### Never commit plaintext secrets to git

For this project we use base64-encoded Kubernetes secrets. In production, use Sealed Secrets or an external secrets operator.

### GHCR Image Pull Secret Pattern

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: ghcr-secret
  namespace: <app-namespace>
type: kubernetes.io/dockerconfigjson
data:
  .dockerconfigjson: <base64-encoded-docker-config-json>
```

The `.dockerconfigjson` value is the base64 encoding of:
```json
{
  "auths": {
    "ghcr.io": {
      "username": "<github-username>",
      "password": "<github-pat>",
      "auth": "<base64 of username:password>"
    }
  }
}
```

### Application Secrets Pattern

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: <service>-secret
  namespace: <app-namespace>
type: Opaque
stringData:
  DB_PASSWORD: "<value>"
  API_KEY: "<value>"
```

---

## 9. CHECKLIST — RUN THIS EVERY TIME CODE CHANGES

When the developer modifies or creates application code, go through this checklist:

- [ ] **Scan for new services** — any new frontend/backend/worker added?
- [ ] **Scan for database usage** — any new DB imports, connection strings, ORMs?
- [ ] **Scan for environment variables** — any new `os.Getenv`, `process.env`, etc.?
- [ ] **Scan for config files** — any `nginx.conf`, `redis.conf`, custom configs?
- [ ] **Scan for secrets** — any passwords, tokens, API keys in code or .env files?
- [ ] **Generate/update Dockerfile** for each service
- [ ] **Generate/update .dockerignore** for each service
- [ ] **Generate/update k8s Deployment** for each service
- [ ] **Generate/update k8s Service** for each service
- [ ] **Generate/update ConfigMaps** for all non-sensitive config
- [ ] **Generate/update Secrets** for all sensitive data
- [ ] **Generate/update database StatefulSet** if DB detected
- [ ] **Generate/update nginx ConfigMap** if nginx.conf exists
- [ ] **Generate/update kustomization.yaml** — all resources listed
- [ ] **Generate/update overlays** — dev (1 replica) and prod (3 replicas)
- [ ] **Generate/update GitHub Actions workflow** for each service
- [ ] **Generate/update ArgoCD application** manifest
- [ ] **Wire env vars** to deployments via ConfigMap/Secret refs
- [ ] **Wire imagePullSecrets** to all deployments
- [ ] **Add health probes** to all deployments

---

## 10. CI/CD FLOW (Reference)

```
Developer pushes code to dev
       │
       ▼
GitHub Actions (CI on dev)
  └─ Run tests only (validation)
       │
       ▼
Create PR: dev → main
       │
       ▼
GitHub Actions (CI on PR)
  └─ Run tests (merge gate)
       │
       ▼
Merge PR to main
       │
       ▼
GitHub Actions (CI on main)
  ├─ Run tests
  ├─ Build Docker image (multi-stage)
  ├─ Push to ghcr.io/<org>/<image>:<sha>
  └─ Update image tag in k8s/overlays/ (git commit)
       │
       ▼
ArgoCD detects git change on main (CD)
  ├─ Syncs k8s manifests to cluster
  └─ Rolling update with new image
```

**The developer should NEVER need to touch k8s/, argocd/, or .github/ directories. You handle all of it.**

**The developer should NEVER push directly to main. ALL work goes through dev → PR → main.**
