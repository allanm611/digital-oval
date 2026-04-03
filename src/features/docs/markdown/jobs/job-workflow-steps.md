---
title: Job Workflow Steps
---

# Job Workflow Steps

## Overview

Job Workflow Steps are individual units of work within a job workflow. Each step represents a specific action.

---

## Step Types

- **SQL** - Execute SQL queries against databases
- **Stored Procedure** - Call database stored procedures
- **API Call** - Call external REST APIs
- **Python Script** - Execute Python code
- **Node.js Script** - Run Node.js code
- **Shell Script** - Execute shell commands
- **File Transfer** - Move/copy files between systems
- **Data Validation** - Validate data quality
- **Notification** - Send alerts and messages
- **Wait** - Pause execution for specified time

---

## Filters

- **Step Type** - Filter by step type
- **Job ID** - Filter by job
- **Search** - Search by step name

---

## Execution Control

**Parallel Execution**
- Run steps simultaneously via parallel_group_id

**Sequential Execution**
- Steps run one after another (default)

---

## Failure Handling

- **Abort** - Stop entire workflow on failure
- **Continue** - Continue to next step on failure
- **Retry** - Automatically retry failed step
- **Skip Remaining** - Skip remaining steps on failure

---

## Statistics

- **Total Steps** - Total number of steps
- **Active Steps** - Number of active steps
- **Critical Steps** - Number of critical steps
- **Steps with Retry** - Steps with retry configured
- **Steps with Validation** - Steps with validation enabled
- **Parallel Groups** - Number of parallel execution groups

---

## Actions

**Individual Step Actions:**
- **View** - See step details
- **Edit** - Modify step settings
- **Clone** - Duplicate step
- **Delete** - Remove step
- **Validate** - Test step configuration

**Batch Actions:**
- **Pause/Resume** - Bulk pause or resume multiple steps
- **Reorder** - Change execution sequence for multiple steps
- **Update** - Batch update step configuration (active status, critical flag, timeout, retry count, failure action)
- **Delete All** - Delete all steps for a job

