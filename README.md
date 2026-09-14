# Splitly

An expense-sharing app for iOS, Android, and the web, built with Expo SDK 57 and Supabase.

## Deploy the website to Vercel

1. Push this repository, including `vercel.json`, to your Git provider.
2. Import the repository into Vercel with the repository root as the Root Directory. The checked-in configuration selects Node.js 22, installs with `npm ci`, runs `npm run build`, and publishes `dist`. No build overrides are needed.
3. Add these environment variables to the Vercel project before deploying (include Preview if you use preview deployments):

   | Variable                        | Value                         |
   | ------------------------------- | ----------------------------- |
   | `EXPO_PUBLIC_SUPABASE_URL`      | Your Supabase project URL     |
   | `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase public anon key |

   Use the same Supabase project as the mobile app to share accounts and expenses. These public values are embedded at build time; redeploy after changing them. Never use a service-role key here. Without these variables, the website loads but account sign-in and shared expenses are unavailable.

4. Click **Deploy**. Vercel serves the website over HTTPS and rebuilds it on future pushes.
5. In Supabase **Authentication → URL Configuration**, set the Site URL to your production website URL and allow `https://YOUR-DOMAIN/update-password` as a Redirect URL. Add equivalent URLs for any preview domains where you want password reset to work. Keep your mobile redirect URLs if you also use the native app.

For a new Supabase project, apply all SQL files in `supabase/migrations` in filename order before using the app. If using the Supabase CLI, link the intended project and run `supabase db push`. Existing projects that already have these migrations need no database changes.

The web build uses a single-page application. Vercel routes direct visits and refreshes (including `/group/:id` and `/transaction/:id`) through the app while serving bundled assets normally. Authentication still controls access to account screens.

## Local development

Use Node.js 22.13 or newer within the 22.x release line.

```bash
npm ci
cp .env.example .env.local
# Fill in your Supabase public values in .env.local.
npm run web
```

To run on a device, use `npm run ios`, `npm run android`, or `npm start`.

To build and preview the production website:

```bash
npm run build
npm run preview
```

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

Deployment references: [Expo web publishing](https://docs.expo.dev/guides/publishing-websites/#vercel) and [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/).
