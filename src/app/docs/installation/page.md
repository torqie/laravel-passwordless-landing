---
title: Installation
nextjs:
  metadata:
    title: Installation
    description: Install laravel-passwordless with Composer, run the interactive wizard, and add the trait to your User model.
---

Install the package with Composer, run the wizard, add one trait. The whole thing takes about a minute. {% .lead %}

---

## Requirements

| Dependency | Version |
| ---------- | -------------------- |
| PHP        | 8.3+                 |
| Laravel    | 12.61.1+ or 13.12.0+ |

The PHP floor comes from the framework versions, not from the package's own code.

---

## Install with Composer

```bash
composer require torqie/laravel-passwordless
```

The service provider is auto-discovered — there is nothing to register.

---

## Run the install wizard

```bash
php artisan passwordless:install
```

The wizard walks through every setup step and writes your answers to `.env`:

```
-- Step 1: Configuration
   Publish config file? (config/passwordless.php) [yes]

-- Step 2: Migrations
   Publish migrations? [yes]
   Run migrations now? [yes]

-- Step 3: Authentication Flows
   Which flow(s)? Both / Magic links only / Login codes only

-- Step 4: Frontend Framework
   Detected: vue (from package.json). Use it? [yes]
   (or choose: Blade / Vue / React / Svelte)

-- Step 5: View Setup
   Blade   -> optionally publish views for customisation
   Inertia -> publish component stubs + writes PASSWORDLESS_INERTIA=true

-- Step 6: Session Options
   Enable remember me for persistent login sessions? [no]
```

Re-running the wizard will not clobber files you have already published unless you ask it to:

```bash
php artisan passwordless:install --force
```

---

## Add the trait to your User model

This is the one step the wizard cannot do for you.

```php
namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Torqie\LaravelPasswordless\Traits\HasPasswordlessAuth;

class User extends Authenticatable
{
    use HasPasswordlessAuth;

    // ...
}
```

The trait adds the `passwordlessTokens` morph relation and a few helpers. See [the trait helpers](/docs/fluent-api#trait-helpers) for what it gives you.

{% callout type="warning" title="Your model must be notifiable" %}
Both flows deliver via `$user->notify(...)`, so your model needs Laravel's `Notifiable` trait. `Illuminate\Foundation\Auth\User` includes it, so a default Laravel `App\Models\User` is already covered. A custom authenticatable is not.
{% /callout %}

---

## Point at a different user model

If your authenticatable is not `App\Models\User`:

```php
// config/passwordless.php
'user_model' => \App\Models\Member::class,
```

Or from the environment:

```ini
PASSWORDLESS_USER_MODEL=App\Models\Member
```

---

## Verify it worked

Routes register themselves, so they should already be listed:

```bash
php artisan route:list --name=passwordless
```

You should see seven routes under the `/auth` prefix — or a subset, if you limited `type` to a single flow in step 3. Visit `/auth/magic-link` and you will get the package's built-in request form.

---

## Manual installation

If you would rather run each step yourself:

```bash
# Publish config
php artisan vendor:publish --tag="passwordless-config"

# Publish and run migrations
php artisan vendor:publish --tag="passwordless-migrations"
php artisan migrate

# Publish Blade views (optional)
php artisan vendor:publish --tag="laravel-passwordless-views"

# Scaffold Inertia components for a specific framework (optional)
php artisan passwordless:install-inertia --framework=vue
```

### About the published migrations

Publishing gives you three files:

| Migration | Required? |
| --------- | --------- |
| `create_passwordless_table` | Yes. Creates the token table. |
| `add_salt_to_passwordless_table` | Yes. Adds the nullable `salt` column that login codes are hashed with. |
| `make_password_nullable_on_users_table` | Only if your `users` table has a `password` column you want to make optional. |

The last one is guarded by `Schema::hasColumn`, so on an app that never had passwords it is a no-op you can safely delete before migrating.

---

## Next steps

- [How it works](/docs/how-it-works) — what happens between the form and the session
- [Configuration](/docs/configuration) — every key and its default
- [Blade views](/docs/views) — make the built-in screens look like your app
