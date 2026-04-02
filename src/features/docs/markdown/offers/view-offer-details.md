# View Offer Details

## Overview

The Offer Details page displays complete information about a specific offer including its configuration, approval status, and available management actions.

![Offer Details Overview](/img/offer-images/offerdetailsimage1%20details.png)


## Offer Information

The top of the page displays:

**Header**
- Offer name and code
- Status badge (Draft, Active, Paused, Expired, Archived)
- Approval status badge (Pending Approval, Approved, Rejected)

**Basic Details**
- **Name** - Offer title
- **Code** - Unique identifier
- **Type** - Category (Data, Voice, SMS, Combo, Voucher, Loyalty, Discount, Bundle, Bonus, Other)
- **Description** - Full description of the offer
- **Catalog** - Assigned catalog/category
- **Max Usage Per Customer** - Redemption limit per customer

![Offer Information](/img/offer-images/offerdetailsofferinformation.png)


## Linked Products

Shows all products included in this offer with management options.

![Linked Products](/img/offer-images/offerdetailslinkedproducts.png)

### Product Information

Each linked product displays:
- **Product Name** - Name of the linked product
- **Product Type** - Category or type of product
- **Primary Badge** - Indicates if this is the primary product for the offer

### Managing Linked Products

**Add Products**
- Click **Add Products** button to link additional products to this offer
- Select products from your product library
- Multiple products can be linked to a single offer

**Set as Primary**
- Click **Set as Primary** on any product to designate it as the main product for this offer
- Only one product can be primary
- The primary product is used as the default when this offer is assigned to campaigns
- Click the toggle or primary indicator to change which product is primary

**Unlink Product**
- Click the **Unlink** or **Remove** button on any product to disconnect it from this offer
- The product itself is not deleted, only the association is removed
- You cannot unlink the primary product without first setting another product as primary


## Offer Creatives

Displays the marketing content for this offer across different channels and locales.

![Offer Creatives](/img/offer-images/offerdetailsoffercreatives.png)

### Creative Information

Each creative displays:
- **Channel** - Delivery channel (SMS, Email, Push, WhatsApp)
- **Locale** - Language/region for the creative (e.g., English, Spanish)
- **Title/Subject** - Headline or subject line for the creative
- **Message Content** - Full message body content
- **Template** - Creative template used (if any)

### Managing Creatives

**Add New Creative**
- Click **Add Creative** button at the top of the section
- Opens the Add Creative Modal with options to:
  - **Select Channel** - Choose delivery channel (SMS, Email, Push, WhatsApp)
  - **Select Locale** - Choose language/region
  - **Select Template** - Choose from available creative templates or create custom content
  - **Edit Content** - Add/modify title, message, and personalization variables
  - **Preview** - See how the creative will appear to customers
  - **Save Creative** - Save the new creative to the offer

**Edit Creative**
- Click the **Edit** button (pencil icon) on any creative
- Opens the edit modal with pre-filled content
- Modify the title, message, template, or locale
- Save changes to update the creative

**Delete Creative**
- Click the **Delete** button (trash icon) on any creative
- Confirm deletion in the confirmation modal
- Creative is permanently removed from the offer
- This does NOT delete the template, only the specific creative instance

### Creative Templates

- Creatives can use pre-designed templates from your creative templates library
- Templates provide consistent branding and formatting
- You can also create custom creatives without using a template


## Action Buttons

Action buttons at the top display based on the offer's status and your permissions:

**Submit for Approval** (Draft status)
- Submit offer for review by authorized approvers

**Approve** (Pending Approval status)
- Approve the offer to make it ready for activation

**Activate** (Approved status)
- Activate the offer to make it available for use in campaigns

**Pause** (Active status)
- Temporarily disable the offer from being used in new campaigns

**Resume** (Paused status)
- Re-enable a paused offer

**Archive**
- Move offer to archived state for record-keeping

**Unarchive** (Archived status)
- Restore an archived offer back to its previous active state

**Delete** (Draft status only)
- Permanently remove the offer

**Edit**
- Modify offer details and configuration


## Used in Campaigns

Shows all campaigns currently using this offer.

![Used in Campaigns](/img/offer-images/offerdetailsusedincampaigns.png)


## Offer Status States

- **Draft** - Offer being created, not yet submitted for approval
- **Pending Approval** - Awaiting approval from authorized reviewers
- **Approved** - Approved and ready to activate
- **Active** - Available for use in campaigns
- **Paused** - Temporarily disabled
- **Expired** - Offer expiration date has passed
- **Archived** - Inactive, preserved for reference


## Approval Workflow

Offers follow an approval workflow before they can be activated:

1. **Draft** - Create the offer
2. **Submit for Approval** - Request review
3. **Pending Approval** - Awaiting decision
4. **Approve/Reject** - Approved or rejected with feedback
5. **Approved** - Ready to activate
6. **Activate** - Make available in campaigns
