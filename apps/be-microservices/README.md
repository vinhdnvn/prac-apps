# be-microservices

NestJS monorepo with a microservice architecture. Three independent services communicate over internal TCP.

---

## Architecture

```
api-gateway   (HTTP :3000)   — public entry point, receives and forwards requests
users         (TCP  :3001)   — handles user-related business logic
products      (TCP  :3002)   — handles product-related business logic
libs/common                  — shared message patterns and constants
```

Clients only interact with `api-gateway`. The other two services do not expose HTTP — they listen on TCP internally only.

---

## Requirements

- Node.js 20+
- yarn 1.x
- Docker + Docker Compose (for container-based setup)

---

## Running locally (development)

```bash
yarn install
yarn dev
```

The `dev` command starts all three services in parallel with watch mode. Ports `3000`, `3001`, and `3002` must be available.

Or run each service separately in three terminals:

```bash
yarn start:gateway
yarn start:users
yarn start:products
```

---

## Running with Docker

```bash
docker compose up --build
```

Services communicate over the internal Docker network. Only `api-gateway` is mapped to the host on port `3000`.

---

## Endpoints

All requests go through `api-gateway`. Base URL: `http://localhost:3000/api`

```
GET    /api/health
GET    /api/users
GET    /api/users/:id
POST   /api/users          body: { name, email }
GET    /api/products
GET    /api/products/:id
POST   /api/products       body: { name, price }
```

---

## Production build

```bash
yarn build:gateway
yarn build:users
yarn build:products
```

Output is placed at `dist/apps/<service-name>/main.js`.

---

## Project structure

```
apps/
  api-gateway/      HTTP server, proxy layer
  users/            Users microservice
  products/         Products microservice
libs/
  common/           Shared message patterns
Dockerfile.gateway
Dockerfile.users
Dockerfile.products
docker-compose.yml
nest-cli.json       Monorepo config
```

---

## Notes

Transport is TCP (NestJS built-in, no broker required). Suitable for simple environments or learning purposes. To scale further, switch to Redis or RabbitMQ transport in `ClientsModule.register`.
