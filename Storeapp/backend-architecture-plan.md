# Backend Analysis — StoreApp API

Reference for the ASP.NET Core 8 backend in `E:\Randum_Projects\StoreApp\Storeapp`. It describes the API as it exists today: the layer layout, the request pipeline, the data model, the endpoints, and the behaviours that are stubbed, unused or inconsistent. It is written to be read alongside the frontend document (`frontend-architecture-plan.md`) — the two use the same route names, DTO field names and port numbers.

> Secrets are intentionally omitted. The JWT signing key and the seeded account passwords live in `Api/appsettings.json` and `Infrastructure/Seed/DatabaseSeeder.cs`; neither is reproduced here.

---

## 1. Solution layout

`Storeapp.slnx` contains three projects with a strict one-way dependency chain:

```
Api ──► Business ──► Infrastructure
```

| Project | Target | Responsibility | Key packages |
|---|---|---|---|
| `Api/Api.csproj` | net8.0 | Controllers, middleware, filters, extensions, `Program.cs` composition root | JwtBearer 8.0.0, FluentValidation.AspNetCore 11.3.0, EF.Design 8.0.0, HealthChecks.EntityFrameworkCore 8.0.0, Serilog.AspNetCore 8.0.0, Swashbuckle 6.5.0 |
| `Business/Business.csproj` | net8.0 | Services, DTOs, FluentValidation validators, AutoMapper profiles, exceptions, interfaces | AutoMapper.Extensions.Microsoft.DependencyInjection 12.0.1, BCrypt.Net-Next 4.0.3, FluentValidation.DependencyInjectionExtensions 11.8.1, JwtBearer 8.0.0 |
| `Infrastructure/Infrastructure.csproj` | net8.0 | EF Core context, entities, configurations, repositories, Unit of Work, seeder, migrations | Identity.EntityFrameworkCore 8.0.0, EF.SqlServer 8.0.0, EF.Tools 8.0.0 |

`Api` references `Business`; `Business` references `Infrastructure`. `Infrastructure` never references upward, so the data layer knows nothing about HTTP.

---

## 2. Composition root and request pipeline

`Api/Program.cs` is the only place services are wired. Registration order:

`AddDatabaseAndIdentity` → `AddJwtAuthentication` → `AddAuthorizationPolicies` → `AddRateLimiterPolicies` → `AddApplicationServices` → `AddAutoMapperAndValidation` → `AddCorsPolicy` → `AddHttpsConfiguration` → `AddSwaggerDocumentation` → `AddApplicationHealthChecks` → `AddMemoryCache`, plus `builder.AddApplicationLogging()`.

HTTP pipeline order (this ordering matters — CORS runs before auth so a rejected preflight never hits the auth handler, and rate limiting runs after auth so per-user partitions can see the user id):

```
ExceptionHandlingMiddleware
  → RequestLoggingMiddleware
  → Swagger (Development only)
  → UseHttpsRedirection()   ← only when HttpsRedirectEnabled is true
  → UseDefaultFiles
  → UseRouting
  → UseCors("FrontendPolicy")
  → UseRateLimiter
  → UseAuthentication
  → UseAuthorization
  → MapControllers
  → MapHealthChecks("/health")
```

`HttpsRedirectEnabled` is `false` in `appsettings.json`, so a plain-HTTP request to `http://localhost:5000` is served directly. This was previously inverted, which made every request answer `307` and broke the whole client — it is fixed now and verified.

At startup the app runs `context.Database.MigrateAsync()` and then `DatabaseSeeder.SeedAsync(services)`, so a fresh clone comes up with a migrated and populated database without a separate command.

### 2.1 Middleware and filters

- **`ExceptionHandlingMiddleware`** translates domain exceptions into HTTP responses and writes an `X-Trace-Id` header:

  | Exception | Status |
  |---|---|
  | `NotFoundException` | 404 |
  | `BadRequestException` | 400 (includes `.Errors` when present) |
  | `UnauthorizedException` | 401 |
  | `ForbiddenException` | 403 |
  | `OperationCanceledException` | 408 |
  | `DbUpdateException` | 409 |
  | anything else | 500 |

  5xx bodies are replaced with the generic `"An unexpected error occurred. Please try again later."` so internals are not leaked. The body shape is `ApiResponseDto<object>` in camelCase: `{ success, message, data, errors }`.

