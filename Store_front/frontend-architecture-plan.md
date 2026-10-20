# Frontend Architecture — StoreApp Vite React App

This document describes the *current* state of the customer-facing storefront (`Store_front`) so readers know what is built, how it is wired together, and what has been left incomplete. It was rewritten after inspecting the codebase against the earlier plan document and fixes applied during end-to-end verification (build passes clean).

---

## 1. Purpose & status

The storefront provides a product catalog, categories, shopping cart, checkout, order history/detail, profile editing, an admin section and an audit log viewer. All customer-facing data is loaded directly from the backend at **`http://localhost:5000`** by default.

Status: **implemented and running**. The production bundle builds clean (`tsc -b && vite build`), and both the Vite dev server (`:5173`) and the ASP.NET Core API (`:5000`) are listening on the current machine.

> Note: there is **no** unit test suite anywhere in this frontend. `npm run lint` exists in package.json but there is no eslint configuration file (`*.eslintrc`) and `eslint` is not listed as a dependency, so that script will fail until those tooling pieces are added back.

---

## 2. Tech stack & versions

| Concern | Choice | Version |
|---|---|---|
| Framework | React + TypeScript | react 18.3.1, typescript ~5.7 |
| Bundler | Vite | 6.0.11 (the running install reports 6.4.4) |
| Routing | React Router DOM | 7.1.5 (installed 7.18.4) |
| HTTP client | Axios | 1.7.9 |
| Forms/validation | Zod | 3.24 |
| Styling | Tailwind CSS | 3.4.17 |
| Icons | lucide-react | 0.468.0 *(installed, used nowhere — see §9)* |

Dev dependencies include `react-hook-form` and `@hookform/resolvers` as well — these are installed but are **not currently used**: validation is done either with HTML `required` attributes or with Zod schemas, not with hook-form. This is a small latent-dependency situation worth keeping in mind if form validation is migrated later.

---

## 3. Project layout

The app lives at the repository root (`E:\Randum_Projects\StoreApp\Store_front`) with source under `src`. TypeScript path aliases defined in `tsconfig.json` (`@/*`, `@api/*`, `@features/*`, `@shared/*`, `@app/*`) plus matching entries in `vite.config.ts` are the standard way to shorten imports everywhere.

```
src/
  main.tsx                 # entry point → App > RouterProvider
  App.tsx                  # adds index.css, wraps RouterProvider in StrictMode
  index.html               # root div, Inter font, dark variant classes on body
  index.css                # tailwind directives + base font (Inter)
  vite.config.ts           # proxy :5173 → :5000 /api, resolve alias, server port
  tailwind.config.js       # Material Design 3 color tokens, radius, spacing, type scale
  postcss.config.js
  shared/                  # cross-cutting UI
    components/{Button,Card}.tsx
    ui/{Header,Footer,ProtectedRoute,NotFoundPage}.tsx
    types/api.ts           # mirror of every backend response/request type
  api/
    apiClient.ts           # createApiClient + apiFetch + helpers
    api-endpoints.ts        # named constant map for every endpoint
  app/
    router.tsx             # createBrowserRouter with public/protected/admin layouts
    provider.tsx           # Provider wrapper around AuthProvider
  features/<feature>/
    <Service>.ts
    use<Hook>.ts
    *.tsx                  # page components
```

### 3.1 Feature responsibilities (real components)

| Feature | Files | What it does |
|---|---|---|
| `auth` | `LoginForm.tsx`, `RegisterForm.tsx`, `useAuth.tsx` | login/register pages + context provider; `AuthContextType` exposes `login`, `register`, `logout`, `refreshAccessToken`, `isAdmin` |
| `products` | `HomePage.tsx`, `ProductsPage.tsx`, `ProductDetailPage.tsx`, `ProductCard.tsx`, `useProducts.ts`, `productService.ts` | home card grid, search + filter + pagination UI, detail page with guest "sign in to add" overlay, product card add-to-cart button |
| `categories` | `CategoriesPage.tsx`, `CategoryProductsPage.tsx`, `categoryService.ts` | category listing (public); `/categories/:id` redirects to `/products?category=...`; uses `?search=` param too |
| `cart` | `CartPage.tsx`, `cartService.ts` | full cart view: quantity change, remove, clear (with confirm), recalculates nothing locally — backend recomputes |
| `orders` | `OrdersPage.tsx`, `OrderDetailPage.tsx`, `useOrders.ts`, `ordersService.ts` | list + cancel flow; cancel only when `Pending` or `Confirmed` |
| `checkout` | `CheckoutPage.tsx` | shipping form, payment method radios, order summary with computed subtotal/tax/shipping, post-order thank-you page |
| `users` | `ProfilePage.tsx`, `userService.ts`, `useUser.ts` | edit name/phone; profile saved via `PUT /api/users/me` |
| `admin` | `AdminDashboardPage.tsx`, `AdminProductsPage.tsx`, `AdminCategoriesPage.tsx`, `AdminUsersPage.tsx`, `AdminDeliveriesPage.tsx`, `AdminAuditPage.tsx`, `useAdminDashboard.ts` | dashboard stats (Promise.allSettled over 5 endpoints), read-only product/category tables, user delete + role assignment, delivery toggles/deletes, audit filters |
| `audit` | `auditService.ts` | admin log viewer — filters by entity or user id |

