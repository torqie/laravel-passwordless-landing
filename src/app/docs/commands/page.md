---
title: Artisan commands
nextjs:
  metadata:
    title: Artisan commands
    description: The three commands the package registers — install, install-inertia, and purge.
---

Three commands: one to set the package up, one to scaffold Inertia components, one to keep the token table tidy. {% .lead %}

---

## `passwordless:install`

The setup wizard. Covers everything in one interactive session — publishing config, publishing and running migrations, choosing your flows, scaffolding views or Inertia components, and writing the resulting `.env` keys.

```bash
php artisan passwordless:install
```

| Option | Effect |
| ------ | ------ |
| `--force` | Overwrite files that have already been published |

It will not clobber existing files without `--force`, so re-running it to change an answer is safe. The one thing it cannot do for you is add the trait to your User model.

Full walkthrough on the [Installation](/docs/installation#run-the-install-wizard) page.

---

## `passwordless:install-inertia`

Adds Inertia component stubs to an app that is already installed. Reads `package.json` to detect the framework, or takes it explicitly.

```bash
# Auto-detect from package.json
php artisan passwordless:install-inertia

# Explicit framework
php artisan passwordless:install-inertia --framework=vue
php artisan passwordless:install-inertia --framework=react
php artisan passwordless:install-inertia --framework=svelte

# Overwrite existing stubs
php artisan passwordless:install-inertia --force
```

| Option | Effect |
| ------ | ------ |
| `--framework=` | `vue`, `react`, or `svelte`. Auto-detected if omitted. |
| `--force` | Overwrite stubs already published |

Published files, Vue shown:

```
resources/js/Pages/Auth/MagicLinkRequest.vue
resources/js/Pages/Auth/MagicLinkSent.vue
resources/js/Pages/Auth/LoginCodeRequest.vue
resources/js/Pages/Auth/LoginCodeVerify.vue
```

After writing them it prints the config snippet to paste into `config/passwordless.php`. See [Inertia](/docs/inertia).

---

## `passwordless:purge`

Remove spent tokens from `passwordless_tokens`.

```bash
# Purge everything expired or used (default)
php artisan passwordless:purge

# Only expired tokens
php artisan passwordless:purge --expired

# Only used tokens
php artisan passwordless:purge --used

# Keep a retention window — only touch rows at least 7 days old
php artisan passwordless:purge --days=7
```

| Option | Effect |
| ------ | ------ |
| `--expired` | Only rows past `expires_at` |
| `--used` | Only rows with a `used_at` |
| `--days=` | Additionally require `created_at` to be at least this many days ago |

With neither `--expired` nor `--used` (or with both), the default is "expired **or** used". `--days` narrows whichever set you selected; it does not select on its own.

The command reports what it removed:

```
Purged 128 passwordless token(s).
```

### Schedule it

```php
// routes/console.php
use Illuminate\Support\Facades\Schedule;

Schedule::command('passwordless:purge')->daily();
```

Or keep a week of history rather than deleting everything spent:

```php
Schedule::command('passwordless:purge --days=7')->daily();
```

{% callout title="This is hygiene, not correctness" %}
It used to matter more. Consumed login codes now delete themselves, and generating a code clears that user's spent ones, so the table no longer grows unbounded whether or not you schedule this.

What is left to purge is mostly expired-but-never-used rows and consumed magic links, which are retained on purpose — a `used_at` set seconds after `created_at`, with no matching login, is how you spot a mail scanner burning links before your users click them. Keeping a `--days=7` window preserves that signal while still bounding the table.
{% /callout %}
