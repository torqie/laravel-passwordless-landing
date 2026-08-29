---
title: Config reference
nextjs:
  metadata:
    title: Config reference
    description: Every key in config/passwordless.php, its .env equivalent, and its default.
---

Everything lives in `config/passwordless.php`. Publish it with the [install wizard](/docs/installation) or `php artisan vendor:publish --tag="passwordless-config"`. {% .lead %}

---

## At a glance

| Key | `.env` | Default |
| --- | ------ | ------- |
| `type` | `PASSWORDLESS_TYPE` | `both` |
| `ttl` | `PASSWORDLESS_TTL` | `15` |
| `code.length` | `PASSWORDLESS_CODE_LENGTH` | `6` |
| `code.charset` | `PASSWORDLESS_CODE_CHARSET` | `0123456789` |
| `guard` | `PASSWORDLESS_GUARD` | `web` |
| `user_model` | `PASSWORDLESS_USER_MODEL` | `App\Models\User` |
| `remember` | `PASSWORDLESS_REMEMBER` | `false` |
| `rate_limits.send` | `PASSWORDLESS_RATE_LIMIT_SEND` | `5` |
| `rate_limits.verify` | `PASSWORDLESS_RATE_LIMIT_VERIFY` | `5` |
| `redirects.after_login` | `PASSWORDLESS_REDIRECT_AFTER_LOGIN` | `/dashboard` |
| `redirects.invalid_token` | `PASSWORDLESS_REDIRECT_INVALID` | `/login` |
| `routes.prefix` | `PASSWORDLESS_ROUTE_PREFIX` | `auth` |
| `routes.middleware` | — | `['web']` |
| `views.*` | — | `null` |
| `inertia` | `PASSWORDLESS_INERTIA` | `false` |
| `components.*` | — | `null` |
| `actions.*` | — | package defaults |

Keys with no `.env` column are arrays or class names — edit the published config file.

---

## `type`

Which flow(s) to register. This one is not merely informational: routes for a disabled flow are never registered.

```php
'type' => 'both', // 'magic_link' | 'login_code' | 'both'
```

See [Routes](/docs/routes#type-decides-which-routes-exist).

---

## `ttl`

How many minutes a magic link or login code stays valid after being issued. Shared by both flows, and passed to the email templates as `$expiresMins`.

```php
'ttl' => 15,
```

For the code flow it doubles as the decay window on the failed-attempt rate limiter.

---

## `code`

Settings specific to the login code flow.

```php
'code' => [
    'length'  => 6,            // Number of characters in the code
    'charset' => '0123456789', // Characters to draw from
],
```

Alphanumeric codes, with the easily-misread characters left out:

```ini
PASSWORDLESS_CODE_LENGTH=8
PASSWORDLESS_CODE_CHARSET=ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

---

## `guard`

The authentication guard the user is logged in on.

```php
'guard' => 'web',
```

---

## `user_model`

The authenticatable class looked up by email address.

```php
'user_model' => \App\Models\User::class,
```

```ini
PASSWORDLESS_USER_MODEL=App\Models\Member
```

The model needs the [`HasPasswordlessAuth`](/docs/installation#add-the-trait-to-your-user-model) trait and Laravel's `Notifiable`.

---

## `remember`

Whether to create a persistent "remember me" session on a successful passwordless login. Passed straight through as the second argument to `Auth::guard()->login()`.

```php
'remember' => false,
```

---

## `rate_limits`

```php
'rate_limits' => [
    'send'   => 5, // max send requests per IP + email, per minute
    'verify' => 5, // max failed code attempts per email, per TTL window
],
```

See [Security](/docs/security#rate-limiting) for what each one actually counts and what it does not cover.

---

## `redirects`

Where the user ends up.

```php
'redirects' => [
    'after_login'   => '/dashboard',
    'invalid_token' => '/login',
],
```

Both are paths handed to `redirect()->to()`, not route names.

---

## `routes`

Prefix and middleware for every route the package registers.

```php
'routes' => [
    'prefix'     => 'auth',
    'middleware' => ['web'],
],
```

See [Routes](/docs/routes).

---

## `views`

Override any built-in view. `null` uses the package default.

```php
'views' => [
    'magic_link_request' => null,  // GET /auth/magic-link
    'magic_link_sent'    => null,  // after POST /auth/magic-link
    'magic_link_email'   => null,  // email notification
    'login_code_request' => null,  // GET /auth/code
    'login_code_verify'  => null,  // GET /auth/code/verify
    'login_code_email'   => null,  // email notification
],
```

See [Blade views](/docs/views).

---

## `inertia` and `components`

```php
'inertia' => false,

'components' => [
    'magic_link_request' => null, // e.g. 'Auth/MagicLinkRequest'
    'magic_link_sent'    => null,
    'login_code_request' => null,
    'login_code_verify'  => null,
],
```

When `inertia` is `true`, `components` takes precedence over `views` for the four page views. The two email templates stay Blade either way. See [Inertia](/docs/inertia).

---

## `actions`

The five swappable pieces of the flows.

```php
'actions' => [
    'generate_magic_link'     => GenerateMagicLinkAction::class,
    'authenticate_magic_link' => AuthenticateViaMagicLinkAction::class,
    'generate_login_code'     => GenerateLoginCodeAction::class,
    'authenticate_login_code' => AuthenticateViaLoginCodeAction::class,
    'resolve_user'            => ResolveUserForSendAction::class,
],
```

| Key | Contract |
| --- | -------- |
| `generate_magic_link` | `GeneratesMagicLink` |
| `authenticate_magic_link` | `AuthenticatesViaMagicLink` |
| `generate_login_code` | `GeneratesLoginCode` |
| `authenticate_login_code` | `AuthenticatesViaLoginCode` |
| `resolve_user` | `ResolvesUserForSend` |

All contracts live in `Torqie\LaravelPasswordless\Contracts`. See [Swapping actions](/docs/custom-actions).