- **`RequestLoggingMiddleware`** writes one Information-level line per request: `HTTP {Method} {Path} => {StatusCode} in {Elapsed}ms`.

- **`ValidationFilter`** is registered as a global filter (`options.Filters.Add<ValidationFilter>()`). It converts an invalid `ModelState` into `400` with `ApiResponseDto<object>.Fail("Validation failed.", errors)`.

- **JWT challenge/forbidden handlers** are custom (`OnChallenge` / `OnForbidden` in `ServiceExtensions.AddJwtAuthentication`) so 401/403 bodies are JSON rather than the default empty body.

### 2.2 CORS

The policy name is `FrontendPolicy` (`Api/Extensions/ServiceExtensions.cs`). Origins are the union of:

- everything in the `AllowedOrigins` array in `Api/appsettings.json` — currently `http://localhost:5173` and `http://127.0.0.1:5173`
- the two Vite dev origins hard-coded in `AddCorsPolicy` — `http://localhost:5173` and `http://127.0.0.1:5173`

with `AllowAnyHeader()`, `AllowAnyMethod()` and `AllowCredentials()`. The previous published list of origins (`5500`, `4200`, `3000`) is **stale** — those are not allowed today. The frontend dev server runs on `5173`, which is why the current set works.

### 2.3 Rate limiting

Defined in `Api/Extensions/RateLimiterExtensions.cs`:

| Policy | Limit | Partition |
|---|---|---|
| `AuthLimiter` | 5 per minute | client IP |
| `UserLimiter` | 60 per minute for an authenticated user, 5 per minute for anonymous | user id, falling back to an "anonymous" bucket |

`OnRejected` logs a Warning and returns `429` with a JSON body and a `Retry-After` header. **Only `UserLimiter` is actually applied**, and only on `POST /api/auth/register`, `/login` and `/refresh`. `AuthLimiter` is defined but never referenced by any controller — the stricter per-IP limit that was probably intended for the auth endpoints is inert.

### 2.4 Swagger and health

- Swagger UI at `/swagger`, doc title `E-Commerce Backend API v1`, JWT Bearer scheme configured, `RoutePrefix = "swagger"`. Available **in Development only**.
- `GET /health` runs `AddDbContextCheck<ApplicationDbContext>(name: "database", failureStatus: Unhealthy, tags: ["database","ready"])` and answers 200 when the database is reachable. Verified: `http://localhost:5000/health` → 200.

---

## 3. Authentication & authorization

### 3.1 Identity and JWT

ASP.NET Core Identity is used for users, roles and password hashing (BCrypt via `BCrypt.Net-Next` for the extra hashing in the service layer). `ApplicationDbContext` derives from `IdentityDbContext<ApplicationUser, ApplicationRole, string>` with string keys.

| Setting | Value |
|---|---|
| Issuer | `StoreAppAPI` |
| Audience | `StoreAppClient` |
| Access token lifetime | 15 minutes |
| Refresh token lifetime | 7 days |
| Signing algorithm | HMAC-SHA256 |
| Clock skew | `TimeSpan.Zero` (tokens expire exactly on time) |
| `RequireHttpsMetadata` | `!IsDevelopment()` |

The signing secret is read from `JwtSettings:SecretKey` in `Api/appsettings.json` and must be at least 32 characters — the startup path throws if it is shorter. The value itself is not reproduced in this document.

Roles seeded by the seeder: `Admin`, `Super_viser`, `Customer`. **`Super_viser` grants nothing** — it is not attached to any policy, so a user holding only that role behaves exactly like a `Customer` at the API level. It is only meaningful as a place to hang additional permissions later.

Access-token claims: `ClaimTypes.NameIdentifier`, `Email`, `Name`, `Jti`, `Sub`, `Iat`, plus one `ClaimTypes.Role` claim per role. `GetUserIdFromExpiredToken` validates the signature only (it must work on an expired token) and explicitly rejects any algorithm other than HS256.

### 3.2 Policies

Defined in `Api/Extensions/ServiceExtensions.cs`:

