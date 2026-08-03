# MediTriage Public API (Phase 3)

Base URL (local): `http://localhost:3001/api/v1`

## Auth

Send an API key as a Bearer token:

```http
Authorization: Bearer mt_live_YOUR_KEY
```

### Quick start (env)

In `.env`:

```env
TRIAGE_API_KEYS=mt_live_devkey123:demo-clinic
```

### Production (Supabase)

1. Run `supabase/schema-phase3.sql`
2. Set `SUPABASE_SERVICE_ROLE_KEY` in server `.env` (never expose to Vite)
3. Insert a hashed key (Node one-liner):

```js
import crypto from 'crypto'
const raw = 'mt_live_' + crypto.randomBytes(24).toString('hex')
const hash = crypto.createHash('sha256').update(raw).digest('hex')
console.log({ raw, prefix: raw.slice(0, 12), hash })
```

Then insert into `api_keys` with the org id.

## Endpoints

### `GET /api/v1/health`

### `POST /api/v1/triage`

```json
{
  "messages": [
    { "role": "user", "content": "Severe chest pain and trouble breathing for 20 minutes" }
  ],
  "locale": "en",
  "lat": 28.61,
  "lng": 77.21,
  "includeCare": true
}
```

Returns `{ text, assessment, protocol, merge, care, requestId, org }`.

### `POST /api/v1/cases`

Push a finished assessment into the clinic inbox (requires DB-backed key + service role).

## White-label URLs

| URL | Purpose |
|-----|---------|
| `/o/demo-clinic/triage` | Partner-branded patient triage |
| `/o/demo-clinic/clinic` | Clinic staff inbox |
| `/clinic` | Inbox for your first membership |

## Care routing

`GET /api/care/nearby?urgency=HOSPITAL_NOW&lat=28.61&lng=77.21`
