# Score Checker Clone

React/Vite clone of the supplied Score Checker screens with Clerk Google OAuth.

## Run

```bash
npm install
npm run dev -- --port 5173
```

Open `http://localhost:5173/view_score`.

## Clerk Setup

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Set:

```bash
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
```

In Clerk, enable Google as a social connection and allow these URLs while developing:

- Origin: `http://localhost:5173`
- OAuth callback route used by this app: `/sso-callback`
- Post-login route: `/course_wise`
- Post-logout route: `/view_score`

The app also has a keyless local preview mode so the UI can be checked before Clerk keys are added.

## Deploy

Build command:

```bash
npm run build
```

Publish directory:

```bash
dist
```

Custom domain:

```text
score-checker-379619600asia-south1run.app
```

For Clerk production login, add these allowed origins/redirects in the Clerk dashboard:

- `https://score-checker-379619600asia-south1run.app`
- `https://score-checker-379619600asia-south1run.app/sso-callback`
- `https://score-checker-379619600asia-south1run.app/course_wise`
- `https://score-checker-379619600asia-south1run.app/view_score`

If deploying on Vercel, point the apex domain to Vercel's DNS target shown in the Vercel dashboard. If deploying on Netlify, point the domain to Netlify's DNS target shown in the Netlify dashboard.
