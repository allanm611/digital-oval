# Dynamic Message Variables

Dynamic Message Variables enable personalization of messages by inserting customer data, dynamic content, or system variables into communications. They allow you to create templates that automatically populate with relevant information for each customer.

## What are Dynamic Message Variables?

Dynamic Message Variables are:
- **Placeholders** - Text placeholders that get replaced with actual values
- **Personalization Tokens** - Customer-specific data inserted into messages
- **Dynamic Content** - Variables that change based on customer context
- **Template Variables** - Reusable variables across message templates
- **Data References** - Links to customer attributes and system data

## Purpose & Benefits

### Why Use Dynamic Message Variables?

**Personalization**
- Insert customer names, addresses, account info
- Create personalized messaging
- Increase message relevance
- Improve engagement and conversion

**Efficiency**
- Create reusable message templates
- Avoid duplicate content creation
- Maintain consistent messaging
- Scale personalization across campaigns

**Dynamic Content**
- Insert content based on customer data
- Time-sensitive information
- Offer-specific details
- System-generated content

**Professional Communication**
- Maintain brand consistency
- Professional-looking messages
- Complete information inclusion
- Accurate data presentation

### Key Benefits

- **Personalization:** Individual customer messaging
- **Efficiency:** Reusable templates
- **Consistency:** Standardized variable format
- **Scalability:** Handle any customer volume
- **Flexibility:** Custom variables per need
- **Professionalism:** Polished communications

---

## Common Variable Types

### Customer Data Variables

**Personal Information**
- {{customer_name}} - Customer's full name
- {{customer_first_name}} - Customer's first name
- {{customer_last_name}} - Customer's last name
- {{customer_email}} - Customer's email address
- {{customer_phone}} - Customer's phone number

**Account Information**
- {{account_number}} - Customer's account number
- {{account_status}} - Account status (Active, Pending, etc.)
- {{account_tier}} - Customer tier (Gold, Silver, Bronze, etc.)
- {{account_balance}} - Account balance or credit
- {{account_created_date}} - Account creation date

**Contact Information**
- {{address}} - Customer's address
- {{city}} - Customer's city
- {{country}} - Customer's country
- {{postal_code}} - Customer's postal code

### Campaign/Offer Variables

**Offer Information**
- {{offer_name}} - Name of the offer
- {{offer_description}} - Offer description
- {{offer_value}} - Offer amount or percentage
- {{offer_expiration}} - Offer expiration date
- {{offer_code}} - Redemption code

**Campaign Information**
- {{campaign_name}} - Campaign name
- {{campaign_start_date}} - Campaign start date
- {{campaign_end_date}} - Campaign end date
- {{campaign_objective}} - Campaign objective

### System Variables

**Date/Time**
- {{current_date}} - Today's date
- {{current_time}} - Current time
- {{tomorrow_date}} - Tomorrow's date
- {{next_week_date}} - Date one week from now

**Dynamic Content**
- {{greeting}} - Time-based greeting (Good morning, etc.)
- {{season}} - Current season
- {{day_of_week}} - Current day of the week

---

## Managing Dynamic Message Variables

### Accessing Dynamic Message Variables

Navigate to **Configuration → Dynamic Message Variables** to manage all variable templates.

![Dynamic Message Variables List](/img/configuration/dynamicmodalgeneratorlist.png)

### View Configuration Modal

Click on any variable category or **Configure** to open the configuration modal.

![Dynamic Message Variables Modal](/img/configuration/dynamicmodalgeneratormodalexample%20.png)

### Variable Categories

Variables are organized by category:
- **Customer** - Customer personal and account data
- **Account** - Account-specific information
- **Offer** - Offer-related variables
- **Campaign** - Campaign-related variables
- **System** - System-generated variables

### Configure Variables

In the configuration modal, you can:
1. **Enable/Disable Variables** - Toggle each variable on/off
2. **View Field Mapping** - See how variables map to data sources
3. **Set Default Values** - Configure fallback values if data is missing
4. **Manage Categories** - Organize variables by category
5. **Document Variables** - Add descriptions for each variable

---

## Using Dynamic Message Variables in Messages

### Syntax

Insert variables using the following syntax:

```
{{variable_name}}
```

**Examples:**
- "Hello {{customer_first_name}}, thanks for being a {{account_tier}} member!"
- "Your {{offer_name}} is valid until {{offer_expiration}}."
- "Good {{greeting}}, {{customer_name}}!"

### Creating Message Template

**Step 1: Write Base Message**
```
Dear {{customer_first_name}},

Your offer {{offer_name}} is available exclusively for you.
Value: {{offer_value}}
Expires: {{offer_expiration}}

Use code {{offer_code}} to redeem.

Best regards,
Your Account Team
```

