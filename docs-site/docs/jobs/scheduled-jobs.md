---
title: Scheduled Jobs
---

import { EditButton } from '@site/src/components/EditButton';

# Scheduled Jobs

## Overview

Scheduled Jobs are automated tasks that run according to a predefined schedule or trigger. They manage the execution of workflows, data pipelines, campaigns, and business processes on a recurring or event-driven basis.

## Key Features

### Scheduling Options
- **Manual** - Trigger jobs on-demand
- **Cron** - Custom schedules using cron expressions (daily, weekly, etc.)
- **Interval** - Repeat every N seconds
- **Event Driven** - Trigger when specific events occur
- **Dependency Based** - Trigger based on completion of other jobs

### Job Management
- Create and manage multiple scheduled jobs
- Define job execution parameters and settings
- Monitor job execution history
- Track job performance and health

### Execution Control
- Manual execution triggering
- Pause and resume job schedules
- Set execution windows (allowed time periods)
- Blackout dates (dates when job shouldn't run)
- Maximum concurrent executions limiting

### Performance & Reliability
- Execution timeout configuration
- Retry on failure with configurable attempts
- Circuit breaker to prevent cascading failures
- SLA monitoring and breach alerts
- Performance baseline tracking

### Dependencies & Triggers
- Define dependencies on other jobs
- Trigger downstream jobs on success
- Trigger error handling jobs on failure
- Dependency modes (AND, OR, ALL)

### Resource Management
- Specify resource pool requirements
- Set memory and CPU limits
- Priority-based execution queuing
- Rate limiting and throttling

### Monitoring & Alerts
- Real-time execution status monitoring
- Alert on job failures
- SLA breach notifications
- Success/failure metrics tracking
- Consecutive failure detection

## Scheduled Job Statuses

### Status Lifecycle
- **Draft** - Job configuration not yet complete or not activated
- **Active** - Job is operational and executing per schedule
- **Paused** - Job execution temporarily stopped
- **Archived** - Job is no longer in use but retained for history
- **Deleted** - Job permanently removed from system

## Schedule Types Explained

### Manual
- Jobs triggered explicitly by users
- No automatic scheduling
- Use case: On-demand reports, manual data fixes

### Cron Expression
- Standard Unix cron format
- Examples:
  - `0 0 * * *` - Daily at midnight
  - `0 9 * * MON-FRI` - Weekdays at 9 AM
  - `*/30 * * * *` - Every 30 minutes

### Interval
- Run every N seconds
- Examples: Every 300 seconds (5 minutes), every 3600 seconds (1 hour)
- Use case: Polling, heartbeat checks, continuous data ingestion

### Event Driven
- Triggered by system or business events
- Examples: User signup, purchase completed, data imported
- Use case: Real-time reactions to business events

### Dependency Based
- Run when other jobs complete
- Multiple dependency modes (AND, OR, ALL)
- Use case: Sequential processing pipelines

## Key Metrics

**Execution Metrics**
- Total executions count
- Success rate percentage
- Last execution timestamp
- Next scheduled execution
- Consecutive failures count

**Performance Metrics**
- Average execution duration
- Execution timeout minutes
- Performance baseline seconds
- SLA duration minutes

**Health Indicators**
- Current status (running, queued, failed)
- SLA breach status
- Stale job detection (not run recently)
- Failed execution tracking

## Available Actions

- **View Details** - See job configuration and execution history
- **Create Job** - Add new scheduled job
- **Edit Job** - Modify job settings
- **Execute Now** - Trigger immediate execution
- **Pause** - Temporarily stop job execution
- **Resume** - Resume paused job
- **View Analytics** - Monitor performance metrics
- **Clone** - Duplicate job configuration
- **Delete** - Remove job

<EditButton docSlug="jobs/scheduled-jobs" docTitle="Scheduled Jobs" />
