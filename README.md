# pubmap-frontend

React + Vite frontend for **Global Research Exchange**.

- **Production URL:** https://gre.nileagi.com
- **Port:** 3099 (development)
- **API:** https://api.gre.nileagi.com/api

## Quick start

```bash
cp .env.example .env
chmod +x start.sh
./start.sh
```

Open http://localhost:3099

## Deploy

Requires [PM2](https://pm2.keymetrics.io/) (`npm install -g pm2`).

```bash
cp .env.production.example .env.production
chmod +x deploy.sh
./deploy.sh
```

Builds `dist/`, serves it on port **3099** via PM2 (`gre-frontend`). Put Nginx in front for TLS — see `deploy/nginx-frontend.example.conf`.

## Features

- Interactive Leaflet research map with search
- Simple registration (email + password) + onboarding wizard
- Author dashboard (publications workflow)
- Admin panel (authors, categories, events, ads, CMS)
- Forum, events, about/contact pages
