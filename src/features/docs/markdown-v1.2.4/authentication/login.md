---
title: Login
---


# Login

## Overview

The login page allows users to authenticate with their email and password to access the Sentra CVM platform.

![Login Page](/img/v1.1/auth-images/login.png)


## Login Form

### Email Field

**Type:** Text input
**Required:** Yes
**Validation:**
- Must be a valid email format (e.g., user@example.com)

### Password Field

**Type:** Password input
**Required:** Yes
**Validation:**
- Minimum 6 characters
- Must match a registered account

### Show/Hide Password

Click the eye icon to toggle password visibility between hidden (dots) and plain text.


## Additional Options

### Remember Me

Enable the "Remember Me" checkbox to keep your login session active longer on this device. This is optional.

### Forgot Password?

If you've forgotten your password, see the [Password Reset](/documentation/authentication/password-reset) page for detailed instructions:

1. Click the **Forgot Password?** link
2. Enter your email address in the modal
3. Click **Send Reset Link**
4. Check your email for a password reset link
5. Follow the link to reset your password


## Login Process

1. Enter your registered email address
2. Enter your password
3. Optionally enable "Remember Me"
4. Click **Login**
5. You will be redirected to the dashboard upon successful authentication


## Error Handling

If login fails:
- **Invalid Credentials** - Check that your email and password are correct
- **Account Not Found** - Verify your email address is registered in the system
- **Account Inactive** - Contact your administrator if your account has been deactivated


## New Users

If you don't have an account, click **Request Account** to start the [account request process](/documentation/authentication/registration).

<!-- ---

## Tour & Help

Click the **Tour** button for a guided introduction to the Sentra CVM platform features and benefits. -->

