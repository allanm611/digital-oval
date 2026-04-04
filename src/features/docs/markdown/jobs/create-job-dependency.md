# Create Job Dependency

Create Job Dependency adds a new dependency rule between two jobs.

## Required Fields

- **Job ID**
- **Depends On Job ID** (must be different from Job ID)

## Optional / Config Fields

- **Dependency Type**
- **Wait For Status**
- **Max Wait Minutes**
- **Lookback Days**
- **Active** toggle

## Validation Notes

- both job IDs are required
- a job cannot depend on itself
- max wait and lookback values must stay within allowed numeric limits
