---
title: Inertia
nextjs:
  metadata:
    title: Inertia
    description: Render the passwordless screens as Vue, React, or Svelte components instead of Blade views.
---

Turn on Inertia mode and the controllers call `Inertia::render($component, $props)` instead of `view()`. Everything else about the flows is unchanged. {% .lead %}

---

## Scaffold the components

```bash
php artisan passwordless:install-inertia
```

The command reads your `package.json` to detect the framework, or takes it explicitly:

```bash
php artisan passwordless:install-inertia --framework=vue
php artisan passwordless:install-inertia --framework=react
php artisan passwordless:install-inertia --framework=svelte
```

It writes four working components — Vue shown here:

```
resources/js/Pages/Auth/MagicLinkRequest.vue
resources/js/Pages/Auth/MagicLinkSent.vue
resources/js/Pages/Auth/LoginCodeRequest.vue
resources/js/Pages/Auth/LoginCodeVerify.vue
```

Then prints the config snippet to paste in. Add `--force` to overwrite stubs you have already published.

---

## Turn it on

```php
// config/passwordless.php
'inertia' => true,

'components' => [
    'magic_link_request' => 'Auth/MagicLinkRequest',
    'magic_link_sent'    => 'Auth/MagicLinkSent',
    'login_code_request' => 'Auth/LoginCodeRequest',
    'login_code_verify'  => 'Auth/LoginCodeVerify',
],
```

```ini
PASSWORDLESS_INERTIA=true
```

When `inertia` is `true`, the `components` keys take precedence over the [`views`](/docs/views) keys. The two email templates are always Blade — an email is not an Inertia page — so `magic_link_email` and `login_code_email` still come from `views`.

{% callout title="inertiajs/inertia-laravel is not a dependency" %}
The package does not require it. It only needs to be installed in your app if you enable Inertia mode, which keeps it out of the way of Blade-only apps.
{% /callout %}

---

## Props

| Component | Prop | Type | Description |
| --------- | ---- | ---- | ----------- |
| `login_code_verify` | `email` | `string` | The pending email address from the session |

All other components receive no additional props. Validation errors arrive through Inertia's standard `errors` bag, on the `email` and `code` keys.

---

## Example components

### Requesting a login code

```vue
<!-- resources/js/Pages/Auth/LoginCodeRequest.vue -->
<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({ email: '' })
const submit = () => form.post(route('passwordless.login-code.send'))
</script>

<template>
    <form @submit.prevent="submit">
        <input v-model="form.email" type="email" placeholder="your@email.com" />
        <button type="submit" :disabled="form.processing">Send code</button>
        <div v-if="form.errors.email">{{ form.errors.email }}</div>
    </form>
</template>
```

### Verifying it

```vue
<!-- resources/js/Pages/Auth/LoginCodeVerify.vue -->
<script setup>
import { useForm } from '@inertiajs/vue3'

defineProps({ email: String })

const form = useForm({ code: '' })
const submit = () => form.post(route('passwordless.login-code.authenticate'))
</script>

<template>
    <p>We sent a code to {{ email }}.</p>

    <form @submit.prevent="submit">
        <input
            v-model="form.code"
            type="text"
            inputmode="numeric"
            autocomplete="one-time-code"
            placeholder="123456"
        />
        <button type="submit" :disabled="form.processing">Verify</button>
        <div v-if="form.errors.code">{{ form.errors.code }}</div>
    </form>
</template>
```

### Requesting a magic link

```vue
<!-- resources/js/Pages/Auth/MagicLinkRequest.vue -->
<script setup>
import { useForm } from '@inertiajs/vue3'

const form = useForm({ email: '' })
const submit = () => form.post(route('passwordless.magic-link.send'))
</script>

<template>
    <form @submit.prevent="submit">
        <input v-model="form.email" type="email" placeholder="your@email.com" />
        <button type="submit" :disabled="form.processing">Email me a link</button>
        <div v-if="form.errors.email">{{ form.errors.email }}</div>
    </form>
</template>
```

---

## The redirect after login is a full page load

`redirects.after_login` is a plain path handed to `redirect()->to()`, not an Inertia visit. That is correct and intentional: the user's session identity has just changed, so a fresh document request is what you want. Point it at an Inertia-rendered route and Inertia picks up from there normally.
