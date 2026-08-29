---
title: Security
nextjs:
  metadata:
    title: Security
    description: Rate limiting, enumeration resistance, how secrets are stored, and what the package deliberately leaves to you.
---

What the package defends against, how, and — just as usefully — what it does not. {% .lead %}

---

## How secrets are stored

Neither the link token nor the code is ever written down in plain text.

| | Magic link | Login code |
| --- | --- | --- |
| Length | 64 random characters | 6 characters (configurable) |
| Stored as | `sha256($token)` | `sha256($salt . $code)` |
| Salt | None, by design | 32 random hex characters, per row |
| On use | `used_at` set | Row deleted |

A magic link is looked up **by** its hash, so a per-row salt would make the row unfindable — and at 64 random characters there is nothing to brute-force. A six-digit code has a keyspace of 1,000,000; an unsalted digest over that is reversible in milliseconds, so a database dump would hand over every code in flight. Salting protects low-entropy secrets, and only the code is one.

`token` and `salt` are both in the model's `$hidden`, so a careless serialisation cannot leak them.

---

## Rate limiting

Two independent limiters, both configurable.

### Sending

```php
'rate_limits' => ['send' => 5],
```

Keyed on **IP address plus email**, decaying over 60 seconds. Applies to both flows, and lives in `ResolveUserForSendAction` — so a [custom resolver](/docs/custom-actions#resolves-user-for-send) that does not call `parent::handle()` loses it.

Exceeding it raises a `ValidationException` on the `email` field with a countdown.

{% callout type="warning" title="The send limiter is per IP + email" %}
That combination stops one address being spammed from one host. It does **not** stop a distributed source, nor one host walking many addresses — each new pair gets a fresh bucket. If your send form is public, put a coarser limiter in front of it too:

```php
'routes' => [
    'prefix'     => 'auth',
    'middleware' => ['web', 'throttle:20,1'],
],
```
{% /callout %}

### Verifying

```php
'rate_limits' => ['verify' => 5],
```

Keyed on the lowercased **email address**, decaying over one `ttl` window. Five wrong codes and that address must wait. A successful verification clears the counter immediately.

This is what makes a six-digit code safe: 1,000,000 possibilities against five attempts per TTL window.

An unknown email address counts against the limit exactly as a wrong code does, so the verify form cannot be used to test whether an address is registered.

---

## Enumeration resistance

Both forms behave identically whether or not the address has an account:

- **Send.** An unknown address gets the same "check your inbox" response as a known one. No email is sent, no account is created, nothing is disclosed.
- **Verify.** A wrong code, an expired code, an already-used code, and an unregistered address all produce the same message — *The code is incorrect or has expired* — with no hint as to which.

This is deliberate rather than lazy. Nothing diagnosable is lost: a successful login is reported by [`UserAuthenticatedPasswordlessly`](/docs/events), which is where login logging belongs.

If you enable [passwordless sign-up](/docs/passwordless-sign-up), read the trade-offs there — the HTTP responses stay identical, but the email that arrives differs.

---

## Session handling

Every successful authentication regenerates the session ID before the redirect, closing off session fixation. Login itself is a plain `Auth::guard($guard)->login($user, $remember)` — no custom session handling, no bespoke user provider. After login the user is authenticated exactly as a password form would have left them.

---

## Signed URLs

`GET /auth/magic-link/{token}` is wrapped in the `passwordless.signed` middleware, so a tampered or expired URL is rejected before the controller runs. The token row is then checked separately for single use. Two independent guarantees: the signature covers integrity and expiry, the row covers reuse.

This relies on `APP_KEY`. Rotating it invalidates every magic link in flight — which is the correct behaviour, but worth knowing before you rotate.

---

## Constant-time comparison

Code verification loads the user's valid code rows and compares each with `hash_equals`, never `==`. Because each row carries its own salt there is no way to look a code up directly, so the comparison loop is unavoidable — running it in constant time keeps it from leaking a partial match through timing.

---

## What the package does not do

Worth being explicit about:

- **No CAPTCHA or bot defence.** The send form is a public endpoint that causes your app to send mail. Rate limiting is the only thing in front of it.
- **No device or location binding.** A magic link works from any browser, not only the one that requested it. This is what makes the flow usable — people request on a phone and click on a laptop — but it means a forwarded or intercepted link authenticates the recipient.
- **No mail transport hardening.** A magic link in an inbox is a bearer credential, and email is not a confidential channel. Keep `ttl` short. For higher-value accounts, [login codes](/docs/login-codes) are the better flow — a code is useless without the session that requested it.
- **No second factor.** This is a first-factor mechanism. Layer your own 2FA on the [login event](/docs/events) if you need it.
- **No account lockout.** The verify limiter throttles; it does not lock. That is intentional — a lockout on an unauthenticated, email-keyed endpoint is a denial-of-service vector against your own users.

---

## Housekeeping

Consumed codes delete themselves and generating a code clears that user's spent ones, so the token table stays small on its own. Scheduling a purge is still good hygiene:

```php
Schedule::command('passwordless:purge')->daily();
```

See [Artisan commands](/docs/commands#passwordless-purge).

---

## Reporting a vulnerability

Please use the [repository's security policy](https://github.com/torqie/laravel-passwordless/security/policy) rather than opening a public issue.
