# SMS Routes

SMS Routes is where you manage outbound SMS gateway routes used by the platform. This page is specific to SMS routing, not the broader cross-channel communication routes screen.

![SMS Routes List](/img/v1.0/configuration/routeslist.png)

## Open The Page

Go to `Configuration -> SMS Routes`.

## What You Can Do

- view all configured SMS routes
- search routes by name or description
- create a new route
- view full route details
- edit route settings
- delete a route

## SMS Routes List

The list view shows:

- **Route Name**
- **Description**
- **Status**
- **Actions** (View, Edit, Delete)

Use search to quickly narrow down the list when many routes exist.

## Create An SMS Route

Click **Create** to open the route form.

![Create SMS Route - Basic Information](/img/v1.0/configuration/createsmsroutebasicinfo.png)

In **Basic Information**, set:

- Route Name (required)
- Gateway Type (required)
- Description
- Status

![Create SMS Route - API Configuration](/img/v1.0/configuration/createsmsapiconfig.png)

In **API Configuration**, set:

- API Endpoint (required)
- API Key (required)
- API Secret (required)

![Create SMS Route - Delivery Configuration Part 1](/img/v1.0/configuration/createsmsroutedeliveryconfigimage1.png)

![Create SMS Route - Delivery Configuration Part 2](/img/v1.0/configuration/createsmsroutedeliveryconfigimage2.png)

In **Delivery Configuration**, set:

- Sender ID (required)
- Request Method
- Request Format
- Priority (1-999)

Then click **Save Route**.

## What Key Fields Mean

These fields are important when troubleshooting delivery behavior:

- **Route Name**: Internal label for the route. 
- **Gateway Type**: The provider/integration type (e.g custom gateway). This tells operators which backend path this route represents.
- **Status**:
  Active routes are available for use.
  Inactive routes stay in the system but should not be used for active delivery.
- **API Endpoint**: Target URL used to submit SMS requests to the provider.
- **API Key / API Secret**: Credentials used to authenticate requests to the provider.
- **Sender ID**: The sender identity used for outbound SMS on this route.
- **Request Method**: HTTP method used when calling the provider API (for example `POST`, `GET`, `PUT`).
- **Request Format**: Payload format sent to the provider (for example `JSON`, `XML`, or `FORM_DATA`).
- **Priority (1-999)**: Route precedence value.
  Smaller numbers mean higher priority.
  Example: `1` is preferred before `2`, and `2` before `3`.
  Use this to control which route is tried first when multiple routes are available.

## View Route Details

Use the **View** action (eye icon) on a row to open the route details page.

![SMS Routes Details Page](/img/v1.0/configuration/smsroutesdetailpage.png)

The details page shows the route overview, basic info, API configuration, and metadata (created/updated timestamps).

## Edit An SMS Route

From either the list or details page, open **Edit**.

![Edit SMS Route](/img/v1.0/configuration/editsmsrouteimage.png)

Edit uses the same sections as create, then save changes.

## Delete An SMS Route

Use **Delete** from the list or details page. A confirmation modal appears before the route is removed.

## Validation Notes

The form enforces required values for route name, gateway type, API endpoint, API key, API secret, and sender ID.

If a required field is missing, save is blocked until the input is corrected.
