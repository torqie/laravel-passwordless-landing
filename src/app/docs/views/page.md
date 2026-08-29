---
title: Blade views
nextjs:
  metadata:
    title: Blade views
    description: Override the built-in screens and email templates one at a time, or publish them all and edit in place.
---

The package ships working Blade views for both flows and both emails. They exist so the package works the moment you install it — they are not meant to be the final look of your app. {% .lead %}

---

## Two ways to change them

### Point the config at your own view

Each key takes a view name. `null` means "use the package default".

```php
// config/passwordless.php
'views' => [
    'magic_link_request' => null,  // GET /auth/magic-link
    'magic_link_sent'    => null,  // after POST /auth/magic-link
    'magic_link_email'   => null,  // email notification
    'login_code_request' => null,  // GET /auth/code
    'login_code_verify'  => null,  // GET /auth/code/verify
    'login_code_email'   => null,  // email notification
],
```

For example, to keep everything but replace the magic link email:

```php
'views' => [
    'magic_link_email' => 'emails.auth.magic-link',
],
```

This is the better option when you want your own views in their natural place in `resources/views`, under your own layout.

### Publish and edit in place

```bash
php artisan vendor:publish --tag="laravel-passwordless-views"
```

Everything lands in `resources/views/vendor/laravel-passwordless/` and takes precedence over the package copies automatically — no config change needed.

```
resources/views/vendor/laravel-passwordless/
├── layouts/auth.blade.php
├── magic-link/request.blade.php
├── magic-link/sent.blade.php
├── login-code/request.blade.php
├── login-code/verify.blade.php
├── emails/magic-link.blade.php
└── emails/login-code.blade.php
```

This is the better option when you want the working forms as a starting point rather than writing them from scratch.

{% callout title="You can mix the two" %}
Publishing does not disable the config keys. Publish the set, then still point one key elsewhere if a particular screen wants to live somewhere else. Config wins where it is set; the published file wins everywhere else; the package default is the last resort.
{% /callout %}

---

## What each view receives

| Key | Variable | Type | Description |
| --- | -------- | ---- | ----------- |
| `magic_link_email` | `$url` | `string` | The fully-signed magic link URL |
| `magic_link_email` | `$expiresMins` | `int` | TTL in minutes |
| `login_code_email` | `$code` | `string` | The plain-text code |
| `login_code_email` | `$expiresMins` | `int` | TTL in minutes |
| `login_code_verify` | `$email` | `string` | The pending address, so the screen can say where the code went |

The remaining form views receive nothing — they post to named routes and read errors from the standard error bag.

---

## Writing your own forms

Nothing about the forms is special. They post to the package's named routes and surface validation errors on the `email` and `code` fields.

### Magic link request

```blade
<form method="POST" action="{{ route('passwordless.magic-link.send') }}">
    @csrf
    <input type="email" name="email" value="{{ old('email') }}" required>
    @error('email') <p>{{ $message }}</p> @enderror
    <button type="submit">Email me a link</button>
</form>
```

### Login code request

```blade
<form method="POST" action="{{ route('passwordless.login-code.send') }}">
    @csrf
    <input type="email" name="email" value="{{ old('email') }}" required>
    @error('email') <p>{{ $message }}</p> @enderror
    <button type="submit">Email me a code</button>
</form>
```

### Login code verify

```blade
<form method="POST" action="{{ route('passwordless.login-code.authenticate') }}">
    @csrf
    <input type="text" name="code" inputmode="numeric" autocomplete="one-time-code" required>
    @error('code') <p>{{ $message }}</p> @enderror
    <button type="submit">Verify</button>
</form>
```

The pending email address is held in the session under `passwordless.pending_email` and passed to the view as `$email`, so the verify form does not need to resubmit it.

{% callout title="autocomplete=\"one-time-code\"" %}
Worth setting on the code input. It is what lets iOS and Android offer the code from the notification as a keyboard suggestion, which removes the main annoyance of the code flow. Pair it with `inputmode="numeric"` while your charset is numeric.
{% /callout %}

---

## Using Inertia instead

If your app renders through Inertia, the `components` config replaces `views` entirely. See [Inertia](/docs/inertia).