| Policy | Requirement | Used by |
|---|---|---|
| `AdminOnly` | role `Admin` | all `api/audit` endpoints |
| `CustomerOnly` | role `Customer` | *(defined; not currently attached to a controller)* |
| `CanManageProducts` | role `Admin` | product write endpoints |
| `CanManageCategories` | role `Admin` | category write endpoints |
| `CanManageOrders` | role `Admin` | `PATCH /api/orders/{id}/status` |
| `CanViewAllOrders` | role `Admin` | `GET /api/orders` |
| `CanManageUsers` | role `Admin` | user list/get/delete/role-assign |
| `CanManageDeliveries` | role `Admin` | every `api/deliveries` endpoint |

### 3.3 Ownership rules

The point of the current-user service is that private data is scoped by the caller's identity, never by a body field:

- **Cart** — `CartService` reads `_currentUser.UserId`; the cart is created on demand if missing. There is no way to address another user's cart.
- **Profile** — `GET/PUT /api/users/me` always use `_currentUser.UserId`.
- **Orders** — `OrderService.GetOrderByIdAsync` throws `ForbiddenException` when `order.UserId != userId` and the caller is not an admin. `CancelOrderAsync` applies the same ownership check, allows only `Pending` or `Confirmed`, and restores stock for the cancelled items.
- **My orders** — `GET /api/orders/my-orders` filters by the caller's user id.

### 3.4 Auth flow

1. `POST /api/auth/login` → `{ user, accessToken, refreshToken }`.
2. The client stores both tokens (`storeapp_access_token`, `storeapp_refresh_token` in `localStorage`) and sends `Authorization: Bearer <accessToken>` on every protected call.
3. `POST /api/auth/refresh` with `{ accessToken, refreshToken }` → new pair; the old refresh token is revoked and rotated (`ReplacedByToken` is recorded).
4. `POST /api/auth/logout` revokes **all** of the user's refresh tokens.

`AuthService.RefreshTokenAsync` performs eight explicit checks before rotating: both tokens present, access token parses, refresh token exists, not revoked, not expired, belongs to the same user, and the user is not soft-deleted. Login and register failures return a deliberately generic `"Invalid email or password❌."` / `"Email is already registered."` so the endpoint does not disclose whether an address exists.

---

## 4. Data model

### 4.1 Entities

`BaseEntity` supplies `Id`, `CreatedAt`, `UpdatedAt`, `IsDeleted`.

| Entity | Notable fields |
|---|---|
| `Product` | Name, Description, SKU, Price, DiscountPrice?, StockQuantity, IsActive, CategoryId |
| `Category` | Name, Description, ImageUrl, ParentCategoryId (self-referencing) |
| `ProductImage` | (image url / ordering) |
| `Cart` | UserId (one-to-one with the user) |
| `CartItem` | CartId, ProductId, Quantity, UnitPrice, `TotalPrice` (computed) |
| `Order` | OrderNumber, UserId, Status, SubTotal, ShippingCost, TaxAmount, TotalAmount, ShippingAddress, Notes, ShippedAt, DeliveredAt |
| `OrderItem` | OrderId, ProductId, Quantity, UnitPrice, `TotalPrice` (computed) |
| `Payment` | OrderId, TransactionId, Amount, Status, Method, PaymentIntentId, PaidAt, FailureReason |
| `RefreshToken` | Token, UserId, ExpiresAt, IsRevoked, RevokedAt, ReplacedByToken, CreatedByIp, RevokedByIp |
| `AuditLog` | UserId, Action, EntityName, EntityId, IpAddress |
| `Delivery` | FullName, PhoneNumber, Email, VehicleType, VehicleNumber, IsAvailable, IsActive, Rating, TotalDeliveries, CurrentLatitude, CurrentLongitude, Notes |
| `ApplicationUser` | (Identity) + FirstName, LastName, ProfileImageUrl, CreatedAt, UpdatedAt, IsDeleted |
| `ApplicationRole` | (Identity) + Description, CreatedAt |
| `SeedHistory` | LastMigration, SeededAt |

`Order.Status`, `Payment.Status` and `Payment.Method` are stored as integers (`HasConversion<int>()`) and surfaced as strings by the mapping layer. `PaymentStatus` = Pending 0, Completed 1, Failed 2, Refunded 3. `PaymentMethod` = CreditCard 0, PayPal 1, Stripe 2, Paymob 3, CashOnDelivery 4.

