# ÉLAN Backend

Node.js + Express + TypeScript REST API backed by Firebase Firestore.
Pairs with the `elan-frontend-cleaned` React app.

## Quick start

```bash
npm install
cp .env.example .env       # fill in Firebase credentials (Phase 3)
npm run dev                # runs on http://localhost:4000
```

## Folder layout

```
src/
├── index.ts                Express bootstrap
├── config/firebase.ts      Firebase Admin init
├── middleware/             auth + error handling
├── routes/                 one router per resource
├── controllers/            request handlers
├── models/                 Firestore schemas + helpers
└── utils/seed.ts           one-shot Firestore seeder
```

## Endpoints

Base URL: `/api`

| Method | Path | Description |
|---|---|---|
| POST | /auth/signup | Create user |
| POST | /auth/signin | Login |
| POST | /auth/signout | Logout |
| GET | /users/me | Current user profile |
| GET | /metrics/today | Today's tracker values |
| POST | /metrics/today | Save tracker values |
| GET | /meals | Meal log for today |
| POST | /meals | Add meal entry |
| GET | /workouts | Workout catalog |
| POST | /workouts/sessions | Log a completed workout |
| GET | /meditations | Meditation catalog |
| POST | /meditations/sessions | Log a completed meditation |
| GET | /analytics/weekly | Weekly chart data |
| GET | /community/posts | Community feed |
| POST | /community/posts | Create post |
| POST | /community/posts/:id/like | Toggle like |
| POST | /community/posts/:id/comments | Add comment |
| GET | /community/challenges | Active challenges |
| GET | /shop/products | Product catalog |

## Auth

All endpoints except `/auth/*` require a Bearer token in the
`Authorization` header. The token is a Firebase ID token issued by
Firebase Auth on the frontend.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server with auto-reload |
| `npm run build` | Compile TS to `dist/` |
| `npm run start` | Run compiled output |
| `npm run seed` | Populate Firestore with sample data |
