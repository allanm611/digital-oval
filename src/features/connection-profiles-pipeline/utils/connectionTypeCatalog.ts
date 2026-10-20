import {
  CONNECTION_TYPE_OPTIONS,
  formatConnectionTypeLabel,
} from "../../connection-profiles/constants/connectionTypes";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";

export function normalizeConnectionType(type?: string | null): string {
  return String(type || "").trim().toLowerCase();
}

export function connectionTypeLabel(type: string): string {
  return formatConnectionTypeLabel(type);
}

export interface ConnectionTypeOption {
  value: string;
  label: string;
  count: number;
}

/**
 * Types come from the connector catalog (the same list as the connection
 * profile form). Profile stats add types that already have profiles, plus a
 * count. The static catalog is only a fallback when both sources are empty.
 */
export function buildConnectionTypeOptions(
  catalogTypes: string[],
  stats: Array<{ connection_type?: string | null; count?: number }>,
  selectedType?: string | null,
  includeCounts = false,
): ConnectionTypeOption[] {
  const counts = new Map<string, number>();
  stats.forEach((item) => {
    const type = normalizeConnectionType(item.connection_type);
    if (!type) return;
    counts.set(type, (counts.get(type) || 0) + (Number(item.count) || 0));
  });

  const ordered: string[] = [];
  const seen = new Set<string>();
  const push = (raw?: string | null) => {
    const value = String(raw || "").trim();
    const key = normalizeConnectionType(value);
    if (!key || seen.has(key)) return;
    seen.add(key);
    ordered.push(value);
  };

  catalogTypes.forEach(push);
  stats.forEach((item) => push(item.connection_type));
  if (ordered.length === 0) {
    CONNECTION_TYPE_OPTIONS.forEach((option) => push(option.value));
  }
  push(selectedType);

  return ordered
    .map((value) => {
      const count = counts.get(normalizeConnectionType(value)) || 0;
      const label = connectionTypeLabel(value);
      return {
        value,
        count,
        label: includeCounts && count > 0 ? `${label} (${count})` : label,
      };
    })
    .sort((left, right) => {
      if (left.count !== right.count) return right.count - left.count;
      return left.label.localeCompare(right.label);
    });
}

export function canonicalConnectionType(
  selectedType: string | null | undefined,
  catalogTypes: string[],
): string {
  const selected = normalizeConnectionType(selectedType);
  if (!selected) return "";
  return (
    catalogTypes.find((type) => normalizeConnectionType(type) === selected) ||
    String(selectedType || "").trim()
  );
}

export function profileOptionLabel(
  profile: Pick<ConnectionProfileType, "profile_name" | "profile_code" | "is_active">,
): string {
  const parts = [profile.profile_name || "Unnamed profile"];
  if (profile.profile_code) parts.push(profile.profile_code);
  if (profile.is_active === false) parts.push("Inactive");
  return parts.join(" · ");
}

export function sortProfilesForSelect<
  T extends Pick<ConnectionProfileType, "profile_name" | "is_active">,
>(profiles: T[]): T[] {
  return [...profiles].sort((left, right) => {
    const leftInactive = left.is_active === false;
    const rightInactive = right.is_active === false;
    if (leftInactive !== rightInactive) return leftInactive ? 1 : -1;
    return String(left.profile_name || "").localeCompare(
      String(right.profile_name || ""),
    );
  });
}

export function mergeProfilesById(
  ...groups: ConnectionProfileType[][]
): ConnectionProfileType[] {
  const byId = new Map<number, ConnectionProfileType>();
  groups.flat().forEach((profile) => {
    if (!profile || !Number.isInteger(profile.id)) return;
    byId.set(profile.id, profile);
  });
  return Array.from(byId.values());
}

export function asProfileArray(response: unknown): ConnectionProfileType[] {
  const rows = Array.isArray(response)
    ? response
    : response &&
        typeof response === "object" &&
        Array.isArray((response as { data?: unknown }).data)
      ? (response as { data: unknown[] }).data
      : [];

  return rows.filter((row): row is ConnectionProfileType => {
    if (!row || typeof row !== "object") return false;
    const profile = row as ConnectionProfileType;
    return Number.isInteger(profile.id) && typeof profile.profile_name === "string";
  });
}

export function matchingConnectionTypeValue(
  selected: string | null | undefined,
  options: ConnectionTypeOption[],
): string {
  const key = normalizeConnectionType(selected);
  if (!key) return "";
  return (
    options.find((option) => normalizeConnectionType(option.value) === key)
      ?.value || String(selected || "").trim()
  );
}

export function profileSelectOptions(
  profiles: ConnectionProfileType[],
): Array<{ value: string; label: string }> {
  return profiles.map((profile) => ({
    value: String(profile.id),
    label: profileOptionLabel(profile),
  }));
}

export function profileFilterMessage(input: {
  connectionType: string;
  profilesLoading: boolean;
  profilesLoaded: boolean;
  isSearching: boolean;
  searchApplied: boolean;
  catalogCount: number;
  visibleCount: number;
  profilesTruncated: boolean;
}): string | null {
  if (!input.connectionType) {
    return "Choose a connection type to load matching profiles.";
  }
  if (input.isSearching || (input.profilesLoading && input.visibleCount === 0)) {
    return "Loading profiles...";
  }
  if (input.searchApplied && input.visibleCount === 0) {
    return "No profiles match that search.";
  }
  if (input.profilesLoaded && input.catalogCount === 0) {
    return "No connection profiles use this type.";
  }
  if (input.profilesTruncated && !input.searchApplied) {
    return `Showing the first ${input.catalogCount} profiles. Search by name or code to look through the rest.`;
  }
  return null;
}

export function profilesOfType(
  profiles: ConnectionProfileType[],
  connectionType: string,
): ConnectionProfileType[] {
  const type = normalizeConnectionType(connectionType);
  if (!type) return [];
  return profiles.filter(
    (profile) => normalizeConnectionType(profile.connection_type) === type,
  );
}
