# NestifyTech — Enterprise Full-Stack E-Commerce & Multi-Vendor Ecosystem

NestifyTech is an enterprise-grade e-commerce application designed for high-performance catalog management, multi-store operations, and modern storefront experiences. It couples a secure Laravel 12 backend with an Inertia.js v2 and React 18 Single Page Application (SPA) frontend, Tailwind CSS v4 styling, dynamic module builder, rider logistics with delivery OTP, and automated Stripe/wallet refund lifecycles.

> **Live Production Store:** [nestifytech.laravel.cloud](https://nestifytech.laravel.cloud)

---

## 🛠️ Technology Stack Overview

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | PHP 8.2+, Laravel 12, Laravel Sanctum |
| **Frontend Framework** | Inertia.js 2, React 18, Vite 6, Tailwind CSS 4, Redux Toolkit |
| **Image Processing** | Intervention Image (automated thumbnail generation) |
| **UI Components** | React Icons (`react-icons/ri`), React Toastify, React Quill, Embla Carousel, Motion |
| **Database & Cache** | MySQL 8.0, Database/Redis Queues, Stateful Web Sessions |
| **Payment Gateways** | Stripe PaymentIntent API, Stripe Refunds API, COD, Internal Wallet Ledger |
| **Notifications & Mail** | SMTP Mailables with responsive Blade templates, WhatsApp OTP integration |
| **Code Quality** | PHPUnit 11 for automated tests, Laravel Pint for PHP formatting |

---

## 🚀 Key Architectural Modules & Features

### 1. Storefront & Customer Experience
- **Single Page Application (SPA):** Inertia.js 2 provides instant page transitions without full browser reloads.
- **Catalog & Variations:** Dynamic product variations (sizes, colors, attributes) with real-time stock inspection and price calculation.
- **Customer Account Portal:** Live order timeline, itemized receipts with download options, profile management, and activity logs.
- **Verified Product Reviews:** Verified purchasers can submit ratings and reviews directly from delivered order receipts without approval delays.

### 2. Commerce, Order Lifecycle & Cancellation Fee Engine
- **Flexible Order Cancellation:** Configurable cancellation fee percentage (`0% - 100%`) managed under Admin Site Settings (`/admin/setting/site`).
- **Automated Stripe Card Refund:** If a customer cancels a paid card order, the cancellation fee is deducted and the remainder is refunded directly to their card via the Stripe API.
- **Wallet Credit Engine:** Non-card paid orders automatically credit the refund amount to the customer's internal wallet for future purchases.
- **Automated Restocking:** Stock quantities are restored to inventory automatically upon order cancellation or return.
- **Fraud & Return Abuse Prevention:** Automatically detects and blocks user accounts with 3 or more repeated returns (`is_blocked` flag with reason).

### 3. Rider & Logistics Management System
- **Real-Time Rider GPS:** Tracks active delivery boy coordinates to monitor delivery routes.
- **Customer Delivery OTP:** Secure 6-digit OTP dispatched to customer's WhatsApp or Email; delivery cannot be finalized without customer OTP verification.
- **Office Cash Settlement Workflow:** Cash collected on delivery (COD) by riders is audited and handed over to the head office via a dedicated Office Settlement OTP verification process.
- **Rider Performance Analytics:** Calculates completion rate, average delivery turnaround time, and cash-in-hand balance.

### 4. Admin Panel & Dynamic Module Builder
- **Dynamic Module Builder:** Create any custom post type, taxonomy, or custom form in seconds without writing repetitive CRUD code.
- **Role-Based Access Control (RBAC):** Granular permission checks (`{module}-read`, `{module}-write`, `{module}-delete`).
- **Dynamic Theme Color Engine:** Live appearance preview and theme color switching applied instantly across the application.
- **System Settings:** Centralized JSON-backed settings for site configuration, payment gateway keys, SMTP credentials, and cancellation fees.

### 5. Automated Notification & Email Engine
- Responsive dark-themed HTML transactional emails for order placement, status changes, delivery OTP, and office cash settlements.
- Auto-reply contact inquiry handling and newsletter subscriber onboarding.

---

## Requirements

Install the following before starting development:

- PHP 8.2 or newer with the required Laravel extensions
- Composer
- Node.js (v18+) and npm
- MySQL or a compatible database
- A web server, or the PHP development server supplied by Artisan

On Windows, XAMPP can provide PHP and MySQL. Make sure the PHP executable used by the terminal is the same version used by Composer.

## Installation

From the project root:

```bash
composer install
npm install
copy .env.example .env
php artisan key:generate
```

Create the database named in `DB_DATABASE`, then run the migrations:

```bash
php artisan migrate
```

Create the public storage link if it does not already exist:

```bash
php artisan storage:link
```

For a local environment, confirm that `.env` contains the correct database connection and that `APP_URL` matches the address used in the browser. The default project configuration expects MySQL on `127.0.0.1:3306` with database `nestifytech`.

## Running Locally

The simplest development command starts the Laravel server, queue listener, and Vite together:

```bash
composer run dev
```

Alternatively, run each process separately:

```bash
php artisan serve
php artisan queue:listen --tries=1
npm run dev
```

Open the URL shown by `artisan serve`, normally `http://127.0.0.1:8000`.

Build the frontend assets for production or a build check:

```bash
npm run build
```

## Project Structure

```text
app/
	Console/Commands/       Custom Artisan commands
	Http/Controllers/       Web, admin, API, media, and commerce controllers
	Http/Middleware/        Authentication, permissions, and request middleware
	Http/Requests/          Form request validation
	Mail/                   Transactional mailables (Order, OTP, Status, Welcome)
	Models/                 Eloquent models and domain data access
	Providers/              Application service providers
	Services/               Application services such as WalletService & Importers
	Support/                Shared support helpers
	Traits/                 Reusable module behavior
bootstrap/                Application and route configuration
config/                   Laravel and application configuration
database/
	factories/              Model factories
	migrations/             Database schema history
	seeders/                Database seeders
public/
	assets/                 Public static assets
	data/                   Public data files used by the application
	storage/uploads/        Uploaded images and generated thumbnails
resources/
	css/                    Application and admin stylesheets
	js/                     React entry points, pages, layouts, components, and stores
	views/                  Blade shell views for Inertia and transactional emails
routes/
	web.php                 Browser and admin routes
	api.php                 API routes registered by bootstrap/app.php
storage/app/data/         Runtime JSON configuration and imported data
tests/                    Feature and unit tests
```

## Application Areas

### Public storefront

The public frontend is served from `/` and uses the frontend React pages and layouts. Product detail pages use `/post/{type}/{sku}/{id}`. The storefront includes navigation, search, product/category presentation, media, theme colors, reviews, cart interactions, and language-aware content.

### Admin panel

Authenticated and verified users access the admin panel under `/admin`. The dashboard is at `/admin`. Most catalog operations are handled by `ModuleController`, which resolves a module type to database, form, and view configuration.

Admin features include:

- Dashboard counts and charts
- Users and roles
- Posts and products
- Categories, brands, tags, and other taxonomies
- Attributes and attribute values
- Product variations
- Reviews
- Media uploads and thumbnails
- Site settings, color themes, languages, and translations
- Header, footer, page, and menu layout configuration
- Developer module builder
- AI-assisted field operations where configured

### Commerce

Cart and order endpoints are defined in `routes/api.php`. The current schema includes orders, order items, product variations, variation values, and related catalog metadata. Review creation and product review retrieval are also exposed through API routes.

## Configuration Model

The application uses both the database and JSON files:

- Environment variables in `.env` control framework and infrastructure settings.
- Database tables store users, roles, posts, taxonomies, menus, attributes, variations, reviews, orders, and media metadata.
- Runtime JSON configuration is stored in `storage/app/data` and includes settings, layout, languages, dashboard configuration, forms, and other module data.
- Public uploaded images are stored under `public/storage/uploads/image` and thumbnails under its `thumb` directory.

Do not commit secrets from `.env`. Back up `storage/app/data` and uploaded media when moving an environment, because they contain application-managed configuration and content.

### Runtime JSON files

The main files under `storage/app/data` are:

| Path | Purpose |
| --- | --- |
| `setting.json` | Site-wide settings and application options |
| `layout.json` | Header, footer, page, and layout configuration |
| `sidebar-menu.json` | Admin sidebar menu configuration |
| `dashboard.json` | Dashboard widget and chart configuration |
| `form.json` | Dynamic form definitions |
| `search_pages.json` | Searchable page configuration |
| `lang/` | Language and translation data |
| `schema/` | Module schemas for users, roles, posts, products, taxonomies, and reviews |

These files are written by the application and should be backed up with the database. Do not replace them with files from another environment without checking the configured modules and language data first.

## Routing

Routing is registered in `bootstrap/app.php`:

- `routes/web.php` contains public pages, admin pages, Inertia requests, image URLs, search, settings, and authenticated workflows.
- `routes/api.php` contains JSON endpoints for menus, languages, taxonomies, posts, settings, reviews, and cart/order operations. Laravel registers this file with the `/api` prefix in `bootstrap/app.php`.
- Authentication routes are loaded from `routes/auth.php`.

Useful route families include:

| Area | Prefix or URL | Purpose |
| --- | --- | --- |
| Public | `/` | Storefront home |
| Product | `/post/{type}/{sku}/{id}` | Product or post detail |
| Admin | `/admin` | Dashboard and administration |
| Modules | `/admin/module/{type}` | Generic module listing and forms |
| Posts | `/admin/post/{type}` | Post and product management |
| Taxonomies | `/admin/taxonomy/{type}` | Category, brand, tag, and taxonomy management |
| Layout | `/admin/layout` | Header, footer, page, and menu configuration |
| API | `/api/*` | JSON data and commerce endpoints |

Inspect the current route table with:

```bash
php artisan route:list
```

### API reference

All endpoints below are prefixed with `/api`:

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/taxonomy-options/{type}` | `GET` | Get taxonomy records or select options |
| `/menu-options` | `GET` | Get menu options and children |
| `/menu-locations` | `GET` | List configured menu locations |
| `/roles-options` | `GET` | List published roles |
| `/attribute-options` | `GET` | List attribute names |
| `/header-setting` | `GET` | Get header configuration |
| `/footer-setting` | `GET` | Get footer configuration |
| `/get_menu` | `GET` | Get navigation menu data |
| `/language` and `/language/{lang}` | `GET` | Get available or selected language data |
| `/get_taxonomies` | `GET` | Get taxonomies |
| `/get_posts` | `GET` | Get posts and catalog records |
| `/setting` | `GET` | Get public settings |
| `/reviews/product/{postId}` | `GET` | Get reviews for a product |
| `/reviews` | `POST` | Create a review |
| `/cart/stock` | `GET` | Check cart item stock |
| `/cart/order` | `POST` | Place an order |

Use `php artisan route:list --path=api` when adding or changing an endpoint. API requests that use the stateful web middleware may also require the normal session and CSRF setup.

## Permissions and Authentication

Admin routes require authenticated and verified users. Fine-grained access is enforced through the `permission` middleware and the module permission convention:

```text
{module}-read
{module}-write
{module}-delete
```

Examples include `role-read`, `attribute-write`, `review-read`, and `developer-write`. The generic module controller also checks permissions before reading, creating, editing, submitting, or deleting records.

When adding an admin feature:

1. Define or reuse the appropriate permission names.
2. Protect the route with the permission middleware.
3. Keep controller-level authorization in place for non-standard entry points.
4. Add frontend controls that match the server-side permission, but never rely on frontend visibility as authorization.

## Database Workflow

Review the migration history before changing a table. Apply schema changes with migrations rather than editing the database manually:

```bash
php artisan make:migration describe_the_change
php artisan migrate
php artisan migrate:status
```

For a disposable local database only, rebuild the schema with:

```bash
php artisan migrate:fresh --seed
```

This deletes all local database data. Never run it against a shared or production database.

## Testing and Quality Checks

Run the application test suite with:

```bash
composer test
```

Run a focused test file with:

```bash
php artisan test tests/Feature/ExampleTest.php
```

Format PHP files with Laravel Pint:

```bash
vendor/bin/pint
```

Validate the production frontend bundle:

```bash
npm run build
```

Before opening a pull request, check migrations, permissions, validation, upload paths, API response shape, and both desktop and mobile frontend behavior for changed features.

## Deployment Checklist

1. Provision PHP 8.2+, Composer, Node.js, MySQL, and a queue worker.
2. Set production values in `.env`, including `APP_KEY`, `APP_ENV=production`, `APP_DEBUG=false`, database credentials, mail settings, and the public `APP_URL`.
3. Install dependencies with `composer install --no-dev --optimize-autoloader` and `npm ci`.
4. Build assets with `npm run build`.
5. Run `php artisan migrate --force`.
6. Run `php artisan storage:link` when the public storage link is absent.
7. Cache configuration and routes after verifying environment values:

	 ```bash
	 php artisan config:cache
	 php artisan route:cache
	 php artisan view:cache
	 ```

8. Run a persistent queue worker for database-backed jobs:

	 ```bash
	 php artisan queue:work --tries=3
	 ```

9. Back up the database, `storage/app/data`, and uploaded media.
10. Verify login, permissions, storefront rendering, image URLs, API responses, cart/order creation, and queue processing.

## Troubleshooting

### Vite assets do not load

Run `npm install` and `npm run dev`. If the application is using stale cached configuration, run `php artisan optimize:clear` and restart Vite.

### Database connection fails

Confirm that MySQL is running, the database exists, and `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` match the local server. Then run `php artisan config:clear` before retrying.

### Uploaded images return 404

Confirm that the upload directories exist, the files are present, and the application is serving `public/storage`. Run `php artisan storage:link` if the symbolic link is missing, and inspect the media record and generated filename.

### Queue-backed work does not run

The default queue connection is database-backed. Run migrations and start `php artisan queue:listen --tries=1` locally, or configure a persistent queue worker in deployment.

### Permission denied in the admin panel

Confirm that the user is authenticated and verified, then check the role's stored permission names against the `{module}-{action}` convention. A hidden frontend button does not grant access; the route and controller checks must both pass.

## Development Notes

- Keep changes scoped to the owning controller, module configuration, page, or component.
- Preserve the existing Inertia page and prop contracts when changing backend responses.
- Treat JSON files under `storage/app/data` as application state, not disposable cache files.
- Use migrations for schema changes and validation before writing user-controlled data.
- Check both normal browser requests and JSON/AJAX requests when modifying shared admin handlers.
- Do not commit `.env`, credentials, generated logs, or environment-specific uploads.
