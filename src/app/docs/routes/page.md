---
title: Routes
nextjs:
  metadata:
    title: Routes
    description: The seven routes the package registers, their names, and how to change the prefix or middleware.
---

The package registers its own routes on boot. There is nothing to add to `routes/web.php`. {% .lead %}

---

## The route table

| Method | URI | Name | Description |
| ------ | --- | ---- | ----------- |
| `GET` | `/auth/magic-link` | `passwordless.magic-link.request` | Show email form |
| `POST` | `/auth/magic-link` | `passwordless.magic-link.send` | Send magic link email |
| `GET` | `/auth/magic-link/{token}` | `passwordless.magic-link.authenticate` | Authenticate via clicked link |
| `GET` | `/auth/code` | `passwordless.login-code.request` | Show email form |
| `POST` | `/auth/code` | `passwordless.login-code.send` | Send login code email |
| `GET` | `/auth/code/verify` | `passwordless.login-code.verify` | Show code entry form |
| `POST` | `/auth/code/verify` | `passwordless.login-code.authenticate` | Authenticate via submitted code |

Confirm what is actually registered in your app:

```bash
php artisan route:list --name=passwordless
```

---

## `type` decides which routes exist

Unlike most of this config, `type` is not merely informational — it gates registration:

```php
'type' => 'both', // 'magic_link' | 'login_code' | 'both'
```

| Value | Routes registered |
| ----- | ----------------- |
| `both` | All seven |
| `magic_link` | The three magic link routes only |
| `login_code` | The four login code routes only |

Routes for a disabled flow do not exist at all, so `route('passwordless.login-code.request')` will throw rather than quietly resolving. Guard your login page links if the value is environment-dependent:

```blade
@if (in_array(config('passwordless.type'), ['login_code', 'both']))
    <a href="{{ route('passwordless.login-code.request') }}">Sign in with a code</a>
@endif
```

---

## Changing the prefix

```php
'routes' => [
    'prefix'     => 'login',
    'middleware' => ['web'],
],
```

```ini
PASSWORDLESS_ROUTE_PREFIX=login
```

That moves everything to `/login/magic-link`, `/login/code`, and so on. Route **names** never change, so anything using `route('passwordless.…')` keeps working.

---

## Changing the middleware

The default is `['web']`, which is what supplies the session the flows depend on.

```php
'routes' => [
    'prefix'     => 'auth',
    'middleware' => ['web', 'throttle:60,1'],
],
```

This key has no `.env` equivalent — it is an array, so edit the published config file.

{% callout type="warning" title="Keep the session" %}
Both flows need a session: the code flow stashes the pending email between the send and verify steps, and both regenerate the session ID on login. Removing `web` (or whatever supplies `StartSession` in your app) will break them.

Also do not put `auth` on these routes. They are how a user becomes authenticated.
{% /callout %}

---

## The `passwordless.signed` middleware

`GET /auth/magic-link/{token}` is wrapped in the `passwordless.signed` alias, which validates the URL signature and expiry before the controller runs.

It is a general-purpose alias, not tied to this package's routes. Apply it to any route of your own that carries a signed, expiring token:

```php
Route::get('/invitations/{token}', AcceptInvitation::class)
    ->middleware('passwordless.signed');
```
