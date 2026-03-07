import { Segment } from "../types/segment";

/**
 * Check if segment can be paused
 * Conditions: Must be active and not already paused
 */
export function canPauseSegment(segment: Segment | undefined): boolean {
  if (!segment) return false;
  return segment.is_active === true;
}

/**
 * Check if segment can be resumed/activated
 * Conditions: Must be inactive
 */
export function canActivateSegment(segment: Segment | undefined): boolean {
  if (!segment) return false;
  return segment.is_active === false;
}

/**
 * Check if segment can be deleted
 * Conditions: Can always be deleted (soft delete)
 */
export function canDeleteSegment(segment: Segment | undefined): boolean {
  if (!segment) return false;
  return true;
}

/**
 * Check if segment can be duplicated
 * Conditions: Can always be duplicated
 */
export function canDuplicateSegment(segment: Segment | undefined): boolean {
  if (!segment) return false;
  return true;
}

/**
 * Check if segment can be refreshed
 * Conditions: Can always be refreshed
 */
export function canRefreshSegment(segment: Segment | undefined): boolean {
  if (!segment) return false;
  return true;
}
