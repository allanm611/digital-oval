# View System Event Details

System Event Details provides a read view of one event KPI definition.

![System Events - Basic Information](/img/v1.0/infrastructure/systemeventsdetailbasicinfo.png)
![System Events - Source Info and Operators](/img/v1.0/infrastructure/systemeventsdetailsourceinfoandopearators.png)

## What You Can Confirm Here

- event KPI identity and description
- operators used in segment/rule conditions
- source info and data mapping
- refresh/metadata context

## How To Interpret This Record

- **Name + Description**: confirm the event KPI meaning is unambiguous for users.
- **Field Type**: confirm condition logic can evaluate this event correctly.
- **Category**: confirm this KPI is correctly grouped under System Events.
- **Operators**: confirm which event checks are available during targeting.
- **Source Table + Data Source**: confirm lineage for debugging delayed or missing values.
- **Frequency**: confirm expected delay between event occurrence and KPI availability.

## Related Pages

- [System Events List](/documentation/infrastructure/system-events-list)
- [All KPIs List](/documentation/infrastructure/kpis-list)