`CartItem.TotalPrice` and `OrderItem.TotalPrice` are computed properties and are explicitly `builder.Ignore(...)`d in EF — they are never columns.

### 4.2 Soft delete

`BaseEntity.IsDeleted` is the soft-delete flag. Global query filters are applied in `ApplicationDbContext` for `Product`, `Category` and `Order`, and in the entity configurations for `ApplicationUser` and `Delivery`. Filtered-out rows are invisible to normal queries but remain in the table, which is why `UserService.DeleteUserAsync` also rewrites the email to `deleted_{id}@deleted.local` and locks the account (`LockoutEnabled` with `LockoutEnd = DateTimeOffset.MaxValue`) — to free the unique-email index and to stop the account from logging in.

### 4.3 EF configuration highlights

Table names are explicit: `Users`, `Products`, `Categories`, `ProductImages`, `Carts`, `CartItems`, `Orders`, `OrderItems`, `Payments`, `RefreshTokens`, `AuditLogs`, `Deliveries`, `SeedHistories`.

Unique indexes: `Carts.UserId`, `CartItems (CartId, ProductId)`, `Products.SKU`, `Orders.OrderNumber`, `Payments.TransactionId`, `Payments.OrderId`, `RefreshTokens.Token`, `Deliveries.PhoneNumber`, and a filtered unique index on `Deliveries.Email`.

Delete behaviour: `Cart → User` cascade; `Order → User`, `OrderItem → Product`, `CartItem → Product` and `Category → ParentCategory` all `Restrict`.

### 4.4 Migrations and seeding

Three migrations exist in `Infrastructure/Migrations/`:

| Migration | Contents |
|---|---|
| `20260924144736_firstMaigraiton` | the initial model (identity, catalog, cart, orders, payments, tokens, audit) |
| `20261009100339_AddDeliveryTable` | the `Deliveries` table and `Delivery` entity |
| `20261009114114_AddSeedHistory` | the `SeedHistories` table used by the seeder |

`DatabaseSeeder.SeedAsync` compares `context.Database.GetAppliedMigrations().LastOrDefault()` with the row in `SeedHistories`. When a new migration has been applied the seeder **clears and re-seeds** the database; otherwise it does nothing. So a migration is what triggers a data refresh — restarting the app alone will not re-seed.

Seed content: the three roles, one admin account, 24 customer accounts (each with a cart), 20 categories, 100 products (5 per category, `SKU-1000` upwards, two placeholder images each, a 40 % chance of an 80 % discount price, stock between 5 and 200), 30 orders spread across all statuses, and a payment row for every order that is not `Pending` or `Cancelled`. The seeded account credentials are defined in the seeder source and are not printed here.

---

## 5. Services, data access and transactions

### 5.1 Repositories and Unit of Work

`IUnitOfWork` exposes the repositories used by the business layer (`Category`, `Products`, `Carts`, `Orders`, `RefreshTokens`, `AuditLogs`, `Delivery`), a generic `Repository<TEntity>()` accessor, `SaveChangesAsync()` and `ExecuteInTransactionAsync<T>(Func<Task<T>>)`. Repositories are concrete EF-backed implementations (`OrderRepository`, `ProductRepository`, …) registered as scoped.

`OrderRepository` adds the query shapes the service layer needs: `GetWithItemsAsync`, `GetWithItemsAndPaymentAsync` (items + payment + user), `GetByOrderNumberAsync`, `GetByUserIdAsync` (newest first, `AsNoTracking`), `GetAllWithItemsAsync`, `GetByStatusAsync`.

`ProductRepository.GetFilteredAsync` hard-filters `p.IsActive`, matches `SearchTerm` against name, description and SKU case-insensitively, applies the category / price / stock filters, and sorts by `price_asc`, `price_desc`, `name`/`name_asc`, `name_desc`, `oldest`, `newest` (default: newest) before paging.

### 5.2 Transactions and the retrying execution strategy

The connection is registered with `EnableRetryOnFailure(3, 10s, null)`, which makes EF wrap every operation in a `SqlServerRetryingExecutionStrategy`. That strategy **does not support user-initiated transactions** — a bare `BeginTransaction()` throws. `UnitOfWork.ExecuteInTransactionAsync` solves this by creating the execution strategy and running the entire delegate inside `strategy.ExecuteAsync(...)`, which is the only supported way to combine retry with an explicit transaction.

