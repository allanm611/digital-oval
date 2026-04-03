# Create User or Edit User

## Overview

Create new user accounts or edit existing user information. New users are assigned a role and department. When editing, only basic information can be modified.

## Accessing Create User

**Navigation:** AllUsers → User Management → Users → Click **Create User** button (top-right)

A modal dialog opens with the user creation form.


## Create User - Required Fields

These fields must be completed to create a new user account:

### Username

- **Required:** Yes
- **Format:** Unique identifier for system login
- **Note:** Cannot be changed after creation

### Email Address

- **Required:** Yes
- **Format:** Valid email address
- **System Uses:** User login credential
- **Note:** Must be unique across system

### First Name

- **Required:** Yes
- **Format:** Text (up to 100 characters)
- **Example:** "John"

### Last Name

- **Required:** Yes
- **Format:** Text (up to 100 characters)
- **Example:** "Smith"

### Password

- **Required:** Yes (for new users only)
- **Format:** Strong password
- **Requirements:**
  - Minimum 12 characters
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 number
  - At least 1 special character (!@#$%^&*)
- **Security:** Never share password via email or chat

### Primary Role

- **Required:** Yes
- **Format:** Select from available roles
- **System Uses:** Determines user permissions
- **Note:** Can be changed later by editing user


## Create User - Optional Fields

### Department

- **Required:** No
- **Format:** Text field
- **System Uses:** Organizational grouping, filtering
- **Example:** "Marketing", "Engineering", "Sales"

---

## Edit User - Editable Fields

When editing an existing user, only these fields can be modified:

- **First Name**
- **Last Name**
- **Department**
- **Primary Role** (can be changed)

### Non-Editable Fields (Cannot Change)

- **Username** - System identifier, cannot be changed
- **Email Address** - Not editable in user modal
- **Password** - Change separately if needed


## Editing an Existing User: Step-by-Step

### Step 1: Open User List

1. Navigate to User Management → Users
2. Find the user to edit
3. Click **View** button to open user details

### Step 2: Click Edit

1. Click **Edit** button (pencil icon)
2. Modal opens with user's current information

### Step 3: Modify Allowed Fields

You can edit:
- **First Name**
- **Last Name**
- **Department**
- **Primary Role**

### Step 4: Save Changes

1. Click **Save** button
2. Changes applied immediately
3. User permissions update if role was changed

