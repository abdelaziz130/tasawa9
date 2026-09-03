# Fix admin email changes

## Changes
- Replace hardcoded-email owner detection with an immutable owner-account record keyed by user ID.
- Update database authorization helpers so the owner retains global admin access after changing email.
- Make the email update validate the current email, save Auth and account-directory values, verify both writes, and return the refreshed identity.
- Refresh the browser session after the change and update the Admin UI immediately.
- Update owner-only staff operations and login checks to use the immutable owner identity.

## Validation
- Verify type safety and database authorization checks.
- Test changing the owner email in the live admin account flow and confirm the Account panel and owner-only tabs remain available.
