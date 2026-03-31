# Edit Manual Communication

## Overview

Edit a scheduled manual communication to modify its settings before execution. Only scheduled communications that haven't started sending can be edited.

## When You Can Edit

**Editable Communications:**
- Status: **Scheduled** (awaiting execution)
- Execution time has not been reached
- No messages have been sent yet

**Not Editable:**
- **Completed** communications (already sent)
- **Pending** communications (currently sending)
- **Failed** communications (already attempted)
- Communications past their scheduled time

## How to Access Edit

**From Communications List**
1. Navigate to **Manual Actions → Manual Communications**
2. Find the scheduled communication
3. Click **Edit** button
4. Edit form opens with current settings pre-filled

**From Details Page**
1. View communication details
2. Click **Edit Communication** button
3. Edit form opens

## Editable Fields

### Step 1: Audience Settings

**Audience Source** (Editable)
- Change from File to Quicklist or vice versa
- Upload new file
- Select different quicklist

**Subscription ID Column** (if File Upload)
- Select different column for customer ID
- Important if original column had errors

**Audience Preview**
- Shows current audience
- Updated immediately after changes
- New recipient count displayed

### Step 2: Message Content

**Channel** (Editable)
- Change communication channel
- Email → SMS, WhatsApp, or Push
- Requires message format adjustment

**Message Title** (if Email/Push)
- Edit subject line or notification title
- Max 100 characters
- Updated in real-time

**Message Body** (Editable)
- Edit or rewrite message
- Supports rich text formatting
- Preview available
- Max 5000 characters

**Variables** (Editable)
- Add new variables
- Remove unused variables
- Update variable references
- Verify substitution with examples

**SMS Route** (if SMS Channel)
- Change SMS provider/gateway
- Select from available routes
- View route details

### Step 3: Communication Policy

**Policy Selection** (Editable)
- Add policies not previously applied
- Remove policies
- Change policy combination
- View new audience impact

**Policy Impact**
- New audience size shown
- Filtered customer count
- Filtering reasons

### Step 4: Execution Schedule

**Execution Timing** (Editable)
- Change execution date
- Modify execution time
- Update timezone
- Can schedule for earlier or later time

**Important:** Cannot modify if execution time has passed

## Editing Workflow

### 1. Access Edit Form

The form shows all current settings:
- All fields pre-filled with existing values
- Current selections highlighted
- Can modify one or all fields

### 2. Make Changes

**Modify Fields as Needed**
- Edit message content
- Update audience
- Change policy settings
- Adjust execution time

**Changes are NOT saved automatically**
- Keep editing until satisfied
- Use preview features to verify changes

### 3. Preview Changes

**Message Preview**
- See how message appears to customers
- Check variable substitution with sample data
- Verify formatting and layout

**Audience Preview**
- See first 10 customers after audience change
- Check policy impact
- Confirm ID column selection

**Impact Summary**
- New audience size
- Policy filtering effects
- Channel-specific notes

### 4. Save Changes

**Review All Changes**
- Summary of modifications made
- Differences from original

**Click Save/Update**
- Changes are saved
- Communication updated
- Scheduled for new time (if modified)

**Confirmation Message**
- Shows successful update
- Displays new execution time (if changed)
- Execution ID remains same

### 5. Cancel Editing

**Click Cancel**
- Discards all changes
- Returns to previous settings
- Returns to details page
- No confirmation needed for unsaved changes

## Common Edit Scenarios

### Correct Message Typo
1. Open edit form
2. Find and correct typo in message body
3. Click preview to verify
4. Save changes
5. Communication executes with corrected message

### Add More Recipients
1. Upload new file with additional customers
2. Or select different audience source
3. Preview new audience size
4. Save changes
5. All new recipients included in execution

### Delay Execution
1. Change execution date/time to later
2. Can delay by hours, days, or weeks
3. Save changes
4. System reschedules automatically
5. New time shows in list and details

### Change Communication Policy
1. Add policy to respect time windows
2. Policy filters certain customers
3. Audience size decreases (filtered customers)
4. Save with new policy
5. Policy applied at execution time

### Update Message for Specific Channel
1. Change channel (e.g., Email to SMS)
2. Modify message for new channel
3. Update/remove variables as needed
4. Adjust SMS route if applicable
5. Save and reschedule if needed

## Validation Rules

### Required Fields
- **Audience:** Must have at least 1 recipient
- **Message:** Cannot be empty
- **Message Title:** Required for Email/Push
- **Execution Time:** Must be in future

### Field Constraints
- **Message Title:** Max 100 characters
- **Message Body:** Max 5000 characters
- **Audience:** Valid file format or existing quicklist
- **Execution Time:** Must not have passed

### Policy Validation
- All selected policies must be valid
- Policy can filter out all customers (warning shown)
- Minimum 1 recipient required

## Undo Changes

### Before Saving
- Click **Cancel** button
- All unsaved changes discarded
- Original settings remain

### After Saving
- Changes are permanent
- To revert:
  1. Open edit again
  2. Change back to original settings
  3. Save new changes

**Best Practice:** Take screenshot of original settings before editing

## Handling Conflicts

### Execution Time Passed
- **Error:** Scheduled time has passed
- **Solution:** Select new future date/time
- Cannot execute in past

### Audience Validation Error
- **Error:** File format invalid or ID column not found
- **Solution:** Re-upload valid file or select different column
- Preview shows issue details

### Policy Filters Everyone
- **Warning:** Selected policy filters all customers
- **Solution:** Remove policy or adjust settings
- At least 1 recipient required

## After Editing

### What Changes
- Message content (if modified)
- Audience (if changed)
- Communication policy (if updated)
- Execution time (if changed)
- SMS route (if applicable)

### What Stays the Same
- Communication ID
- Created date/user
- Previous execution history (if re-execution)

### Impact on Execution
- **Immediate:** New settings used for execution
- **Scheduled:** Changes apply at new execution time
- **No retry:** Changes don't affect already-executed communications

## Best Practices

### Before Editing
- Note current settings (take screenshot)
- Verify change is necessary
- Plan the modification

### During Editing
- Make one major change at a time
- Use preview feature to verify
- Check audience impact of policy changes

### After Editing
- Confirm successful save
- Verify execution time is correct
- Review changes in details page
- Document reason for changes

## Related Documentation

- [Manual Communications Overview](/documentation/manual-communications) - Feature overview
- [Communications List](/documentation/manual-communications-list) - View all communications
- [Create Communication](/documentation/create-manual-communication) - How to create
- [View Communication Details](/documentation/view-manual-communication) - View results
- [Communication Policies](./documentation/configuration/campaign-communication-policy-list) - Policy reference