`OrderService.CreateOrderAsync` is the one place that needs it, and it does the whole order placement in a single transaction:

1. validate that the cart has items and that each product is active and in stock (insufficient stock → `BadRequestException`);
2. decrement `Product.StockQuantity`;
3. compute `SubTotal = Σ quantity × unit price`, `TaxAmount = Round(SubTotal × 0.14, 2)`, `TotalAmount = SubTotal + 25 + TaxAmount` — the same constants the frontend mirrors in `CheckoutPage.tsx` (`SHIPPING_COST = 25`, `TAX_RATE = 0.14`);
4. create the `Order` and a `Payment` row (`Status = Pending`, `TransactionId = "COD-{OrderNumber}"` for cash on delivery);
5. remove the ordered lines from the cart.

`OrderService.ValidateStatusTransition` implements the order state machine:

```
Pending    → Confirmed | Cancelled
Confirmed  → Processing | Cancelled
Processing → Shipped | Cancelled
Shipped    → Delivered
Delivered  → Refunded
Cancelled, Refunded → terminal
```

An invalid transition returns `BadRequest`.

### 5.3 Caching

`IMemoryCache` is used by `ProductService` (5 minutes) and `DeliveryService` (5 minutes) and by `CategoryService` (10 minutes). The intent is to spare the database on hot read paths.

Two cache defects are worth knowing about:

- `ProductService` caches the filtered list under `products:filter:...` and a single product under `products:{id}`, but `CreateAsync`, `UpdateAsync` and `DeleteAsync` only remove the `products:{id}` key. **The filtered list is never invalidated**, so a newly created product can stay invisible in the catalog until the five-minute window expires.
- `CategoryService` reads the root categories under the key `"catigories:Root"` (a misspelling) but invalidates `"categories:root"` and `"categories:all"`. **The root-category cache is never invalidated** for the same reason.

### 5.4 Audit trail

`AuditService.LogAsync` writes an `AuditLog` row and calls `SaveChangesAsync()` itself, so the entry is persisted even when the caller has already flushed its own changes. (This was a fix: without it, audit rows were never written and the admin audit list was always empty.)

`AuditHelper.LogAsync` — the helper used by the product and category services — **returns early unless `ICurrentUserService.IsAdmin`**. As a result the audit log only records administrator actions; customer-facing actions (placing an order, editing a profile) are not captured, even though `OrderService` writes an audit entry directly.

Two smaller issues in the same area:

- `ProductService.UpdateAsync` and `ProductService.DeleteAsync` each call `_auditHelper.LogAsync` **twice**, so a single product update produces two audit rows.
- `ProductService.ToggleActiveAsync` logs the action string `"TooggleAction"` (typo).

---

## 6. Validation — what is actually enforced

This is worth reading carefully, because the intent and the runtime behaviour differ.

- Five FluentValidation validators exist in `Business/Validators/`: `AddToCartRequestValidator`, `CreateOrderRequestValidator`, `LoginRequestValidator`, `ProductCreateRequestValidator`, `RegisterRequestValidator`. They are registered with `AddValidatorsFromAssembly(...)`, but the line that wires them into the MVC pipeline — `services.AddFluentValidationAutoValidation();` — is **commented out** in `ServiceExtensions`. No controller injects an `IValidator<T>` either, so **these validators never run**.
- Most request DTOs carry **no DataAnnotations**. The exceptions are the delivery DTOs: `DeliveryCreateRequestDto`, `DeliveryUpdateRequestDto` and `UpdateLocationRequestDto` use `[Required]`, `[MaxLength]`, `[Phone]`, `[EmailAddress]` and `[Range(-90, 90)]` / `[Range(-180, 180)]`. Those are the only DTO-level validations that MVC actually enforces (and they surface through `ValidationFilter`).
- `RegisterRequestDto` and `CreateOrderRequestDto` have no attributes; `RegisterRequestDto` does have a `ConfirmPassword` property, which the service compares against `Password` and rejects with `"Passwords do not match."` if they differ. The `register` endpoint requires `confirmPassword` in the body — omitting it produces a validation error.
- ASP.NET Identity's own password options still apply to registration: minimum length 8, requires digit, non-alphanumeric, upper and lower case; lockout after 5 attempts for 15 minutes; unique email required.

