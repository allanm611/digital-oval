import { SegmentConditionGroup } from "../types/segment";

export const getSelectedSegmentId = (
  currentEditingCondition: { groupId: string; conditionId: string } | null,
  conditions: SegmentConditionGroup[]
): number | undefined => {
  if (!currentEditingCondition) return undefined;

  return conditions
    .find((g) => g.id === currentEditingCondition.groupId)
    ?.conditions.find((c) => c.id === currentEditingCondition.conditionId)
    ?.segment_id;
};

export const getSelectedQuickListId = (
  currentEditingCondition: { groupId: string; conditionId: string } | null,
  conditions: SegmentConditionGroup[]
): number | undefined => {
  if (!currentEditingCondition) return undefined;

  return conditions
    .find((g) => g.id === currentEditingCondition.groupId)
    ?.conditions.find((c) => c.id === currentEditingCondition.conditionId)
    ?.list_id;
};

export const filterQuickListOptions = (
  quickListOptions: Array<{
    id: number;
    name: string;
    description?: string;
    upload_type: string;
    row_count: number;
    created_at: string;
  }>,
  searchTerm: string,
  filterValue: string
): Array<{
  id: number;
  name: string;
  description?: string;
  upload_type: string;
  row_count: number;
  created_at: string;
}> => {
  return quickListOptions.filter((quicklist) => {
    const matchesSearch =
      quicklist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quicklist.description?.toLowerCase() || "").includes(
        searchTerm.toLowerCase()
      );

    if (filterValue === "all") return matchesSearch;

    return matchesSearch && quicklist.upload_type === filterValue;
  });
};
