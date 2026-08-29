---
title: Login codes
nextjs:
  metadata:
    title: Login codes
    description: A short one-time code emailed to the user and typed into a verify form. Salted, hashed, single-use.
---

The user submits their email, receives a short code, and types it into a verify form. Useful whenever the sign-in device is not the device reading the mail. {% .lead %}

---

## The flow

| Step | Route | What happens |
| ---- | ----- | ------------ |
| 1 | `GET /auth/code` | Show the email form. |
| 2 | `POST /auth/code` | Resolve the user, generate a code, email it, redirect to the verify form with the email held in the session. |
| 3 | `GET /auth/code/verify` | Show the code entry form. |
| 4 | `POST /auth/code/verify` | Verify the code, log the user in, redirect. |

---

## Sending one

```php
use Torqie\LaravelPasswordless\Facades\LaravelPasswordless;

$code = LaravelPasswordless::for($user)->sendLoginCode();
```

Generates the code, notifies the user, fires `LoginCodeSent`, and returns the plain-text code. The return value exists for tests and for delivering over a channel other than email — do not log it.

Or link at the built-in form:

```blade
<a href="{{ route('passwordless.login-code.request') }}">Sign in with a code</a>
```

---

## Code format

Six numeric digits by default:

```php
'code' => [
    'length'  => 6,
    'charset' => '0123456789',
],
```

Make them longer, or alphanumeric:

```ini
PASSWORDLESS_CODE_LENGTH=8
PASSWORDLESS_CODE_CHARSET=ABCDEFGHJKLMNPQRSTUVWXYZ23456789
```

{% callout title="Drop the ambiguous characters" %}
The charset above omits `I`, `O`, `0`, and `1` on purpose. A code is read off a screen and typed by hand, and those four account for most misreads. If you go alphanumeric, take the same precaution — and note that the charset is used verbatim, so a character appearing twice is simply twice as likely.
{% /callout %}

---

## Only one code is live at a time

Generating a code for a user revokes any of their existing valid codes and deletes their spent ones. So:

- A user who requests a second code can only use the second one.
- The table holds roughly one code row per user, not one per login attempt ever made.

Other users' rows are never touched.

---

## How a code is verified

Codes are stored as `sha256($salt . $code)` with a per-row random salt. Because the salt differs per row, verification cannot look the code up by hash. Instead it loads that user's valid code rows and compares each with `hash_equals`, in constant time, so the comparison cannot be timed to leak a partial match.

A code that verifies is **deleted**, not marked used. See [why](/docs/how-it-works#what-is-cleaned-up).

{% callout type="warning" title="Upgrading from before 2.2.0" %}
Codes issued before the `salt` column existed carry a `null` salt and still verify against the original unsalted digest, so an upgrade does not lock anyone out mid-login. You do need to run `php artisan migrate`. See [Upgrading](/docs/upgrading).
{% /callout %}

---

## Failed attempts are throttled

Five failed verifications per email address, by default, over one TTL window. Exceeding it raises a `ValidationException` with a countdown message on the `code` field. A successful verification clears the counter.

```php
'rate_limits' => [
    'verify' => 5,
],
```

```ini
PASSWORDLESS_RATE_LIMIT_VERIFY=5
```

An unknown email address counts against the limit exactly as a wrong code does, and produces the same message — *The code is incorrect or has expired* — so the verify form does not reveal which addresses have accounts.

---

## Customising the email

The notification renders `laravel-passwordless::emails.login-code`. Override it:

```php
'views' => [
    'login_code_email' => 'emails.auth.login-code',
],
```

Your view receives:

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `$code` | `string` | The plain-text code |
| `$expiresMins` | `int` | TTL in minutes |

---

## The email on the verify form

`POST /auth/code` stashes the submitted address in the session and redirects to the verify form, so the user does not retype it. Under [Inertia](/docs/inertia), the `login_code_verify` component receives it as an `email` prop.