So: the API accepts more than the validator files suggest. The `ValidationFilter` still catches whatever DataAnnotations do exist, but the FluentValidation rules are documentation, not enforcement.

---

## 7. Endpoint inventory

### Auth — `api/auth`

| Method & route | Access | Notes |
|---|---|---|
| `POST /api/auth/register` | Anonymous, `UserLimiter` | `RegisterRequestDto`: FirstName, LastName, Email, Password, ConfirmPassword, PhoneNumber? |
| `POST /api/auth/login` | Anonymous, `UserLimiter` | `LoginRequestDto`: Email, Password → `AuthResponseDto` (user, access token, refresh token) |
| `POST /api/auth/refresh` | Anonymous, `UserLimiter` | `RefreshTokenRequestDto`: AccessToken, RefreshToken → revokes the old pair, issues a new one |
| `POST /api/auth/logout` | Authorized | revokes all of the user's refresh tokens |

### Products — `api/products`

| Method & route | Access | Notes |
|---|---|---|
| `GET /api/products` | Anonymous | `PagedResultDto<ProductResponseDto>`; query = `ProductFilterRequestDto` (SearchTerm, CategoryId?, MinPrice?, MaxPrice?, InStock?, SortBy, PageNumber = 1, PageSize = 10) |
| `GET /api/products/{id}` | Anonymous | `ProductResponseDto` |
| `POST /api/products` | `CanManageProducts` | `ProductCreateRequestDto`: Name, Description?, SKU, Price, DiscountPrice?, StockQuantity, CategoryId, Images[] |
| `PUT /api/products/{id}` | `CanManageProducts` | `ProductUpdateRequestDto`: Name, Description?, Price, DiscountPrice?, StockQuantity, CategoryId, IsActive |
| `PATCH /api/products/{id}/toggle-active` | `CanManageProducts` | flips `IsActive` |
| `DELETE /api/products/{id}` | `CanManageProducts` | soft delete (`IsDeleted = true`, `IsActive = false`) |

`ProductService` clamps `pageNumber ≥ 1` and `pageSize` to 1–100 before querying, and rejects a duplicate SKU on create.

### Categories — `api/categories`

| Method & route | Access | Notes |
|---|---|---|
| `GET /api/categories` | Anonymous | all categories |
| `GET /api/categories/roots` | Anonymous | root categories only |
| `GET /api/categories/{id}` | Anonymous | one category |
| `POST /api/categories` | `CanManageCategories` | `CategoryCreateRequestDto`: Name, Description?, ImageUrl?, ParentCategoryId? |
| `PUT /api/categories/{id}` | `CanManageCategories` | `CategoryUpdateRequestDto` |
| `DELETE /api/categories/{id}` | `CanManageCategories` | refused when the category still has products or sub-categories, then soft-deleted |

Create and update validate that the parent category exists, prevent a category from being its own parent, and enforce a unique name under the same parent.

### Cart — `api/cart` (class-level `[Authorize]`)

| Method & route | Notes |
|---|---|
| `GET /api/cart` | `CartResponseDto` (Items, SubTotal, TotalItems, CreatedAt) for the caller's cart |
| `POST /api/cart/items` | `AddToCartRequestDto`: ProductId, Quantity (default 1) |
| `PUT /api/cart/items` | `UpdateCartItemRequestDto`: CartItemId, Quantity |
| `DELETE /api/cart/items/{id}` | removes one line |
| `DELETE /api/cart` | clears the cart |

`CartService.AddToCartAsync` rejects inactive or out-of-stock products, enforces that the total requested quantity does not exceed the available stock, merges the quantity when the product is already in the cart, and prices the line at `DiscountPrice ?? Price`.

### Orders — `api/orders` (class-level `[Authorize]`)

| Method & route | Access | Notes |
|---|---|---|
| `POST /api/orders` | Any authenticated user | `CreateOrderRequestDto`: ShippingAddress, Notes?, PaymentMethod (default `CashOnDelivery`); runs in a transaction, see §5.2 |
| `GET /api/orders/my-orders` | Any authenticated user | the caller's own orders |
| `GET /api/orders/{id}` | Owner or admin | non-owner non-admin → 403 |
| `GET /api/orders` | `CanViewAllOrders` | all orders with items |
| `PATCH /api/orders/{id}/status` | `CanManageOrders` | `UpdateOrderStatusRequestDto`: Status; validated against the state machine |
| `POST /api/orders/{id}/cancel` | Owner | only from `Pending`/`Confirmed`; restores stock |

