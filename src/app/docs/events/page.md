---
title: Events
nextjs:
  metadata:
    title: Events
    description: The three events the package dispatches, when they fire, and what they carry.
---

Three events, dispatched at the two points worth hooking: when a secret goes out, and when a login succeeds. {% .lead %}

---

## The events

All three live in `Torqie\LaravelPasswordless\Events`.

| Event | Fired when | Properties |
| ----- | ---------- | ---------- |
| `MagicLinkSent` | A magic link is generated and emailed | `$authenticatable`, `$url` |
| `LoginCodeSent` | A login code is generated and emailed | `$authenticatable` |
| `UserAuthenticatedPasswordlessly` | A user successfully logs in | `$authenticatable`, `$type` |

`$type` is `'magic_link'` or `'login_code'`.

{% callout title="LoginCodeSent does not carry the code" %}
Deliberately. An event is the single most likely thing in the request to end up in a log, a queue payload, or an error reporter — none of which should ever hold a live credential. `MagicLinkSent` does carry `$url`, since some integrations genuinely need to deliver the link themselves; treat it with the same care you would a password reset URL and keep it out of your logs.
{% /callout %}

---

## Listening

```php
use Torqie\LaravelPasswordless\Events\UserAuthenticatedPasswordlessly;

class LogPasswordlessLogin
{
    public function handle(UserAuthenticatedPasswordlessly $event): void
    {
        activity()
            ->causedBy($event->authenticatable)
            ->log("Logged in via {$event->type}");
    }
}
```

Laravel discovers listeners in `app/Listeners` automatically. If you register manually, do it the usual way in a service provider:

```php
Event::listen(UserAuthenticatedPasswordlessly::class, LogPasswordlessLogin::class);
```

---

## What these are good for

### Marking an email verified

Clicking a magic link, or entering a code sent to an address, *is* proof the user controls that address. If you create accounts on first send, this is where you close the loop:

```php
class MarkEmailVerified
{
    public function handle(UserAuthenticatedPasswordlessly $event): void
    {
        $user = $event->authenticatable;

        if ($user->email_verified_at === null) {
            $user->forceFill(['email_verified_at' => now()])->save();
        }
    }
}
```

See [Passwordless sign-up](/docs/passwordless-sign-up) for the full pattern.

### Auditing

`UserAuthenticatedPasswordlessly` is the only reliable signal that a login succeeded. Because both flows report failure with a deliberately uninformative message, this event is where your login logging belongs.

### Detecting link scanners

A `MagicLinkSent` with no matching `UserAuthenticatedPasswordlessly`, on a token whose `used_at` was set seconds after it was issued, is a mail security product or link prefetcher — not your user. See [Magic links](/docs/magic-links).

### Alerting on unusual sends

```php
class WatchForAbuse
{
    public function handle(LoginCodeSent $event): void
    {
        $recent = $event->authenticatable
            ->passwordlessTokens()
            ->where('created_at', '>', now()->subHour())
            ->count();

        if ($recent > 10) {
            report(new SuspiciousLoginActivity($event->authenticatable));
        }
    }
}
```

---

## Queueing listeners

These are ordinary Laravel events, so `ShouldQueue` works as usual. One caveat on `UserAuthenticatedPasswordlessly`: it fires before the redirect, so a queued listener may well run after the user has already loaded the page it affects. Anything that must be true on the very next request — a verified flag the dashboard reads, say — should run synchronously.
