# SparkedBy API

Simple API service for the SparkedBy landing page, handling waitlist email collection.

## Setup

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Create a `.env` file based on the `.env.example` template:
```bash
cp .env.example .env
```

3. Fill in the Supabase credentials in the `.env` file.

4. Create a 'waitlist' table in your Supabase database with the following schema:
   - id: uuid (primary key)
   - email: text (unique)
   - created_at: timestamp with time zone

## Development

Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Production

Build and start the production server:
```bash
npm run build && npm start
# or
yarn build && yarn start
```

## Endpoints

- POST `/api/waitlist` - Add an email to the waitlist
  - Body: `{ "email": "user@example.com" }`
  - Response: `{ "success": true, "message": "Successfully added to waitlist" }`

- GET `/api/health` - Health check endpoint
  - Response: `{ "status": "ok" }`
