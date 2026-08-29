---
title: Getting started
---

Passwordless authentication for Laravel via magic links and login codes. Install it, add one trait, and your users sign in by clicking a link or typing a six-digit code. {% .lead %}

{% quick-links %}

{% quick-link title="Installation" icon="installation" href="/docs/installation" description="Composer, the install wizard, and the manual path if you'd rather run each step yourself." /%}

{% quick-link title="How it works" icon="lightbulb" href="/docs/how-it-works" description="What happens between the send form and the authenticated session, and what lands in the database." /%}

{% quick-link title="Configuration" icon="theming" href="/docs/configuration" description="Every key in config/passwordless.php, its .env equivalent, and its default." /%}

{% quick-link title="Swapping actions" icon="plugins" href="/docs/custom-actions" description="Five contracts cover token generation, authentication, and user lookup. Replace any of them." /%}

{% /quick-links %}

---

## Quick start

Three commands and one trait.

### Install the package

```bash
composer require torqie/laravel-passwordless
php artisan passwordless:install
```

The install wizard publishes the config, publishes and runs the migrations, asks which flows you want, detects your frontend framework, and writes the answers to your `.env`. [Full walkthrough →](/docs/installation)

### Add the trait to your User model

```php
use Illuminate\Foundation\Auth\User as Authenticatable;
use Torqie\LaravelPasswordless\Traits\HasPasswordlessAuth;

class User extends Authenticatable
{
    use HasPasswordlessAuth;
}
```

That is the whole setup. Routes register themselves under `/auth`, and the package ships working Blade views and email templates for both flows.

### Link to a flow from your login page

```blade
<a href="{{ route('passwordless.magic-link.request') }}">Sign in with a magic link</a>
<a href="{{ route('passwordless.login-code.request') }}">Sign in with a code</a>
```

{% callout title="Already have password auth?" %}
You can run both. Nothing in this package touches your existing guard, login controller, or `password` column — it adds routes alongside them and logs the user in through the same guard. The published `make_password_nullable_on_users_table` migration is only relevant if you want to go passwordless-first and drop passwords entirely.
{% /callout %}

---

## The two flows

Use one, the other, or both at the same time.

### Magic links

The user submits their email and receives a signed, time-limited URL. Clicking it authenticates them and redirects to `redirects.after_login`. The token is 64 random characters, hashed in the database, and single-use.

Best when the user reads mail on the same device they are signing in on. [Read more →](/docs/magic-links)

### Login codes

The user submits their email and receives a short code — six numeric digits by default. They type it on a verify form. The code is salted, hashed, and deleted the moment it is used.

Best when the sign-in device is not the mail device: a TV app, a kiosk, a phone verifying a desktop session. [Read more →](/docs/login-codes)

---

## What you get out of the box

- **Routes and controllers** for both flows, mounted under a configurable prefix. [Reference →](/docs/routes)
- **Blade views and email templates**, publishable and overridable one at a time. [Read more →](/docs/views)
- **Inertia support** with generated Vue, React, and Svelte stubs. [Read more →](/docs/inertia)
- **Rate limiting** on both sending and verifying, plus silent handling of unknown email addresses so the forms do not leak which addresses have accounts. [Read more →](/docs/security)
- **Three events** to hook your own logic onto. [Read more →](/docs/events)
- **Five swappable action contracts**, selected by config key — no service provider bindings needed. [Read more →](/docs/custom-actions)

---

## Requirements

| Dependency | Version |
| ---------- | ------------------------ |
| PHP        | 8.3+                     |
| Laravel    | 12.61.1+ or 13.12.0+     |

---

## Getting help

### Submit an issue

Bugs, questions, and feature requests all belong on the [issue tracker](https://github.com/torqie/laravel-passwordless/issues). For anything security-sensitive, please use the repository's security policy rather than a public issue.

### Contributing

Pull requests are welcome. The package ships a full Pest suite — run `composer test` before opening one, and see [CONTRIBUTING.md](https://github.com/torqie/laravel-passwordless/blob/main/CONTRIBUTING.md) for the details.
