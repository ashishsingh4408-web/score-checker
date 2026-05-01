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
- Post-logout route: `/`

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

For Clerk production login, add the exact deployed domain you are using to Clerk's allowed origins and redirects. For example, if the Vercel URL is `https://score-checker-divdi7vgt-ashishsingh4408-webs-projects.vercel.app`, add:

- `https://score-checker-divdi7vgt-ashishsingh4408-webs-projects.vercel.app`
- `https://score-checker-divdi7vgt-ashishsingh4408-webs-projects.vercel.app/sso-callback`
- `https://score-checker-divdi7vgt-ashishsingh4408-webs-projects.vercel.app/course_wise`

If you share a Vercel preview/deployment URL with others, turn off Vercel Authentication for that URL or promote the deployment to an unprotected production domain. Otherwise Vercel will show its own "Authentication Required" page before the app and Clerk login can load.

If deploying on Vercel with a custom domain, point the apex domain to Vercel's DNS target shown in the Vercel dashboard. If deploying on Netlify, point the domain to Netlify's DNS target shown in the Netlify dashboard.
