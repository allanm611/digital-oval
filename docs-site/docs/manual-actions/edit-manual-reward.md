# Edit Manual Reward

## Overview

Edit a scheduled manual reward to modify its settings before application. Only scheduled rewards that haven't been applied yet can be edited.

## When You Can Edit

**Editable Rewards:**
- Status: **Scheduled** (awaiting application)
- Application time has not been reached
- No customers have received reward yet

**Not Editable:**
- **Applied** rewards (already given)
- **Pending** rewards (currently applying)
- **Failed** rewards (already attempted)
- Rewards past their scheduled time

## How to Access Edit

**From Rewards List**
1. Navigate to **Manual Actions → Manual Rewards**
2. Find the scheduled reward
3. Click **Edit** button
4. Edit form opens with current settings pre-filled

**From Details Page**
1. View reward details
2. Click **Edit Reward** button
3. Edit form opens

## Editable Fields

### Step 1: Audience Settings

**Audience Source** (Editable)
- Change from File to Quicklist or vice versa
- Upload new file with different customers
- Select different quicklist
- Add more or fewer customers

**Audience Preview**
- Shows current audience
- Updated immediately after changes
- New customer count displayed
- Sample preview (first 10 rows)

### Step 2: Reward Configuration

**Reward Type** (May be Limited)
- Generally not changed (affects operations)
- Can adjust if flexibility available
- Change may require re-validation

**Reward Value** (Editable)
- Adjust amount for Bundle
- Change points count for Points reward
- Modify discount percentage/amount
- Update cashback amount

**Reward Details** (Editable)
- Update validity dates
- Modify applicable products
- Change delivery method (Cashback)
- Add/remove conditions

**Bundle Details** (if Bundle Reward)
- Select different bundle track
- Change bundle quantity
- Adjust validity period

**Points Details** (if Points Reward)
- Adjust points amount
- Change point type/category
- Update expiry date

**Discount Details** (if Discount Reward)
- Change percentage to fixed or vice versa
- Adjust discount value
- Modify applicable products
- Update validity period

**Cashback Details** (if Cashback Reward)
- Change cashback amount
- Update currency if applicable
- Modify delivery method
- Adjust availability timing

### Step 3: Communication Policy

**Policy Selection** (Editable)
- Add policies not previously applied
- Remove policies
- Change policy combination
- View new notification impact

**Policy Impact**
- Notification timing affected
- Some customers may not be notified
- Reward still applied
- Notification may be delayed

## Editing Workflow

### 1. Access Edit Form

The form shows all current settings:
- All fields pre-filled with existing values
- Current selections highlighted
- Can modify one or all fields

### 2. Make Changes

**Modify Fields as Needed**
- Update audience
- Change reward value
- Adjust validity terms
- Update policy settings
- Modify application time

**Changes are NOT saved automatically**
- Keep editing until satisfied
- Use preview features to verify changes

### 3. Preview Changes

**Reward Preview**
- See how reward appears to customers
- Check reward value and terms
- Verify benefits

**Audience Preview**
- See first 10 customers after audience change
- Check customer count
- Confirm audience quality

**Financial Impact**
- New total reward cost
- Cost per customer (if changed)
- Budget impact summary

**Notification Preview**
- How customers will be notified
- Notification timing
- Message content

### 4. Save Changes

**Review All Changes**
- Summary of modifications made
- Differences from original

**Click Save/Update**
- Changes are saved
- Reward updated
- Scheduled for new time (if modified)

**Confirmation Message**
- Shows successful update
- Displays new application time (if changed)
- Reward ID remains same

### 5. Cancel Editing

**Click Cancel**
- Discards all changes
- Returns to previous settings
- Returns to details page
- No confirmation needed for unsaved changes

## Common Edit Scenarios

### Increase Reward Value
1. Open edit form
2. Increase points amount or bundle quantity
3. Review new cost
4. Preview shows updated value
5. Save changes
6. Reward applies with new value

### Add More Customers
1. Upload new file with additional customers
2. Or select different quicklist
3. Preview shows new customer count
4. New customers added to recipients
5. Save changes

### Delay Application
1. Change application date/time to later
2. Can delay by hours, days, or weeks
3. Save changes
4. System reschedules automatically
5. New time shows in list

### Change Notification Policy
1. Add policy to control when customers are notified
2. Policy affects notification timing
3. Preview shows policy impact
4. Save with new policy
5. Policy applied at application time

### Reduce Customer List
1. Upload new file with subset of customers
2. Or select smaller quicklist
3. Preview shows reduced customer count
4. Fewer customers receive reward
5. Total cost may decrease

## Validation Rules

### Required Fields
- **Customers:** Must have at least 1 recipient
- **Reward Value:** Cannot be empty
- **Application Time:** Must be in future

### Field Constraints
- **Points Amount:** Must be positive number
- **Discount %:** 0-100 range
- **Discount Amount:** Must be positive
- **Cashback Amount:** Must be positive
- **Application Time:** Must not have passed

### Budget Validation
- Cashback rewards: Verify account balance
- Total cost: Cannot exceed limit
- Per-customer limit: Check constraints

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

### Application Time Passed
- **Error:** Scheduled time has passed
- **Solution:** Select new future date/time
- Cannot apply in past

### Audience Validation Error
- **Error:** File format invalid or no customers
- **Solution:** Re-upload valid file or select different quicklist
- Preview shows issue details

### Budget Exceeded
- **Error:** Reward cost exceeds available budget
- **Solution:** Reduce reward value or customer count
- Financial impact shown

### Policy Issues
- **Warning:** Policy blocks notification to most customers
- **Solution:** Remove policy or adjust reward
- Impact summary provided

## After Editing

### What Changes
- Reward value (if modified)
- Audience (if changed)
- Communication policy (if updated)
- Application time (if changed)
- Validity terms (if modified)

### What Stays the Same
- Reward ID
- Reward type
- Created date/user
- Previous history (if re-application)

### Impact on Application
- **Immediate:** New settings used for application
- **Scheduled:** Changes apply at new application time
- **No retry:** Changes don't affect already-applied rewards

## Best Practices

### Before Editing
- Note current settings (take screenshot)
- Verify change is necessary
- Plan the modification
- Check budget impact

### During Editing
- Make one major change at a time
- Use preview feature to verify
- Check audience impact
- Review financial impact

### After Editing
- Confirm successful save
- Verify application time is correct
- Review changes in details page
- Document reason for changes

## Related Documentation

- [Manual Rewards Overview](./manual-rewards) - Feature overview
- [Rewards List](./manual-rewards-list) - View all rewards
- [Create Reward](./create-manual-reward) - How to create
- [View Reward Details](./view-manual-reward) - View results
- [Manual Communications](./manual-communications) - Send messages to customers