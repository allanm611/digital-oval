# Create Server

Create Server adds a new server endpoint used by infrastructure-dependent flows.

![Create Server - Basic Information](/img/infrastructure/addserverbasicinfoimage1.png)

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

![Create Server - Connection Settings and Health Checks](/img/infrastructure/addserverconnectionsettingsandhealthchecks.png)
![Create Server - Circuit Breaker](/img/infrastructure/addservercircuitbreaker.png)
![Create Server - Advanced and TLS](/img/infrastructure/adserveradvancedand tls.png)

## Save Behavior

If required fields are missing, save is blocked until fixed. On success, the server appears in Servers List.
