import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Grid,
  List as ListIcon,
  FileText,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { button, color, tw } from "../../../shared/utils/utils";
import SegmentListModal, {
  SegmentListFormValues,
} from "../components/SegmentListModal";
import { MOCK_QUICKLISTS } from "../components/QuickListPickerModal";
import { useLanguage } from "../../../contexts/LanguageContext";

interface SegmentList {
  list_id: number;
  name: string;
  description: string;
  subscriber_count: number;
  created_on: string;
  list_type: "seed" | "and" | "standard";
  tags?: string[];
  subscriber_id_col_name?: string;
  file_delimiter?: string;
  list_headers?: string;
  file_text?: string;
  file_name?: string;
  file_size?: number;
}

export default function SegmentListPage() {
  const { t } = useLanguage();
  const [lists, setLists] = useState<SegmentList[]>([]);
  const [filteredLists, setFilteredLists] = useState<SegmentList[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingList, setEditingList] = useState<SegmentList | null>(null);
  const [modalInitialData, setModalInitialData] = useState<
    SegmentListFormValues | undefined
  >(undefined);

  // Convert MOCK_QUICKLISTS to SegmentList format
  const mockLists: SegmentList[] = MOCK_QUICKLISTS.map((quicklist) => ({
    list_id: quicklist.id,
    name: quicklist.name,
    description: quicklist.description || "",
    subscriber_count: quicklist.row_count,
    created_on: quicklist.created_at.split("T")[0], // Extract date part
    list_type: "standard" as const,
    tags: [quicklist.upload_type],
  }));

  useEffect(() => {
    loadLists();
  }, []);

  useEffect(() => {
    filterLists();
  }, [searchQuery, lists]);

  const loadLists = async () => {
    // Since we're using dummy data, no need for loading state
    setLists(mockLists);
  };

  const filterLists = () => {
    if (!searchQuery.trim()) {
      setFilteredLists(lists);
      return;
    }

    const filtered = lists.filter(
      (list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        list.tags?.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        )
    );
    setFilteredLists(filtered);
  };

  const openCreateModal = () => {
    setModalMode("create");
    setEditingList(null);
    setModalInitialData(undefined);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingList(null);
    setModalInitialData(undefined);
  };

  const handleModalSubmit = (formData: SegmentListFormValues) => {
    if (modalMode === "edit" && editingList) {
      setLists((prev) =>
        prev.map((list) =>
          list.list_id === editingList.list_id
            ? {
                ...list,
                name: formData.list_label,
                description: formData.list_description,
                list_type: formData.list_type,
                tags: list.tags,
                subscriber_id_col_name: formData.subscriber_id_col_name,
                file_delimiter: formData.file_delimiter,
                list_headers: formData.list_headers,
                file_text: formData.file_text || list.file_text,
                file_name: formData.file_name || list.file_name,
                file_size: formData.file_size || list.file_size,
              }
            : list
        )
      );
      closeModal();
      return;
    }

    const rowCount = formData.file_text
      ? formData.file_text.split(/\r?\n/).filter((line, index) => {
          if (!line.trim()) return false;
          return formData.list_headers ? index > 0 : true;
        }).length
      : 0;

    const newList: SegmentList = {
      list_id: Date.now(),
      name: formData.list_label || t.segmentList.createNewList,
      description: formData.list_description,
      subscriber_count: rowCount,
      created_on: new Date().toISOString(),
      list_type: formData.list_type,
      tags: [],
      subscriber_id_col_name: formData.subscriber_id_col_name,
      file_delimiter: formData.file_delimiter,
      list_headers: formData.list_headers,
      file_text: formData.file_text,
      file_name: formData.file_name,
      file_size: formData.file_size,
    };

    setLists((prev) => [newList, ...prev]);
    closeModal();
  };

  const handleViewList = (list: SegmentList) => {
    console.log("Viewing list:", list);
    // TODO: Implement view functionality
  };

  const handleEditList = (list: SegmentList) => {
    setModalMode("edit");
    setEditingList(list);
    setModalInitialData({
      list_id: list.list_id,
      list_label: list.name,
      list_description: list.description,
      list_type: list.list_type,
      subscriber_id_col_name: list.subscriber_id_col_name || "",
      file_delimiter: list.file_delimiter || ",",
      list_headers: list.list_headers || "",
      file_text: list.file_text || "",
      file_name: list.file_name,
      file_size: list.file_size,
    });
    setIsModalOpen(true);
  };

  const handleDeleteList = (listId: number) => {
    setLists((prev) => prev.filter((list) => list.list_id !== listId));
  };

  const getListTypeColor = (type: string) => {
    switch (type) {
      case "seed":
        return `bg-[${color.status.warning}]/10 text-[${color.status.warning}]`;
      case "and":
        return `bg-[${color.primary.accent}]/10 text-[${color.primary.accent}]`;
      case "standard":
        return `bg-[${color.status.success}]/10 text-[${color.status.success}]`;
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getListTypeLabel = (type: string) => {
    switch (type) {
      case "seed":
        return t.segmentList.listTypeSeed;
      case "and":
        return t.segmentList.listTypeAnd;
      case "standard":
        return t.segmentList.listTypeStandard;
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            {t.segmentList.title}
          </h1>
          <p className={`text-sm ${tw.textSecondary} mt-1`}>
            {t.segmentList.description}
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className={`inline-flex items-center text-sm font-medium text-white ${tw.rounded} focus:outline-none focus:ring-2 focus:ring-offset-2`}
          style={{
            backgroundColor: button.action.background,
            color: button.action.color,
            borderRadius: button.action.borderRadius,
            padding: `${button.action.paddingY} ${button.action.paddingX}`,
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t.segmentList.createNewList}
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder={t.segmentList.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[${color.primary.accent}] focus:border-[${color.primary.accent}]`}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`rounded transition-colors ${
              viewMode === "grid" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "grid"
                ? {
                    backgroundColor: button.activeIconDisplay.background,
                    color: button.activeIconDisplay.color,
                    padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                    borderRadius: button.activeIconDisplay.borderRadius,
                  }
                : { padding: "0.5rem" }
            }
            title={t.segmentList.gridView}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`rounded transition-colors ${
              viewMode === "list" ? "" : "text-gray-500 hover:text-gray-700"
            }`}
            style={
              viewMode === "list"
                ? {
                    backgroundColor: button.activeIconDisplay.background,
                    color: button.activeIconDisplay.color,
                    padding: `${button.activeIconDisplay.paddingY} ${button.activeIconDisplay.paddingX}`,
                    borderRadius: button.activeIconDisplay.borderRadius,
                  }
                : { padding: "0.5rem" }
            }
            title={t.segmentList.listView}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lists Display */}
      {filteredLists.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className={`text-lg font-medium ${tw.textPrimary} mb-2`}>
            {t.segmentList.noListsFound}
          </h3>
          <p className={`text-sm ${tw.textSecondary} mb-4`}>
            {searchQuery
              ? t.segmentList.noListsMatchSearch
              : t.segmentList.getStartedCreateFirst}
          </p>
          {!searchQuery && (
            <button
              onClick={openCreateModal}
              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} transition-colors`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t.segmentList.createYourFirstList}
            </button>
          )}
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "space-y-4"
          }
        >
          {filteredLists.map((list) => (
            <div
              key={list.list_id}
              className={`bg-white ${
                tw.rounded
              } p-6 hover:shadow-md transition-shadow ${
                viewMode === "list" ? "flex items-center justify-between" : ""
              }`}
            >
              {viewMode === "grid" ? (
                <>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3
                        className={`text-lg font-semibold ${tw.textPrimary} mb-1`}
                      >
                        {list.name}
                      </h3>
                      <p className={`text-sm ${tw.textSecondary} mb-2`}>
                        {list.description}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getListTypeColor(
                        list.list_type
                      )}`}
                    >
                      {getListTypeLabel(list.list_type)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {t.segmentList.subscribers}
                      </span>
                      <span className={`font-semibold ${tw.textPrimary}`}>
                        {formatNumber(list.subscriber_count)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${tw.textSecondary}`}>
                        {t.segmentList.created}
                      </span>
                      <span className={`text-sm ${tw.textPrimary}`}>
                        {formatDate(list.created_on)}
                      </span>
                    </div>

                    {list.tags && list.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {list.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleViewList(list)}
                      className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                      title="View List"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditList(list)}
                      className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                      title="Edit List"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.list_id)}
                      className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                      title="Delete List"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div> */}
                </>
              ) : (
                <>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`${tw.cardHeading} ${tw.textPrimary}`}>
                        {list.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getListTypeColor(
                          list.list_type
                        )}`}
                      >
                        {getListTypeLabel(list.list_type)}
                      </span>
                    </div>
                    <p
                      className={`${tw.cardSubHeading} ${tw.textSecondary} mb-2`}
                    >
                      {list.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={`${tw.textSecondary}`}>
                        {t.segmentList.subscribersCount.replace(
                          "{count}",
                          formatNumber(list.subscriber_count)
                        )}
                      </span>
                      <span className={`${tw.textSecondary}`}>
                        {t.segmentList.createdDate.replace(
                          "{date}",
                          formatDate(list.created_on)
                        )}
                      </span>
                    </div>
                    {list.tags && list.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {list.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleViewList(list)}
                      className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                      title="View List"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEditList(list)}
                      className={`p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 ${tw.rounded} transition-all duration-200`}
                      title="Edit List"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteList(list.list_id)}
                      className={`p-2 text-red-600 hover:text-red-700 hover:bg-red-50 ${tw.rounded} transition-all duration-200`}
                      title="Delete List"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div> */}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <SegmentListModal
        isOpen={isModalOpen}
        mode={modalMode}
        initialData={modalInitialData}
        onClose={closeModal}
        onSubmit={handleModalSubmit}
        submitLabel={
          modalMode === "create"
            ? t.segmentList.createList
            : t.segmentList.saveChanges
        }
      />
    </div>
  );
}
