# Deploy Guide

## Stack
- Frontend: React + Vite, served via nginx in Docker
- Hosting: Linux server (own machine) behind NAT
- Public access: Cloudflare Tunnel (no port forwarding required)
- Domain: viktor-drunk.online

## Deploy Flow

Every time you make changes to the frontend:

**On MacOS (your machine):**
```bash
git add .
git commit -m "your message"
git push origin main
```

**On Linux server:**
```bash
~/deploy-fe.sh
```

That's it. The script pulls latest code, rebuilds the Docker image, and restarts the container. The site at `https://viktor-drunk.online` will serve the new version immediately.

## What deploy-fe.sh does
1. `git pull origin main` — fetch latest code
2. `docker build -t fe-app .` — rebuild image from Dockerfile
3. Stop and remove old container
4. Start new container on `127.0.0.1:8081`

## Pros
- Simple, no CI/CD complexity
- No external dependencies beyond Docker and git
- Cloudflare Tunnel handles HTTPS automatically, no SSL cert management needed
- Works even without a public IP on the server

## Cons
- Manual step required on the Linux server after every push
- No rollback mechanism — if new build is broken, you need to manually rebuild old version
- Build happens on the server, so it uses server CPU/RAM
- Downtime of a few seconds during container restart