### Users — `api/users` (class-level `[Authorize]`)

| Method & route | Access | Notes |
|---|---|---|
| `GET /api/users/me` | Any authenticated user | own profile |
| `PUT /api/users/me` | Any authenticated user | `UpdateProfileRequestDto`: FirstName, LastName, PhoneNumber?, ProfileImageUrl? |
| `GET /api/users` | `CanManageUsers` | all non-deleted users, with roles |
| `GET /api/users/{id}` | `CanManageUsers` | one user |
| `DELETE /api/users/{id}` | `CanManageUsers` | soft delete + email rewrite + account lockout |
| `POST /api/users/{id}/roles/{role}` | `CanManageUsers` | assigns a role |

### Deliveries — `api/deliveries` (class-level `[Authorize(Policy = "CanManageDeliveries")]`)

| Method & route | Notes |
|---|---|
| `GET /api/deliveries` | `PagedResultDto<DeliveryResponseDto>`; query = `DeliveryFilterRequestDto` (SearchTerm, IsAvailable?, IsActive?, VehicleType?, MinRating?, SortBy, PageNumber = 1, PageSize = 10) |
| `GET /api/deliveries/{id}` | one delivery |
| `POST /api/deliveries` | `DeliveryCreateRequestDto` — the only DTO family with DataAnnotations |
| `PUT /api/deliveries/{id}` | `DeliveryUpdateRequestDto` |
| `DELETE /api/deliveries/{id}` | removes the delivery |
| `PATCH /api/deliveries/{id}/toggle-active` | flips `IsActive` |
| `PATCH /api/deliveries/{id}/toggle-availability` | flips `IsAvailable` |
| `PATCH /api/deliveries/{id}/location` | `UpdateLocationRequestDto`: Latitude, Longitude (range-checked) |

### Audit — `api/audit` (class-level `[Authorize(Policy = "AdminOnly")]`)

| Method & route | Notes |
|---|---|
| `GET /api/audit` | all log entries |
| `GET /api/audit/user/{userId}` | entries for one user |
| `GET /api/audit/entity/{entityName}` | entries for one entity, optional `entityId` query parameter |

### Health

| Method & route | Notes |
|---|---|
| `GET /health` | database health check; 200 when the database is reachable |

---

## 8. Response shapes and DTO mapping

Two envelope types exist in `Business/DTOs/Common/`:

- `ApiResponseDto<T>` — `{ success, message, data, errors }`. Used by the middleware, the validation filter and the auth error handlers.
- `PagedResultDto<T>` — `{ items, pageNumber, pageSize, totalCount, totalPages, hasPrevious, hasNext }`, where `TotalPages`, `HasPrevious` and `HasNext` are computed properties.

**Controllers return raw payloads, not the envelope.** A `GET /api/products` response is a `PagedResultDto<ProductResponseDto>` at the top level, not `{ success, data: {...} }`. The frontend client accounts for this: `apiFetch` unwraps the envelope only when the payload actually carries a `success` property, and otherwise hands the raw payload straight through.

AutoMapper (`Business/Mappings/MappingProfile.cs`) supplies the read-side projections:

- `Product → ProductResponseDto` adds `CategoryName` and the image list.
- `Category → CategoryResponseDto` adds `ProductCount`, `ParentCategoryName` and `SubCategories`.
- `Cart → CartResponseDto` computes `SubTotal = Σ quantity × price` and `TotalItems = Σ quantity`.
- `CartItem → CartItemResponseDto` adds `ProductName`, `ProductImageUrl` (primary image), `TotalPrice` and `AvailableStock`.
- `Order → OrderResponseDto` exposes `Status` as a string and `CustomerName` ("First Last") / `CustomerEmail`.
- `ApplicationUser → UserProfileResponseDto` — `Roles` is deliberately ignored by the mapper and filled in afterwards by `UserService` from `UserManager`.
- `AuditLog → AuditLogResponseDto`.

JSON is camelCased globally (`JsonNamingPolicy.CamelCase` in `Program.cs`).

---

## 9. Payment reality

