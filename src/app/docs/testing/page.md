---
title: Testing
nextjs:
  metadata:
    title: Testing
    description: Test passwordless flows in your own app, and run the package's own suite.
---

Both flows are ordinary HTTP requests against ordinary Laravel plumbing, so they test the way everything else in your app does. {% .lead %}

---

## Testing a magic link login

The facade returns the signed URL, which is all you need to complete the flow:

```php
use Torqie\LaravelPasswordless\Facades\LaravelPasswordless;

it('signs a user in through a magic link', function () {
    $user = User::factory()->create();

    $url = LaravelPasswordless::for($user)->sendMagicLink();

    $this->get($url)->assertRedirect(config('passwordless.redirects.after_login'));

    $this->assertAuthenticatedAs($user);
});
```

And that a link only works once:

```php
it('rejects a reused magic link', function () {
    $user = User::factory()->create();
    $url = LaravelPasswordless::for($user)->sendMagicLink();

    $this->get($url);
    auth()->logout();

    $this->get($url)->assertRedirect(config('passwordless.redirects.invalid_token'));
    $this->assertGuest();
});
```

---

## Testing a login code

`sendLoginCode()` returns the plain code:

```php
it('signs a user in with a login code', function () {
    $user = User::factory()->create();

    $code = LaravelPasswordless::for($user)->sendLoginCode();

    $this->withSession(['passwordless.pending_email' => $user->email])
        ->post(route('passwordless.login-code.authenticate'), ['code' => $code])
        ->assertRedirect(config('passwordless.redirects.after_login'));

    $this->assertAuthenticatedAs($user);
});
```

Or drive the whole thing through the HTTP routes and read the code off the notification:

```php
use Illuminate\Support\Facades\Notification;
use Torqie\LaravelPasswordless\Notifications\LoginCodeNotification;

it('emails a code and accepts it', function () {
    Notification::fake();

    $user = User::factory()->create();

    $this->post(route('passwordless.login-code.send'), ['email' => $user->email])
        ->assertRedirect(route('passwordless.login-code.verify'));

    Notification::assertSentTo($user, LoginCodeNotification::class);
});
```

---

## Asserting on events

```php
use Illuminate\Support\Facades\Event;
use Torqie\LaravelPasswordless\Events\UserAuthenticatedPasswordlessly;

it('fires the login event', function () {
    Event::fake([UserAuthenticatedPasswordlessly::class]);

    $user = User::factory()->create();
    $this->get(LaravelPasswordless::for($user)->sendMagicLink());

    Event::assertDispatched(
        UserAuthenticatedPasswordlessly::class,
        fn ($event) => $event->type === 'magic_link'
            && $event->authenticatable->is($user),
    );
});
```

---

## Testing an unknown address stays silent

The behaviour worth pinning down, because it is the one an innocuous refactor breaks:

```php
it('does not disclose unknown addresses', function () {
    Notification::fake();

    $this->post(route('passwordless.login-code.send'), ['email' => 'nobody@example.com'])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    Notification::assertNothingSent();
});
```

---

## Watch out for the rate limiters

Both limiters are real in tests, and a test that sends several codes for one address — or several requests from the same IP — will hit them. Clear between tests:

```php
use Illuminate\Support\Facades\RateLimiter;

beforeEach(fn () => RateLimiter::clear('passwordless:send:127.0.0.1|'.$email));
```

Or raise them for the test environment:

```php
config()->set('passwordless.rate_limits.send', 1000);
config()->set('passwordless.rate_limits.verify', 1000);
```

---

## Testing a swapped action

Set the config key and drive a real request — the config is read at resolve time, so no service provider work is needed:

```php
it('uses the configured generator', function () {
    config()->set(
        'passwordless.actions.generate_login_code',
        FakeLoginCodeAction::class,
    );

    $user = User::factory()->create();

    $this->post(route('passwordless.login-code.send'), ['email' => $user->email])
        ->assertRedirect();

    expect(FakeLoginCodeAction::$called)->toBeTrue();
});
```

See [Swapping actions](/docs/custom-actions).

---

## The package's own suite

```bash
composer test
```

A full Pest suite covering the models, actions, controllers, notifications, events, config-driven action swapping, the fluent API, and the purge command — including tests that swap each of the five contracts via config and assert the replacement runs through a real HTTP request.

Contributions are expected to keep it green. See [CONTRIBUTING.md](https://github.com/torqie/laravel-passwordless/blob/main/CONTRIBUTING.md).
