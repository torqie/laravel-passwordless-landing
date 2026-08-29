---
title: How it works
nextjs:
  metadata:
    title: How it works
    description: What happens between the send form and the authenticated session — token generation, storage, verification, and the events fired along the way.
---

Both flows are the same four steps with a different secret in the middle. This page walks through them so that when you swap a piece out, you know what you are replacing. {% .lead %}

---

## The shape of a login

1. **Resolve.** The user posts an email address. `ResolveUserForSendAction` throttles the request and looks up the matching account. If there is no match it returns `null` and the flow carries on as if there were — the response is identical either way, so the form cannot be used to enumerate accounts.
2. **Generate.** A generate action mints a secret, hashes it, and writes one row to `passwordless_tokens` with an `expires_at` of `now() + ttl`.
3. **Deliver.** The plain secret goes out as a notification — a signed URL for magic links, a short code for login codes — and a `MagicLinkSent` or `LoginCodeSent` event fires.
4. **Authenticate.** The user comes back with the secret. An authenticate action finds the matching row, consumes it, logs the user in on the configured guard, regenerates the session ID, and fires `UserAuthenticatedPasswordlessly`.

Every one of those steps is a contract you can replace. See [swapping actions](/docs/custom-actions).

---

## What is stored

One table, `passwordless_tokens`, holding a polymorphic reference to the authenticatable plus the hashed secret.

| Column | Notes |
| ------ | ----- |
| `authenticatable_type` / `authenticatable_id` | Morph target. Any model can hold tokens, not just `User`. |
| `token` | The **hash**, never the secret. Unique. |
| `salt` | 32 random hex characters, or `null` for magic links. |
| `type` | `magic_link` or `login_code`. |
| `expires_at` | Set from `ttl` at generation time. |
| `used_at` | Set when a magic link is consumed. Login codes delete instead. |

The plain secret is never written down. `token` and `salt` are both in the model's `$hidden`, so they cannot leak through a careless `toJson()`.

### Why only codes are salted

A magic link token is 64 random characters. There is nothing to exhaust, and it is looked up **by** its hash — a random per-row salt would make the row unfindable.

A login code is six digits by default: a keyspace of 1,000,000. An unsalted `sha256` over that is reversible by brute force in milliseconds, so a database dump would hand an attacker every code in flight. Each code therefore gets its own random salt and is stored as `sha256($salt . $code)`. Verification loads that user's valid code rows and compares each in constant time with `hash_equals`.

Salting protects low-entropy secrets. Only the code is one.

---

## What is cleaned up

- **Consumed login codes delete themselves.** A spent code has no remaining function — single-use is enforced just as well by the row's absence — and every retained row was another chance for a future code to collide on the unique `token` index.
- **Generating a code clears that user's spent codes** of the same type, so the table holds roughly one row per user rather than one per login attempt ever made. Other users' rows are untouched.
- **Consumed magic links keep `used_at`.** Retention costs nothing at 64 characters, and it stays genuinely useful: email scanners and link prefetchers routinely fetch a magic link before the human clicks it, and that is worth being able to see.

Scheduling [`passwordless:purge`](/docs/commands#passwordless-purge) is still worthwhile housekeeping, but it is no longer load-bearing for correctness.

---

## Failure is deliberately uninformative

Both an unknown email and a wrong code produce the same user-facing outcome as a valid one would at that stage. That is not an oversight:

- An unknown email on the send form gets the same "check your inbox" response as a known one.
- A wrong, expired, or already-used code gets one message — *The code is incorrect or has expired* — with no hint as to which.

Nothing diagnosable is lost. A successful login is reported by the `UserAuthenticatedPasswordlessly` event, which is where your logging belongs.

---

## Where the session comes from

Authentication goes through the guard named in `passwordless.guard` (default `web`), via a plain `Auth::guard($guard)->login($user, $remember)`. There is no custom session handling and no bespoke user provider — after login the user is authenticated exactly as if they had submitted a password form.

The session ID is regenerated immediately after login to close off session fixation.

---

## Next steps

- [Magic links](/docs/magic-links) — the link flow end to end
- [Login codes](/docs/login-codes) — the code flow end to end
- [Security](/docs/security) — rate limits, enumeration, and what the package does not do