`PaymentService` is a **mock**: it waits 500 ms, generates a `TXN-{GUID:N}` transaction id and always returns `Success = true` with the message `"Payment processed successfully (mock)."`. `RefundPaymentAsync` is mocked the same way. The service is registered in DI but **never injected anywhere** — no controller or other service calls it.

What actually happens at checkout: `OrderService.CreateOrderAsync` writes a `Payment` row with `Status = Pending` and `TransactionId = "COD-{OrderNumber}"` for cash on delivery, and nothing ever advances it to `Completed`. There is no gateway, no callback and no reconciliation job. The frontend reflects this honestly — `CheckoutPage` shows Cash on Delivery as the only selectable method and renders Credit Card and PayPal as disabled with "no payment gateway is configured".

---

## 10. Running the backend

Prerequisite: SQL Server LocalDB with the `StoreAppDb` database (the connection string lives in `Api/appsettings.json` and uses a trusted connection — no credentials are stored in the repository).

```bash
cd E:\Randum_Projects\StoreApp\Storeapp
dotnet restore
dotnet run --project Api/Api.csproj
```

- HTTP: `http://localhost:5000` — HTTPS: `https://localhost:5001` (Kestrel endpoints in `appsettings.json`).
- `dotnet ef migrations add <Name> --project Infrastructure` then `dotnet ef database update --project Infrastructure` for schema changes. The app also migrates on startup, so a plain `dotnet run` is usually enough locally.
- Swagger UI: `http://localhost:5000/swagger` (Development only).
- Health: `http://localhost:5000/health`.
- Log level default is `Information`; `Microsoft.AspNetCore` is `Warning` and `Microsoft.EntityFrameworkCore.Database.Command` is `Warning`, so SQL is not echoed by default. Serilog writes to the console.

---

## 11. Limitations, bugs and unverified areas

Recorded rather than fixed, because this document is documentation-only:

1. **FluentValidation never executes** — `AddFluentValidationAutoValidation()` is commented out, so five validator classes have no effect and most DTOs are effectively unvalidated.
2. **`AuthLimiter` is never applied.** Only `UserLimiter` guards register/login/refresh; the 5-per-minute per-IP limit exists only in code.
3. **`PaymentService` is a mock and is never called.** Checkout produces a `Pending` payment row and nothing more.
4. **Audit capture is admin-only.** `AuditHelper.LogAsync` returns early for non-admins, so customer actions are not logged.
5. **Duplicate audit rows** on product update and delete (`AuditHelper.LogAsync` is called twice in each method).
6. **The product filter cache is never invalidated** on create/update/delete — new or changed products can be missing from the catalog for up to five minutes.
7. **The category root cache key is misspelled** (`"catigories:Root"` vs the invalidated `"categories:root"`), so it is never cleared.
8. **`Super_viser` grants no permissions** — it is seeded but attached to no policy.
9. **The admin UI cannot create or edit products, categories or deliveries.** The API and the service layer support it, but the frontend only offers list, toggle, delete and role assignment. The "Manage Categories" button in the admin area links to the *public* categories page.
10. **No automated tests anywhere** in the backend — no unit, integration or API test project exists.
11. **`CustomerOnly` policy is defined but unused.**
12. **Product `DeleteAsync` writes two audit entries** and `ToggleActiveAsync` logs the action as `"TooggleAction"`.

### Verified during this pass

- `http://localhost:5000/health` → 200.
- `npm run build` in `Store_front` → clean (`tsc -b` passes, Vite emits the production bundle).
- The order status machine rejects invalid transitions with 400; order cancellation is rejected with 409 when the order is not in a cancellable state.
- Rate limiting returns 429 with a `Retry-After` header once the anonymous bucket is exhausted.
- Ownership checks fire: fetching or cancelling another user's order returns 403.

### Not verified

- Behaviour under a real SQL Server instance (all testing used LocalDB).
- The five FluentValidation validators, the `AuthLimiter` policy, the `Super_viser` role path and `PaymentService` — none of them are reachable from the current code, so they could not be exercised.
- Refresh-token rotation across multiple devices, and concurrent-refresh races.
- Performance behaviour of the caching layer under load; the cache defects above were found by reading the code, not by profiling.
- Anything in the frontend's dark theme, since the `dark` class is never applied and the variants never render.
