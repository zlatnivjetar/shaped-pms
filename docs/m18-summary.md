# Milestone 18 — Authentication & RBAC

## What was built

Better Auth authentication for the dashboard with role-based access control (RBAC). The dashboard was previously publicly accessible; M18 locks it behind a login page.

## Features

### Authentication
- **Login page** at `/login` — email/password sign-in with error display, redirects to `/dashboard` on success
- **Register page** at `/register` — create a new account (name, email, password ≥ 8 chars)
- **Sign out** button in the sidebar footer — clears session and redirects to `/login`
- **Better Auth API route** at `/api/auth/[...all]` — handles all auth operations (sign in, sign up, sign out, session)

### Route Protection
- **Dashboard layout** is now an async server component that calls `auth.api.getSession()` on every request
- Unauthenticated requests are redirected to `/login` via `redirect()`
- **`src/proxy.ts`** (Next.js 16 proxy convention) enforces RBAC at the edge — `front_desk` attempting to access restricted URLs is redirected to `/dashboard` before the page renders

### RBAC — Role-Based Navigation
Three roles defined: `owner`, `manager`, `front_desk`

| Nav item | owner | manager | front_desk |
|---|---|---|---|
| Dashboard | ✓ | ✓ | ✓ |
| Calendar | ✓ | ✓ | — |
| Reservations | ✓ | ✓ | ✓ |
| Guests | ✓ | ✓ | ✓ |
| Rates | ✓ | ✓ | — |
| Reviews | ✓ | ✓ | — |
| Settings | ✓ | ✓ | — |

### Sidebar Updates
- **User info** displayed in sidebar footer (name + email)
- **Sign out** button in sidebar footer
- Role-aware nav filtering — menu items not visible for a role are hidden

## Database Changes

Migration `0011_spooky_marvex.sql` added 4 new tables and 1 new enum:

| Table | Purpose |
|---|---|
| `user` | Better Auth users with `role` (owner/manager/front_desk) and `property_id` FK |
| `session` | Active sessions with expiry and token |
| `account` | OAuth/credential account links per user |
| `verification` | Email verification + magic link tokens |

New enum: `user_role` → `owner`, `manager`, `front_desk`

## New Files

| File | Purpose |
|---|---|
| `src/lib/auth.ts` | Better Auth server config — drizzle adapter, email+password enabled |
| `src/lib/auth-client.ts` | Better Auth client — `signIn`, `signUp`, `signOut`, `useSession` exports |
| `src/app/api/auth/[...all]/route.ts` | Better Auth Next.js handler |
| `src/app/(auth)/layout.tsx` | Centered layout for auth pages |
| `src/app/(auth)/login/page.tsx` | Email/password login form |
| `src/app/(auth)/register/page.tsx` | Account creation form |
| `src/proxy.ts` | Next.js 16 proxy — session guard + RBAC route enforcement for `front_desk` |

## Modified Files

| File | Change |
|---|---|
| `src/db/schema.ts` | Added `boolean` import; added `user`, `session`, `account`, `verification` tables; `userRoleEnum`; user/session/account relations; `User` + `Session` type exports |
| `src/app/(dashboard)/layout.tsx` | Now async server component — checks session, redirects to `/login` if unauthenticated, passes user info to `AppSidebar` |
| `src/components/dashboard/app-sidebar.tsx` | Accepts `userName`, `userEmail`, `userRole` props; role-filtered nav; sign-out button in footer |
| `src/lib/auth.ts` | Added `user.additionalFields` for `role` + `propertyId` — required for Better Auth to include role in session response |
| `src/lib/auth-client.ts` | Removed explicit `baseURL` — client uses current origin automatically (fixes production deployments where `NEXT_PUBLIC_APP_URL` is not set at build time) |

## Environment Variables

| Variable | Purpose |
|---|---|
| `BETTER_AUTH_SECRET` | 32-byte hex secret for session signing (set in .env.local) |
| `BETTER_AUTH_URL` | Base URL for auth (defaults to `NEXT_PUBLIC_APP_URL`) |
| `NEXT_PUBLIC_APP_URL` | Public app URL used by auth client |

Vercel deployment needs `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` set to the production URL.

## Gotchas / Lessons Learned

- **`auth-client.ts` must not set `baseURL`** — `NEXT_PUBLIC_*` vars are embedded at build time; if unset on Vercel, the client falls back to `http://localhost:3000` and all auth requests silently fail in production. Omitting `baseURL` lets Better Auth use the current origin.
- **Better Auth `additionalFields` is required for custom user columns** — without it, `session.user.role` is `undefined` and RBAC checks never fire. Custom columns on the `user` table must be declared in `user.additionalFields` in `auth.ts`.
- **Next.js 16 renamed `middleware.ts` → `proxy.ts`** and the exported function must be named `proxy` (not `middleware`).
- **Try/catch is required around `signIn`/`signUp` calls** — Better Auth client throws on network errors rather than returning `{ error }`, leaving `loading` stuck at `true` if unhandled.

## Acceptance Criteria

- [x] `/dashboard` and all sub-routes redirect to `/login` when unauthenticated
- [x] Login with email + password works
- [x] Register creates a new account and redirects to dashboard
- [x] Sign out clears session and redirects to `/login`
- [x] Sidebar shows logged-in user's name + email
- [x] Role-based nav filtering hides items based on user role
- [x] `front_desk` cannot access restricted routes directly (URL-level enforcement via proxy)
- [x] TypeScript strict mode — no type errors
- [x] Production build passes
