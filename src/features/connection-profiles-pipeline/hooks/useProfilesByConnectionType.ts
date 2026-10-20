import { useEffect, useMemo, useState } from "react";
import { dataConnectorService } from "../../data-connectors/services/dataConnectorService";
import { connectionProfileService } from "../../connection-profiles/services/connectionProfileService";
import { ConnectionProfileType } from "../../connection-profiles/types/connectionProfile";
import {
  asProfileArray,
  buildConnectionTypeOptions,
  canonicalConnectionType,
  ConnectionTypeOption,
  mergeProfilesById,
  normalizeConnectionType,
  profilesOfType,
  sortProfilesForSelect,
} from "../utils/connectionTypeCatalog";

const PAGE_SIZE = 100;
const MAX_PAGES = 8;
const SEARCH_RESULT_LIMIT = 50;
const EMPTY_PROFILES: ConnectionProfileType[] = [];

interface UseProfilesByConnectionTypeResult {
  typeOptions: ConnectionTypeOption[];
  typesLoading: boolean;
  profiles: ConnectionProfileType[];
  catalogProfiles: ConnectionProfileType[];
  catalogCount: number;
  profilesLoading: boolean;
  profilesLoaded: boolean;
  profilesTruncated: boolean;
  isSearching: boolean;
  searchApplied: boolean;
  onProfileSearch: (term: string) => void;
}

/**
 * Connection types are the connector catalog used by the connection profile
 * form. Profile stats add a count. Profiles are loaded for the selected
 * connection_type, then searched on the server when that list is large.
 */
export function useProfilesByConnectionType(
  connectionType: string,
  pinnedProfiles: ConnectionProfileType[] = EMPTY_PROFILES,
): UseProfilesByConnectionTypeResult {
  const type = normalizeConnectionType(connectionType);
  const [catalogTypes, setCatalogTypes] = useState<string[]>([]);
  const [stats, setStats] = useState<
    Array<{ connection_type?: string | null; count?: number }>
  >([]);
  const [includeCounts, setIncludeCounts] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [catalog, setCatalog] = useState<ConnectionProfileType[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [profilesLoaded, setProfilesLoaded] = useState(false);
  const [profilesTruncated, setProfilesTruncated] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ConnectionProfileType[] | null>(
    null,
  );
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTypes = async () => {
      setTypesLoading(true);
      const [typesResult, statsResult] = await Promise.allSettled([
        dataConnectorService.getAvailableConnectorTypes(),
        connectionProfileService.getConnectionTypeStats(true),
      ]);
      if (cancelled) return;

      if (typesResult.status === "fulfilled" && Array.isArray(typesResult.value)) {
        setCatalogTypes(typesResult.value.map((item) => String(item).trim()).filter(Boolean));
      } else {
        console.error("Failed to load connector types", typesResult);
        setCatalogTypes([]);
      }

      if (statsResult.status === "fulfilled" && Array.isArray(statsResult.value)) {
        setStats(statsResult.value);
        setIncludeCounts(true);
      } else {
        console.error("Failed to load connection type stats", statsResult);
        setStats([]);
        setIncludeCounts(false);
      }
      setTypesLoading(false);
    };
    loadTypes();
    return () => {
      cancelled = true;
    };
  }, []);

  const apiType = useMemo(() => {
    const fromCatalog = canonicalConnectionType(type, catalogTypes);
    if (fromCatalog) return fromCatalog;
    const match = stats.find(
      (item) => normalizeConnectionType(item.connection_type) === type,
    );
    return String(match?.connection_type || "").trim() || type;
  }, [catalogTypes, stats, type]);

  useEffect(() => {
    setSearchTerm("");
    setSearchResults(null);
    setIsSearching(false);
  }, [type]);

  useEffect(() => {
    if (!apiType) {
      setCatalog([]);
      setProfilesTruncated(false);
      setProfilesLoading(false);
      setProfilesLoaded(false);
      return;
    }

    let cancelled = false;
    const loadProfiles = async () => {
      setProfilesLoading(true);
      setProfilesLoaded(false);
      setProfilesTruncated(false);
      setCatalog([]);
      try {
        let collected: ConnectionProfileType[] = [];
        let truncated = false;
        for (let page = 0; page < MAX_PAGES; page += 1) {
          const response = await connectionProfileService.getProfilesByConnectionType(
            apiType,
            {
              limit: PAGE_SIZE,
              offset: page * PAGE_SIZE,
              skipCache: true,
            },
          );
          if (cancelled) return;
          const batch = profilesOfType(asProfileArray(response), type);
          const before = collected.length;
          collected = mergeProfilesById(collected, batch);
          if (batch.length === 0 || collected.length === before) break;
          if (batch.length < PAGE_SIZE) break;
          if (page === MAX_PAGES - 1) truncated = true;
        }
        if (cancelled) return;
        setCatalog(sortProfilesForSelect(collected));
        setProfilesTruncated(truncated);
        setProfilesLoaded(true);
      } catch (error) {
        console.error("Failed to load profiles for connection type", error);
        if (!cancelled) {
          setCatalog([]);
          setProfilesTruncated(false);
          setProfilesLoaded(false);
        }
      } finally {
        if (!cancelled) setProfilesLoading(false);
      }
    };
    loadProfiles();
    return () => {
      cancelled = true;
    };
  }, [apiType, type]);

  useEffect(() => {
    const term = searchTerm.trim();
    if (!type || term.length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsSearching(true);
      try {
        const byName = await connectionProfileService.searchProfiles({
          connection_type: apiType,
          profile_name: term,
          limit: SEARCH_RESULT_LIMIT,
          skipCache: true,
        });
        if (cancelled) return;
        let rows = profilesOfType(asProfileArray(byName), type);
        if (rows.length === 0) {
          const byCode = await connectionProfileService.searchProfiles({
            connection_type: apiType,
            profile_code: term,
            limit: SEARCH_RESULT_LIMIT,
            skipCache: true,
          });
          if (cancelled) return;
          rows = profilesOfType(asProfileArray(byCode), type);
        }
        setSearchResults(sortProfilesForSelect(rows));
      } catch (error) {
        console.error("Failed to search connection profiles", error);
        if (!cancelled) setSearchResults([]);
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiType, searchTerm, type]);

  const typeOptions = useMemo(
    () => buildConnectionTypeOptions(catalogTypes, stats, connectionType, includeCounts),
    [catalogTypes, connectionType, includeCounts, stats],
  );

  const pinned = useMemo(
    () => profilesOfType(pinnedProfiles, type),
    [pinnedProfiles, type],
  );

  const catalogProfiles = useMemo(
    () => sortProfilesForSelect(mergeProfilesById(catalog, pinned)),
    [catalog, pinned],
  );

  const profiles = useMemo(
    () =>
      sortProfilesForSelect(
        mergeProfilesById(searchResults ?? catalog, pinned),
      ),
    [catalog, pinned, searchResults],
  );

  return {
    typeOptions,
    typesLoading,
    profiles,
    catalogProfiles,
    catalogCount: catalog.length,
    profilesLoading,
    profilesLoaded,
    profilesTruncated,
    isSearching,
    searchApplied: searchResults !== null,
    onProfileSearch: setSearchTerm,
  };
}
