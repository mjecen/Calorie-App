# Calorie Tracker

Mobile-first React + Vite + Tailwind CSS app for calorie and protein tracking.

## Run

```bash
npm install
npm run dev
```

## Supabase

The app supports Supabase for meals and settings. If Supabase env vars are not configured, it falls back to local browser storage.

1. Create a Supabase project.
2. Open the Supabase SQL editor and run `supabase/schema.sql`.
3. Copy `.env.example` to `.env`.
4. Fill in:

```bash
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

5. Restart the dev server.

Photo previews are browser-local only. They are not uploaded to Supabase.

## OpenAI Image Estimates

The Add/Edit Meal form can estimate calories and protein from the selected photo preview.

1. Add `OPENAI_API_KEY` to `.env`.
2. Optionally set `OPENAI_MODEL`.
3. Restart the dev server.

```bash
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4.1-mini
```

The key is used only by the local Vite server endpoint at `/api/estimate-calories`; it is not exposed through `VITE_` browser variables. Estimates are approximate and should be reviewed before saving.

The estimator returns this structured JSON shape:

```json
{
  "mealName": "",
  "description": "",
  "estimatedCalories": 0,
  "estimatedProtein": 0,
  "confidence": "low",
  "assumptions": [],
  "itemsDetected": []
}
```

The app fills the form with those values, but it never saves an AI estimate automatically.

## Deploy To Vercel

This app is configured for Vercel with:

- `vercel.json` for Vite build settings
- `api/estimate-calories.js` for the production OpenAI serverless route
- `OPENAI_API_KEY` as a server-side environment variable

### GitHub

1. Create a new GitHub repository.
2. Commit and push this project.
3. Do not commit `.env`; it is ignored by `.gitignore`.

### Vercel

1. Open Vercel and choose Add New Project.
2. Import the GitHub repository.
3. Keep the framework preset as Vite.
4. Confirm:
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables before deploying:
   - `OPENAI_API_KEY`
   - Optional: `OPENAI_MODEL`
   - Optional Supabase vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
6. Deploy.

### Secure OpenAI Key Setup

In Vercel, add `OPENAI_API_KEY` under Project Settings > Environment Variables.
Select the environments where it should apply, usually Production and Preview.

Do not prefix it with `VITE_`. Vite exposes `VITE_` variables to the browser, and the OpenAI key must stay server-side only.