**Step 2: System Replaces Variables**
```
Dear John,

Your offer Premium Discount 20% is available exclusively for you.
Value: 20% off
Expires: December 31, 2025

Use code PREM20 to redeem.

Best regards,
Your Account Team
```

**Step 3: Message Sent to Customer**
- Each customer receives personalized message
- Variables replaced with their specific data
- Professional, complete communication delivered

### Variable Replacement Rules

**When Data Exists:**
- Variable is replaced with actual value
- Customer receives complete, personalized message

**When Data is Missing:**
- Default value is used (if configured)
- Empty/blank value is shown (if no default)
- Message still sends (doesn't fail)

**Case Sensitivity:**
- Variable names are case-sensitive
- {{customer_name}} ≠ {{Customer_Name}}
- Use exact syntax from variable list

---

## Best Practices

### Message Template Design

1. **Use Relevant Variables** - Only include variables that add value
2. **Graceful Degradation** - Set defaults for optional variables
3. **Clear Syntax** - Use correct variable syntax
4. **Test Templates** - Preview with sample data before sending
5. **Brand Consistency** - Maintain brand voice while personalizing

### Variable Usage

1. **Appropriate Context** - Use variables in relevant context
2. **Data Quality** - Ensure customer data is accurate
3. **Privacy Considerations** - Don't share sensitive data
4. **Professional Tone** - Keep tone professional despite personalization
5. **Avoid Over-Personalization** - Don't use every variable available

### Template Management

1. **Document Variables** - Document which variables you use
2. **Test Edge Cases** - Test with missing or unusual data
3. **Version Control** - Track template versions
4. **Regular Updates** - Update templates seasonally or regularly
5. **Team Communication** - Inform team of variable changes

---

## Common Use Cases

### Use Case 1: Personalized Welcome Email

**Template:**
```
Subject: Welcome {{customer_first_name}}!

Dear {{customer_first_name}},

Welcome to our {{account_tier}} membership program!

Your account number is {{account_number}}.
Account created on {{account_created_date}}.

As a {{account_tier}} member, enjoy exclusive benefits and offers.

Get started: [link]

Best regards,
The Team
```

### Use Case 2: Offer Notification

**Template:**
```
{{customer_first_name}}, special offer for you!

{{offer_name}}: {{offer_value}} off
Valid until {{offer_expiration}}

Use code: {{offer_code}}

Don't miss out!
[Redeem Now]
```

### Use Case 3: Account Status Update

**Template:**
```
Hello {{customer_first_name}},

Your account status update:
Account: {{account_number}}
Current Status: {{account_status}}
Balance: {{account_balance}}

Last updated: {{current_date}}

[View Account]
```

### Use Case 4: Time-Based Greeting

**Template:**
```
{{greeting}}, {{customer_first_name}}!

Hope you're having a great {{day_of_week}}.

This week's exclusive offer: {{offer_name}}

[Learn More]
```

---

## Troubleshooting

### Variable Not Replacing

**Issue:** Variable appears as {{variable_name}} in sent message

**Solutions:**
- Verify exact spelling matches variable list
- Check for extra spaces: {{customer_name }} vs {{customer_name}}
- Verify variable is enabled in configuration
- Ensure data field is populated for customer
- Test with customer that has the data

### Missing Data for Variable

**Issue:** Variable field is empty in customer record

**Solutions:**
- Set default value in variable configuration
- Update customer data before sending
- Remove variable from template if not critical
- Use conditional logic if available

### Special Characters in Variable

**Issue:** Variable contains special characters that break formatting

**Solutions:**
- Use HTML encoding if sending HTML emails
- Test with data containing special characters
- Escape characters if needed in template
- Consider alternative variable if issues persist

---

## Variable Reference

### Available Variables by Category

**Customer Information**
- {{customer_name}}
- {{customer_first_name}}
- {{customer_last_name}}
- {{customer_email}}
- {{customer_phone}}

**Account Details**
- {{account_number}}
- {{account_status}}
- {{account_tier}}
- {{account_balance}}
- {{account_created_date}}

**Location Information**
- {{address}}
- {{city}}
- {{country}}
- {{postal_code}}

**Offer/Campaign**
- {{offer_name}}
- {{offer_value}}
- {{offer_code}}
- {{offer_expiration}}
- {{campaign_name}}

**System**
- {{current_date}}
- {{current_time}}
- {{greeting}}
- {{day_of_week}}

---

## Related Documentation

- [Message Templates](/documentation/configuration/creative-templates)
- [Campaign Creation](/documentation/campaigns/create-campaign)
- [Manual Communications](/documentation/manual-actions/manual-communications)

