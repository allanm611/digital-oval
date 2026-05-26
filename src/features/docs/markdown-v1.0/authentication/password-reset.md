---
title: Password Reset
---

# Password Reset

## Overview

The Password Reset page allows users to create a new password after requesting a password reset from the login page.


## Accessing Password Reset

Password reset is initiated from the login page:

1. On the login page, click **Forgot Password?**
2. Enter your email address
3. Click **Send Reset Link**
4. Check your email for a password reset link
5. Click the link to access the Password Reset page

![Forgot Password Modal](/img/v1.0/auth-images/forgot-password.png)


## Password Requirements

When creating a new password, the password must meet the following requirements:

### Password Field*

**Type:** Password input
**Required:** Yes
**Validation Rules:**
- Minimum 8 characters
- Must contain at least one uppercase letter (A-Z)
- Must contain at least one lowercase letter (a-z)
- Must contain at least one number (0-9)

**Example valid password:** MyPassword123

### Confirm Password Field*

**Type:** Password input
**Required:** Yes
**Validation:**
- Must match the password entered above exactly


## Show/Hide Password

Click the eye icon next to each password field to toggle visibility between hidden (dots) and plain text. This applies independently to the Password and Confirm Password fields.


## Password Reset Process

1. Access the Password Reset page via the email link
2. Enter your new password in the **Password** field
3. Confirm the password in the **Confirm Password** field
4. Ensure both fields match and meet all requirements
5. Click **Reset Password**
6. A success page will be displayed confirming the reset
7. You will be automatically redirected to the login page after 3 seconds


## Error Handling

**Invalid or Expired Token**
- If your reset link has expired or is invalid, you will see an error message
- Click **Request New Reset Link** to request a fresh password reset link

**Passwords Don't Match**
- Ensure both the Password and Confirm Password fields are identical

**Password Doesn't Meet Requirements**
- Verify your password includes uppercase, lowercase, and numbers
- Ensure your password is at least 8 characters long


## Next Steps

After successfully resetting your password:
- You will be redirected to the [login page](/documentation/authentication/login)
- Log in with your email address and new password
- You will have access to your account

