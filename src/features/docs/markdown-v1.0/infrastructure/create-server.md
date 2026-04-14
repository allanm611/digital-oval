# Create Server

Create Server adds a new server endpoint used by infrastructure-dependent flows.

the system uses the same form for both **Create** and **Edit**. In Edit mode , the form is prefilled with the informaiton of the selected server.

![Create Server - Basic Information](/img/v1.0/infrastructure/addserverbasicinfoimage1.png)

## Required Fields

- **Name**: clear server label
- **Code**: unique internal code
- **Protocol**: request protocol (for endpoint construction)
- **Host**: domain or IP address

## Optional Fields And What They Do

- **Environment**: tags the server by deployment stage
- **Region**: identifies geographic location
- **Port**: overrides default protocol port
- **Base Path**: appends path segment to endpoint
- **Server Type**: classifies endpoint role
- **Timeout Seconds**: max request wait time
- **Max Retries**: retry attempts before failure
- **Health Check Enabled**: turns monitoring on/off
- **Health Check URL**: endpoint checked for health status
- **Health Check Interval Seconds**: monitoring frequency
- **Circuit Breaker Enabled**: enables fail-protection mode
- **Circuit Breaker Threshold**: failures before circuit opens
- **TLS Enabled**: transport security flag
- **Authentication Type**: auth scheme reference
- **Metadata**: additional JSON-like context for operations

## Field Meaning In Practice

- **Protocol + Host + Port + Base Path** work together to build the request target. Wrong values here create immediate connectivity failures.
- **Environment** prevents accidental cross-environment calls (for example using staging endpoints in production flows).
- **Timeout Seconds + Max Retries** define how long the platform waits and how aggressively it retries before failing.
- **Health Check Enabled + Health Check URL + Interval** control automatic availability monitoring and how quickly failures are detected.
- **Circuit Breaker settings** protect downstream systems by temporarily stopping repeated failing calls.
- **TLS Enabled + Authentication Type** describe transport and access expectations for secure integration.

<!-- ## Usage Examples

- **External billing API**: use HTTPS, enable TLS, set conservative retries, and add a health endpoint for early outage detection.
- **Internal low-latency service**: keep timeout low (for example 2-3 seconds) so upstream workflows fail fast and trigger fallback logic.
- **Unstable legacy endpoint**: enable circuit breaker with a failure threshold so repeated errors do not cascade across jobs. -->

![Create Server - Connection Settings and Health Checks](/img/v1.0/infrastructure/addserverconnectionsettingsandhealthchecks.png)
![Create Server - Circuit Breaker](/img/v1.0/infrastructure/addservercircuitbreaker.png)
![Create Server - Advanced and TLS](/img/v1.0/infrastructure/adserveradvancedandtls.png)

## Save Behavior

If required fields are missing, save is blocked until fixed. On success, the server appears in Servers List.

## Create Vs Edit (What Actually Changes)

- **Same form fields**: create and edit use the same sections and inputs.
- **Edit is pre-filled**: when editing, existing values are loaded into the form first.
- **Button text differs**: create shows `Create Server`, edit shows `Update Server`.
- **After save**: create returns to the list, while edit returns to that server's details page.

## Related Pages

- [Servers Overview](/documentation/infrastructure/servers)
- [Servers List](/documentation/infrastructure/servers-list)
- [View Server](/documentation/infrastructure/view-server)
