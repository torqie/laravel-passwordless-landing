---
title: Passwordless sign-up
nextjs:
  metadata:
    title: Passwordless sign-up
    description: Register unknown email addresses on first send, so signing up and signing in are the same form.
---

By default an unknown email address gets no account and no email — silently, so the form cannot be used to enumerate users. Override one action and the same form becomes a sign-up. {% .lead %}

---

## Why this is an override

`ResolveUserForSendAction` decides who receives a token when someone submits the send form. It throttles the request, then returns the matching user — or `null` when the address is unknown, in which case the flow stays silent.

That is the right default: a form that behaves differently for known and unknown addresses is an account-enumeration oracle. But it is a policy choice, not a mechanism, which is why it lives behind a swappable contract rather than inside a controller.

---

## Registering on first send

Subclass the default and call `parent::handle()` first, so the send rate limit still applies:

```php
namespace App\Auth;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Torqie\LaravelPasswordless\Actions\ResolveUserForSendAction;

class RegisterOnSendResolver extends ResolveUserForSendAction
{
    public function handle(string $email, string $ip): ?Authenticatable
    {
        // Keeps the send throttling from the parent action.
        if ($user = parent::handle($email, $ip)) {
            return $user;
        }

        return User::create(['email' => $email]);
    }
}
```

```php
// config/passwordless.php
'actions' => [
    'resolve_user' => \App\Auth\RegisterOnSendResolver::class,
],
```

{% callout type="warning" title="Call the parent first" %}
The send rate limiting lives in `ResolveUserForSendAction::handle()`, not in the controller. A resolver that implements `ResolvesUserForSend` from scratch — rather than extending the default — must bring its own, or the send endpoint becomes an unthrottled way to make your app deliver mail to arbitrary addresses.
{% /callout %}

---

## Finishing the sign-up

The new account starts nameless and unverified. Clicking the link, or entering the code, **is** the verification — it proves the person controls that address. Close the loop on the login event:

```php
namespace App\Listeners;

use Torqie\LaravelPasswordless\Events\UserAuthenticatedPasswordlessly;

class CompleteRegistration
{
    public function handle(UserAuthenticatedPasswordlessly $event): void
    {
        $user = $event->authenticatable;

        if ($user->email_verified_at !== null) {
            return;
        }

        $user->forceFill(['email_verified_at' => now()])->save();

        // Anything else a brand new account needs.
        $user->teams()->create(['name' => 'Personal']);
    }
}
```

Run this synchronously if the page the user lands on depends on it. See [Events](/docs/events#queueing-listeners).

---

## Collecting a name

Two reasonable options.

**Redirect new users to a profile step.** Point `redirects.after_login` at a route that checks for a missing name and prompts for it, then continues to the dashboard.

**Accept it on the send form.** The resolver only receives the email address, but the request is still available:

```php
public function handle(string $email, string $ip): ?Authenticatable
{
    if ($user = parent::handle($email, $ip)) {
        return $user;
    }

    return User::create([
        'email' => $email,
        'name'  => request()->string('name')->value() ?: null,
    ]);
}
```

Validate it in a form request or a middleware on the send route — the resolver is not the place for validation, and it runs for existing users too.

---

## What you are giving up

Be clear-eyed about the trade:

- **Enumeration.** Sign-up-on-send does not by itself leak which addresses have accounts — the response is the same either way. But the *email* differs (a welcome vs. a sign-in), so an attacker who controls an address they suspect is registered can still learn the answer. That is inherent to the feature.
- **Junk accounts.** Every submitted address becomes a row, throttled but not otherwise gated. If that matters, only create the account once the token is actually consumed — resolve to a lightweight pending record and promote it in the login listener.
- **Mail reputation.** Your app now sends mail to addresses that never asked for it. Watch your bounce rate, and consider requiring a captcha or an invite code on the send form for public sign-ups.

---

## Writing a resolver from scratch

If subclassing does not fit, implement the contract directly — and bring your own throttling:

```php
use Illuminate\Contracts\Auth\Authenticatable;
use Torqie\LaravelPasswordless\Contracts\ResolvesUserForSend;

class MyResolver implements ResolvesUserForSend
{
    public function handle(string $email, string $ip): ?Authenticatable
    {
        // Rate limiting is yours to implement here.
    }
}
```