Shared UI: `Button` (`variant`: filled/filled-tonal/outlined/text/elevated, `size`: small/medium/large, built-in spinner when `loading`), `Card` (`children`, `className`, optional `elevated`), `Header` (nav links gated by auth; admin link for Admin role), `Footer`, route guards (`ProtectedRoute` / `PublicRoute` / `AdminOnlyRoute`).

### 3.2 Public catalog vs private sections

Routes are split in `router.tsx`:

- Public: `/`, `/login`, `/register`, `/products`, `/categories`, `*`
- Protected (`ProtectedRoute`, redirect to `/login` while loading): `/cart`, `/checkout`, `/orders`, `/orders/:id`, `/profile`
- Admin (`AdminOnlyRoute`, requires `Admin` role): `/admin` and sub-routes: `/admin/products`, `/admin/categories`, `/admin/users`, `/admin/deliveries`, `/admin/audit`

`Header` renders either authenticated links (`Products · Categories · Cart · Orders · Profile`, Admin link for admins, Sign Out) or Sign In/Sign Up buttons. Guests clicking into protected routes get redirected to `/login`.

---

## 4. API client

Everything goes through `src/api/apiClient.ts`. There are **no axios interceptors**: token injection is performed per call by passing the raw token string explicitly (`token` parameter of each service call), which keeps refresh logic centralized in one place rather than scattered.

Key points:

- `createApiClient()` builds a plain Axios instance with `baseURL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000"` and JSON content type, `withCredentials: true`, 30s timeout. Because the base URL is absolute, requests hit the API directly at `:5000` — **the Vite proxy configured for `/api` is effectively unused by the current client** (it would matter only if `VITE_API_BASE_URL` were set to a relative value like `/api`).
- `apiFetch<T>(client, method, endpoint, data?, token?)` calls axios, then unwraps the backend envelope only if the payload contains a top-level `success: false` check; otherwise returns the raw `data` as `T`. The useful current behavior is: on failure it throws an `Error` whose message is built by `extractErrorMessage`, which joins `errors[]`, the `errors:{field:[...]}` model-validation shape, and falls back to `message`/`title`.
- Convenience wrappers `api.get/post/put/patch/delete` wrap `apiFetch`.

All endpoint constants live in `api-endpoints.ts` (e.g. `ORDERS.MY_ORDERS = "/api/orders/my-orders"`, `DELIVERIES.TOGGLE_ACTIVE(id)`).

### 4.1 Token storage & refresh

Tokens are persisted in `localStorage` under `storeapp_access_token`, `storeapp_refresh_token`, and `storeapp_user`. On initial mount `AuthProvider` reads them and calls `refreshAccessToken()`, which posts `{ accessToken, refreshToken }` to `POST /api/auth/refresh` and replaces both tokens — but **this is the only auto-refresh path**. A bearer token that expired mid-session causes a `401` with the axios default error text, and `apiFetch` simply rethrows it. There is no automatic retry-and-refresh on `AxiosError[401]`. Reloading the page (or reinitializing) is required for silent renewal. Keep this in mind if you rely on live renewal during a long checkout session.

`isAdmin` in `AuthContextType` is a boolean derived from `isInRole("Admin")` (the `Super_viser` role exists on the seeded accounts but is **not** granted any authorization policy, so it behaves identically to `Customer` at the API level).

---

## 5. Styling approach

Tailwind CSS utility classes compose everything; `tailwind.config.js` defines the full Material Design 3 color token set (primary / on-primary / secondary family / tertiary family / error family + container variants, surface containers, outline tokens), the MD3 type scale (`display-*, headline-*, title-*, body-*, label-*` + their large variants), `spacing` tokens and rounded radii (`sm 4px … full 9999px`). Custom component styles come from utility class names plus `index.css` base font declaration only.

One notable gap: `darkMode: "class"` is configured, and many of the files contain `dark:` variants, but **nothing in the codebase adds or removes a `dark` class**, and `index.html`'s `<body>` lacks `class="dark ..."`. Therefore the `dark:` variants currently never activate even though they are present in the markup. If dark mode is intended, a `<link rel="stylesheet">` or a runtime toggle needs wiring; without it the appearance stays light across devices, which can differ significantly from what an author expects from "MD3 dark theme".

The `tailwind.config.js` ordering note inside the config file warns against reordering tokens alphabetically for consistency; following that convention is optional and left to maintainers.

---

## 6. Validation

Two distinct layers are used:

1. **Zod schemas** in `LoginForm` (`LoginSchema`: email + non-empty password) and `RegisterForm` (`RegisterSchema`: name/email rules mirroring the backend validators — min lengths, email regex, password complexity, `confirmPassword` equality, optional `phoneNumber ≤ 20 chars`). Zod `parse` runs on submit and surfaces messages via the error state.
2. **Backend-agnostic `required` attributes and HTML constraints** elsewhere (dates parsed on client only where needed; no form library generates field-specific error lists elsewhere).

