---
title: Magic links
nextjs:
  metadata:
    title: Magic links
    description: A signed, time-limited URL emailed to the user. Click it and you are signed in.
---

The user submits their email, receives a signed URL, clicks it, and is signed in. No form to fill in on the way back. {% .lead %}

---

## The flow

| Step | Route | What happens |
| ---- | ----- | ------------ |
| 1 | `GET /auth/magic-link` | Show the email form. |
| 2 | `POST /auth/magic-link` | Resolve the user, generate a token, email the link, show the "check your inbox" screen. |
| 3 | `GET /auth/magic-link/{token}` | Validate the signature and token, log the user in, redirect. |

Step 3 is protected by the `passwordless.signed` middleware, which rejects a URL whose signature does not verify or whose expiry has passed before the controller is ever reached.

---

## Sending one

From your own code, at any point — a controller, a job, an invite flow:

```php
use Torqie\LaravelPasswordless\Facades\LaravelPasswordless;

$url = LaravelPasswordless::for($user)->sendMagicLink();
```

This generates the token, notifies the user, fires `MagicLinkSent`, and returns the fully-signed URL. You usually do not need the return value — it is there for tests and for cases where you want to deliver the link over something other than email.

Or just link a user at the built-in form and let the package handle it:

```blade
<a href="{{ route('passwordless.magic-link.request') }}">Sign in with a magic link</a>
```

---

## The token

64 random characters, hashed with `sha256` and stored. The URL is additionally signed with Laravel's own signed-URL machinery, so it carries two independent guarantees:

- The **signature** proves the URL was not tampered with and has not passed its expiry.
- The **token row** proves it has not already been used.

Consuming a link marks `used_at` rather than deleting the row. See [why](/docs/how-it-works#what-is-cleaned-up).

{% callout type="warning" title="Email scanners click links" %}
Corporate mail security products and link prefetchers fetch URLs in incoming mail before the recipient sees them. A magic link is single-use, so a scanner that follows it burns it — the human then arrives at a dead link.

This is not something the package can prevent, and it is exactly why `used_at` is retained: a row with a `used_at` a second after `created_at` and no corresponding `UserAuthenticatedPasswordlessly` event is a scanner, not your user. If you see this pattern, [login codes](/docs/login-codes) are the flow that is immune to it.
{% /callout %}

---

## Expiry

Controlled by `ttl`, in minutes, shared with login codes:

```php
// config/passwordless.php
'ttl' => 15,
```

```ini
PASSWORDLESS_TTL=15
```

The value is also passed to the email template as `$expiresMins`, so the message can tell the user how long they have.

---

## Customising the email

The notification renders `laravel-passwordless::emails.magic-link`. Point the config at your own view to replace it wholesale:

```php
'views' => [
    'magic_link_email' => 'emails.auth.magic-link',
],
```

Your view receives:

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `$url` | `string` | The fully-signed magic link URL |
| `$expiresMins` | `int` | TTL in minutes |

Or publish the built-in templates and edit them in place:

```bash
php artisan vendor:publish --tag="laravel-passwordless-views"
```

See [Blade views](/docs/views) for the full list of overridable views.

---

## Where the user lands

On success, `redirects.after_login`. On an invalid or expired token, `redirects.invalid_token`.

```php
'redirects' => [
    'after_login'   => '/dashboard',
    'invalid_token' => '/login',
],
```

---

## Reusing the middleware

`passwordless.signed` is registered as a route middleware alias and is not specific to this package's routes. If you have your own token-bearing route that should carry the same signature and expiry guarantees:

```php
Route::get('/invitations/{token}', AcceptInvitation::class)
    ->middleware('passwordless.signed');
```
