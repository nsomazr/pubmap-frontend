# pubmap-frontend

React + Vite frontend for **Global Research Exchange**.

- **Production URL:** https://gre.nileagi.com
- **Port:** 3009 (development)
- **API:** https://api.gre.nileagi.com/api

## Quick start

```bash
cp .env.example .env
chmod +x start.sh
./start.sh
```

Open http://localhost:3009

## Deploy

```bash
cp .env.production.example .env.production
chmod +x deploy.sh
./deploy.sh
```

Serve the `dist/` folder behind Nginx with TLS for `gre.nileagi.com`.

## Features

- Interactive Leaflet research map with search
- Simple registration (email + password) + onboarding wizard
- Author dashboard (publications workflow)
- Admin panel (authors, categories, events, ads, CMS)
- Forum, events, about/contact pages
