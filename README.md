# k8s-apps

A personal lab for practicing software engineering across the full stack — frontend, backend, infrastructure, and algorithms. Built to simulate real-world development workflows, not just isolated exercises.

---

## Purpose

This repo exists as a long-term practice environment. Every feature added here is intentional — either to reinforce a concept, explore a pattern, or simulate something encountered in production. The goal is not to ship a product, but to build depth across the entire software engineering timeline.

Areas covered over time:

- Frontend — React, hooks, state management, animation, routing
- Backend — REST APIs, database design, service communication
- Infrastructure — Kubernetes, Docker, CI/CD, container orchestration
- Algorithms and data structures — implemented, analyzed, and documented with real context

---

## DSA practice

Algorithms and data structures are treated as a first-class discipline here — not an afterthought. Each problem is documented with:

- A plain-language explanation of the problem and constraints
- Step-by-step reasoning before the code
- One or more implementation approaches with time and space complexity
- Notes on trade-offs between approaches

The intent is to build the habit of thinking through a problem systematically before writing any code — which reflects how technical interviews and real debugging actually work.

Topics worked through over time:

- Array manipulation and index-based reasoning
- Binary search and the divide-and-reduce mindset
- Bit manipulation as an alternative to brute force
- Linked lists, trees, graphs — traversal and structural thinking
- Dynamic programming — overlapping subproblems and memoization
- Sorting algorithms and their practical implications
- Sliding window, two pointers, and other common patterns

Problems are added incrementally. Each entry in the app includes the problem statement, the reasoning process, and the implementation — so it can serve as a reference later.

---

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, Three.js, GSAP |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Container | Docker, multi-stage builds |
| Orchestration | Kubernetes (Minikube) |
| Registry | GitHub Container Registry (GHCR) |
| CI/CD | GitHub Actions |

---

## Structure

```text
apps/
  fe/          React frontend with nginx
  be/          Express backend

k8s/
  fe/          Kubernetes manifests for frontend
  be/          Kubernetes manifests for backend
  db/          Kubernetes manifests for PostgreSQL

.github/
  workflows/
    ci.yml     Build and push Docker images to GHCR on push
```

---

## Running locally

Prerequisites: Docker, Minikube, kubectl, Node.js

Start Minikube:

```bash
minikube start
```

Point Docker to Minikube's daemon:

```bash
eval $(minikube docker-env)
```

Build and load images:

```bash
cd apps/fe && docker build -t ghcr.io/vinhdnvn/fe:latest .
cd apps/be && docker build -t ghcr.io/vinhdnvn/be:latest .
```

Apply all manifests:

```bash
kubectl apply -f k8s/db/
kubectl apply -f k8s/be/
kubectl apply -f k8s/fe/
```

Open the app:

```bash
minikube service fe --url
```

Stop without losing state:

```bash
minikube stop
```

---

## Practice log

| Topic | Status | Location |
| --- | --- | --- |
| Todo App — CRUD, useState, useEffect | done | /todo |
| DSA — Binary Search, Missing Number | in progress | /dsa |

---

## Notes

- `imagePullPolicy: Never` is set in local manifests — images are built directly into Minikube's daemon.
- The nginx config in `apps/fe` proxies `/api/*` requests to the `be` service inside the cluster.
- DB credentials are stored in a Kubernetes Secret (`k8s/db/secret.yaml`) — do not commit real credentials.
