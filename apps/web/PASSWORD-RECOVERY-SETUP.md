# AKOX password recovery setup

The app now includes:

- `/forgot-password`: requests a Supabase password recovery email.
- `/reset-password`: accepts only a Supabase recovery session and updates the password.
- A `Forgot password?` link on the login page.

## Supabase dashboard configuration

In **Authentication → URL Configuration**, set:

- **Site URL:** `https://akox.in`
- **Redirect URLs:** add `https://akox.in/reset-password`
- For local development, also add `http://localhost:3000/reset-password`.

Keep any existing redirect URLs used for email confirmation and OAuth. Do not replace the existing list; add these URLs.

The password recovery email template should use Supabase's confirmation URL, normally `{{ .ConfirmationURL }}`, so Supabase can validate and exchange the one-time recovery token.

## Test checklist

1. Deploy the updated app.
2. Open `https://akox.in/login` and select **Forgot password?**.
3. Request a reset using an email address for an existing account.
4. Open the email and follow the link. It should open `/reset-password`.
5. Enter a new password twice and submit.
6. Confirm the success message, then log in using the new password.
7. Try opening `/reset-password` directly in a fresh browser tab. It should reject the request and offer a new reset link.

The forgot-password response intentionally uses the same success message whether or not an account exists, to reduce account-enumeration risk. If Turnstile is enabled with `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, its token is sent with the recovery request.
