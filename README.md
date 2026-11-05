# Hispana Percusión · web

Página de Hispana Percusión: HispanApp, el método *Los Ritmos del Flamenco*, cajones y Patreon.

- `public/` — la página (lo que se publica). `index.html` + `img/`.
- `wrangler.jsonc` — configuración de Cloudflare (Worker **hispana-web**, solo archivos estáticos).
- `patreon/worker.js` — copia del código del Worker **hispana-patreon**, que trae los últimos videos de Patreon. Ese Worker se edita en Cloudflare y usa el secreto `PATREON_TOKEN` (no va en este repositorio).

Cada cambio que se une a `main` se publica solo en Cloudflare.
