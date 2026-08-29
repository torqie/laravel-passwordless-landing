---
title: Fluent API
nextjs:
  metadata:
    title: Fluent API
    description: Trigger a magic link or login code from your own code with the LaravelPasswordless facade, plus the helpers the trait adds to your model.
---

The built-in routes cover the common case. When you need to send a link or a code from somewhere else — a controller, a job, a listener, a console command — use the facade. {% .lead %}

---

## The facade

```php
use Torqie\LaravelPasswordless\Facades\LaravelPasswordless;

// Send a magic link — returns the signed URL
$url = LaravelPasswordless::for($user)->sendMagicLink();

// Send a login code — returns the plain-text code
$code = LaravelPasswordless::for($user)->sendLoginCode();
```

Both methods do the same three things:

1. Generate the secret and persist its hash
2. Send the notification to the user
3. Fire the corresponding event — `MagicLinkSent` or `LoginCodeSent`

`for()` returns a clone, so the facade is safe to use repeatedly in one request without one call leaking into the next.

{% callout type="warning" title="The return values are secrets" %}
`sendMagicLink()` returns a URL that authenticates whoever holds it, and `sendLoginCode()` returns the code in plain text. They are returned for tests, and for delivering over a channel other than email — an SMS gateway, say. Do not log them, put them in a response body, or store them.
{% /callout %}

Calling `sendMagicLink()` or `sendLoginCode()` without a preceding `for()` throws a `LogicException`.

---

## Practical uses

### Onboarding without a password

Create the account, then send them straight in:

```php
$user = User::create(['email' => $request->email, 'name' => $request->name]);

LaravelPasswordless::for($user)->sendMagicLink();

return redirect()->route('check-your-email');
```

### Resending from a job

```php
class SendLoginCode implements ShouldQueue
{
    public function __construct(private readonly User $user) {}

    public function handle(): void
    {
        LaravelPasswordless::for($this->user)->sendLoginCode();
    }
}
```

Remember that generating a code revokes the user's previous one — a queued resend that runs late will invalidate a code the user may already be typing.

### Delivering a code over SMS instead of email

```php
$code = LaravelPasswordless::for($user)->sendLoginCode();

$sms->send($user->phone, "Your code is {$code}");
```

The email still goes out — the facade always notifies. To send **only** over SMS, swap the generate action instead so nothing is emailed. See [Swapping actions](/docs/custom-actions).

---

## Trait helpers

`HasPasswordlessAuth` adds a morph relation and three helpers to your model.

```php
// All tokens ever issued to this user (that still exist)
$user->passwordlessTokens;

// Only valid tokens — unused and not yet expired
$user->validPasswordlessTokens;

// Invalidate all unused tokens
$user->invalidatePasswordlessTokens();

// ...or just one type
$user->invalidatePasswordlessTokens('magic_link');
$user->invalidatePasswordlessTokens('login_code');
```

`invalidatePasswordlessTokens()` marks tokens `used_at` rather than deleting them, so they stop working immediately but remain visible. It is the right call on a "sign out everywhere" or "this email address was compromised" action:

```php
public function revokeAccess(User $user): void
{
    $user->invalidatePasswordlessTokens();
    Auth::logoutOtherDevices($user);
}
```

Both relations are ordinary `MorphMany`s, so the usual query builder is available:

```php
$user->passwordlessTokens()
    ->ofType('magic_link')
    ->where('created_at', '>', now()->subDay())
    ->count();
```

---

## Model scopes

`PasswordlessToken` exposes three scopes, usable through the relations above or on the model directly:

| Scope | Matches |
| ----- | ------- |
| `valid()` | `used_at` is null **and** `expires_at` is in the future |
| `unused()` | `used_at` is null, regardless of expiry |
| `ofType($type)` | `magic_link` or `login_code` |

The `token` and `salt` columns are in the model's `$hidden`, so they will not appear in a serialised token.
