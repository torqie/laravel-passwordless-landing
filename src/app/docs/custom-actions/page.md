---
title: Swapping actions
nextjs:
  metadata:
    title: Swapping actions
    description: Five contracts cover token generation, authentication, and user lookup. Replace any of them with a config key.
---

Every meaningful step of both flows sits behind a contract. Point a config key at your own class and the controllers pick it up — no service provider bindings required. {% .lead %}

---

## The five contracts

All in `Torqie\LaravelPasswordless\Contracts`.

| Config key | Contract | Default |
| ---------- | -------- | ------- |
| `generate_magic_link` | `GeneratesMagicLink` | `GenerateMagicLinkAction` |
| `authenticate_magic_link` | `AuthenticatesViaMagicLink` | `AuthenticateViaMagicLinkAction` |
| `generate_login_code` | `GeneratesLoginCode` | `GenerateLoginCodeAction` |
| `authenticate_login_code` | `AuthenticatesViaLoginCode` | `AuthenticateViaLoginCodeAction` |
| `resolve_user` | `ResolvesUserForSend` | `ResolveUserForSendAction` |

---

## Swapping one

### 1. Implement the contract

```php
namespace App\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Torqie\LaravelPasswordless\Contracts\GeneratesMagicLink;

class MyGenerateMagicLinkAction implements GeneratesMagicLink
{
    public function generate(Authenticatable $authenticatable): string
    {
        // Mint the token, persist its hash, return the signed URL.
    }
}
```

### 2. Register it

```php
// config/passwordless.php
'actions' => [
    'generate_magic_link' => \App\Auth\MyGenerateMagicLinkAction::class,
],
```

That is the whole procedure. The controllers and the facade both type-hint the contracts, so the config key is the single source of truth.

{% callout title="Subclass rather than reimplement" %}
Extending the default action and overriding one method keeps you on the package's upgrade path. A from-scratch implementation has to carry everything the default does — hashing, salting, revoking the user's previous tokens, rate limiting — and quietly loses whatever gets added to the default later.
{% /callout %}

---

## What each contract is responsible for

### `GeneratesMagicLink` / `GeneratesLoginCode`

```php
public function generate(Authenticatable $authenticatable): string;
```

Mint the secret, persist a hashed row against the authenticatable with an `expires_at`, and return the plain secret (the code) or the signed URL (the link). Notification and event dispatch happen **outside** the action, so a replacement does not need to handle either.

The default code generator also revokes the user's live codes and deletes their spent ones. Keep that if you replace it — see [How it works](/docs/how-it-works#what-is-cleaned-up) for why it matters.

### `AuthenticatesViaMagicLink` / `AuthenticatesViaLoginCode`

```php
public function authenticate(string $email, string $code): RedirectResponse;
```

Find the matching valid token, consume it, log the user in, regenerate the session, fire `UserAuthenticatedPasswordlessly`, and return a redirect. Replacements own all of it, including throwing `ValidationException` on failure.

Retiring a token is `$token->consume()`, not `$token->markUsed()`. `consume()` carries the per-type policy — codes delete, links mark `used_at` — so calling it keeps you correct as that policy evolves.

### `ResolvesUserForSend`

```php
public function handle(string $email, string $ip): ?Authenticatable;
```

Throttle the send request and return the account for that address, or `null` when there is none. Returning `null` is what makes the flow silent for unknown addresses. This is the extension point for [passwordless sign-up](/docs/passwordless-sign-up).

---

## Worked example: sending a code over SMS only

The facade always notifies by email, so to send *only* over another channel you replace the generator and do delivery there.

```php
namespace App\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Torqie\LaravelPasswordless\Actions\GenerateLoginCodeAction;

class SmsLoginCodeAction extends GenerateLoginCodeAction
{
    public function __construct(
        private readonly SmsGateway $sms,
        TokenGenerator $tokenGenerator,
    ) {
        parent::__construct($tokenGenerator);
    }

    public function generate(Authenticatable $authenticatable): string
    {
        // Keeps hashing, salting, and the revoke-and-clean behaviour.
        $code = parent::generate($authenticatable);

        if ($phone = $authenticatable->phone) {
            $this->sms->send($phone, "Your code is {$code}");
        }

        return $code;
    }
}
```

```php
'actions' => [
    'generate_login_code' => \App\Auth\SmsLoginCodeAction::class,
],
```

Actions are resolved from the container, so constructor dependencies are injected normally.

---

## Worked example: a shorter TTL for admins

```php
namespace App\Auth;

use Illuminate\Contracts\Auth\Authenticatable;
use Torqie\LaravelPasswordless\Actions\GenerateMagicLinkAction;

class ShortLivedAdminLinkAction extends GenerateMagicLinkAction
{
    public function generate(Authenticatable $authenticatable): string
    {
        if ($authenticatable->is_admin) {
            config()->set('passwordless.ttl', 5);
        }

        return parent::generate($authenticatable);
    }
}
```

The override is confined to the current request, so it does not leak into anything else.

---

## Testing a swap

Set the config key and drive a real request. The package's own suite does exactly this for all five contracts:

```php
it('uses the configured generator', function () {
    config()->set(
        'passwordless.actions.generate_login_code',
        FakeLoginCodeAction::class,
    );

    $this->post(route('passwordless.login-code.send'), [
        'email' => $user->email,
    ])->assertRedirect();

    expect(FakeLoginCodeAction::$called)->toBeTrue();
});
```

See [Testing](/docs/testing).