Server response errors come back through `extractErrorMessage`, which flattens both `{ success, message, errors: [...] }` envelopes and model-validation objects (`{ errors: { fieldName: [messages] } }`).

Because `AddFluentValidationAutoValidation()` is commented out in the backend, FluentValidation validators exist as services but are **not** auto-applied to controller actions — ASP.NET Identity's own `password` options still enforce registration strength, but manually-specified complex validators would need explicit wiring to run.

---

## 7. Build, dev & run instructions

Requirements: Node (current machine: **v24.20.0**), npm (**11.19.0**). The backend needs .NET SDK **8.0+** (current machine has 10.0.401).

From the `Store_front` folder:

```bash
npm install
npm run dev        # Vite, port 5173, proxies /api → http://localhost:5000
npm run build      # tsc -b && vite build → dist/
npm run preview    # served dist/ locally
```

From the `Storeapp` backend solution (root `Storeapp.slnx`):

```bash
dotnet restore
dotnet run --project Api/Api.csproj    # defaults to http://localhost:5000, https://localhost:5001
```

Environment variable `VITE_API_BASE_URL` can override the axios base URL (useful for staging against a different origin). No env files currently ship; no CI pipeline runs here yet.

End-to-end verification steps that succeeded:

- The admin login flow works end to end (login, products, cart, order creation, status transitions, audit logs): navigation completed and Bearer injection on every subsequent request worked. The seeded admin account's email and password live in `Infrastructure/Seed/DatabaseSeeder.cs` — they are deliberately not reproduced here.
- Product filtering/sorting/pagination, category filter redirect, cart quantity updates, order list, and cancel-order 409 rejection all behave as expected.
- Status transitions were verified against the documented state machine (`Pending→Confirmed/Cancelled`, `Confirmed→Processing/Cancelled`, `Processing→Shipped/Cancelled`, `Shipped→Delivered`, `Delivered→Refunded`); edge cases such as `Shipped→Cancel` return `BadRequest`.
- Rate limiting: repeated 5 failed registrations triggered `429`; logged responses include a JSON `{success:false, message:"Too many requests..."}` and a `Retry-After` header.
- Empty-cart, forgot-cart, create-order, orders-empty states render correctly.
- HTTPS is disabled by default (`HttpsRedirectEnabled: false`); Swagger only runs in Development.
- Login works as public route; favorites/wishlists are intentionally out of scope for this version.

---

## 8. Known gaps / not yet verified

These items are **documented here, not fixed**:

1. **No frontend tests.** `features/**` and `shared/` are componentized but untested.
2. **`npm run lint` is non-functional** — no eslint config exists and `eslint` is not a declared dependency.
3. **No automatic access-token refresh on `401`** during a session; silent renewal only happens at boot.
4. **Dark-mode `dark:` variants never activate** (no `dark` class toggled; body has none).
5. **Unused dependencies** installed in lockfile: `lucide-react`, `react-hook-form`, `@hookform/resolvers`.
6. **Admin create/edit forms are not wired up.** `productService`/`categoryService` expose `createProduct/updateProduct/deleteProduct/toggleProductActive`, `createCategory/updateCategory/deleteCategory`, `createDelivery/updateDelivery/updateDeliveryLocation` — the admin UI only displays lists and toggles/deletes. The `AdminCategoriesPage` "Manage Categories" link sends guests to the **public** `/categories` page instead of an admin editor, so the management UI effectively cannot reach create/edit operations even though the endpoints exist.
7. **Guest cart interactions** (the `ProductCard` sign-in prompt when not authed, and "having trouble? Contact support." copy) cover only the obvious cases.
8. Home-page feature cards lead guests into protected routes; with no explicit `PublicRoute` boundary on catalog pages, there is no enforced "browse-only then sign in" gating.

Data fetched by each feature below reflects what the code actually does, not what may have been planned.

---

## 9. Service → feature mapping (what each feature actually calls)

| Feature | Backend services called |
|---|---|
| Products | `GET /api/products`, `GET /api/products/:id` |
| Categories | `GET /api/categories`, `GET /api/categories/roots`, `GET /api/categories/:id` |
| Cart | `GET/POST /api/cart`, `PUT/DELETE /api/cart/items`, `DELETE /api/cart` |
| Orders | `POST/GET /api/orders`, `GET /api/orders/:id`, `PATCH /api/orders/:id/status`, `POST /api/orders/:id/cancel` |
| Checkout | `GET /api/cart`, `POST /api/orders` |
| Users | `GET/PUT /api/users/me` |
| Auth | `POST /api/auth/register|login|refresh|logout` |
| Admin dashboard | aggregate of products, categories, users, orders, deliveries counts + low-stock/pending-delivery flags |
| Audit | `GET /api/audit`, `GET /api/audit/user/{userId}`, `GET /api/audit/entity/{entityName}` |
| Deliveries (admin) | filtered `GET`, toggle active/availability, delete |
| Users (admin) | list, delete, `POST /:id/roles/{role}` |
