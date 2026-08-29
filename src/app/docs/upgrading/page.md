---
title: Upgrading
nextjs:
  metadata:
    title: Upgrading
    description: What each release changed and what you need to do about it.
---

Version-by-version upgrade notes. The full history is in the [CHANGELOG](https://github.com/torqie/laravel-passwordless/blob/main/CHANGELOG.md). {% .lead %}

---

## To 2.2.0

**Run `php artisan migrate`.** This release adds a nullable `salt` column via a new `add_salt_to_passwordless_table` migration. Publish it if you publish migrations:

```bash
php artisan vendor:publish --tag="passwordless-migrations"
php artisan migrate
```

{% callout title="Nobody is locked out mid-login" %}
Codes issued before the column existed carry a `null` salt and still verify against the original unsalted digest. An in-flight code keeps working across the upgrade.
{% /callout %}

### What changed and why

**Login codes are now salted.** They were stored as an unsalted `sha256($code)`. With the default six-digit numeric charset that is a 1,000,000-value keyspace, so a database dump could be reversed by exhausting it in milliseconds. Each code now gets its own 32-hex-character random salt and is hashed as `sha256($salt . $code)`.

Magic links deliberately keep the unsalted digest — they are looked up **by** hash, so a per-row salt would make the row unfindable, and at 64 random characters there is nothing to exhaust.

**Login codes could collide on the unique `token` index.** With an unsalted digest over that small keyspace, and used or expired rows retained until `passwordless:purge` ran, a newly generated code whose digest already existed anywhere in the table raised an unhandled `QueryException` — which surfaced to the user as a failed login. Birthday odds reached roughly even at about 1,200 retained rows. Salting makes a collision astronomically unlikely; the retention changes below keep the table small regardless.

**Consumed login codes now delete themselves** rather than being marked `used_at`. A consumed code has no remaining function, and every retained row was collision surface. Magic links continue to mark `used_at` — retention is free there and stays useful for spotting a scanner or prefetcher.

**Generating a code clears that user's spent codes**, so the table holds about one row per user rather than one per login attempt ever made.

**`passwordless:purge` gained `--days=`** for keeping a retention window.

### If you have a custom `AuthenticatesViaLoginCode`

Switch from `$token->markUsed()` to the new `$token->consume()`. It carries the per-type retirement policy — codes delete, links mark `used_at` — so calling it keeps your implementation correct as that policy evolves.

```diff
- $token->markUsed();
+ $token->consume();
```

### If you have a custom `GeneratesLoginCode`

Hash with a salt and persist it, or you lose the fix. Subclassing `GenerateLoginCodeAction` and calling `parent::generate()` gets all of this for free — see [Swapping actions](/docs/custom-actions).

### Scheduling the purge

Still worthwhile housekeeping, but no longer load-bearing for correctness.

---

## To 2.1.0

**Nothing to change if you use the defaults.**

### What changed

**`config('passwordless.actions.*')` now actually applies to the HTTP flow.** Both controllers type-hinted the concrete action classes in their method signatures, so the container returned the default implementation and the configured class was bypassed — the bindings only ever took effect through the facade. The controllers now type-hint the contracts.

{% callout type="warning" title="This may switch on config you thought was inert" %}
If you set an `actions.*` key before 2.1.0 and it appeared to do nothing through the built-in routes, it starts working on upgrade. Check those keys point where you actually want them before you deploy.
{% /callout %}

**`ResolvesUserForSend` was added** — `handle(string $email, string $ip): ?Authenticatable` — along with the `actions.resolve_user` config key. This is the extension point for deciding what happens when a submitted address has no account. The default returns `null` and the flow stays silent; an override can register the address instead, which makes [passwordless sign-up](/docs/passwordless-sign-up) possible without patching the package.

### If you bound the concrete action classes yourself

Switch to the `actions.*` config keys. Your container bindings still work, but they are no longer needed:

```php
// Remove from your service provider
$this->app->bind(GenerateMagicLinkAction::class, MyAction::class);
```

```php
// config/passwordless.php
'actions' => [
    'generate_magic_link' => \App\Auth\MyAction::class,
],
```

---

## Framework support

| Package version | PHP | Laravel |
| --------------- | --- | ------- |
| 2.x | 8.3+ | 12.61.1+ or 13.12.0+ |

The framework floors are patch-level on purpose — they are the versions the package is actually tested against, not an arbitrary pin. The PHP floor follows from them; the package's own code does not require 8.3 features.
