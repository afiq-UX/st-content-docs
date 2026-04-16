# ST Content Docs

This project now runs as:
- Vite frontend for the documentation UI (`index.html`)
- Express API server backed by SQLite (`server/index.js`)

## Run locally

1. Install dependencies:
   - `pnpm install`
2. Start both frontend and API together:
   - `pnpm run dev:full`
3. Or run them separately:
   - frontend: `pnpm run dev`
   - API: `pnpm run dev:api`

API default URL: `http://localhost:3001/api`

## Database

- SQLite file is created at `data/st_docs.sqlite`
- Schema is initialized automatically on API start
- Initial seed imports from the existing `DATA` block in `index.html` only when the table is empty

## CRUD endpoints

- `GET /api/content-types`
- `GET /api/content-types/:id`
- `POST /api/content-types`
- `PUT /api/content-types/:id`
- `DELETE /api/content-types/:id`
- `POST /api/content-types/:id/fields`
- `PUT /api/content-types/:id/fields/:fieldId`
- `DELETE /api/content-types/:id/fields/:fieldId`
