import {
  useEffect,
  useMemo,
  useState,
  useCallback,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import { Eye, AlertTriangle } from "lucide-react";
import { tw, color } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import Pagination, { DEFAULT_PAGE_SIZE } from "../../../shared/components/ui/Pagination";
import { Table, useTable, type TableColumn } from "../../../shared/components/Table";
import { customerIdentityService } from "../services/customerIdentityService";
import { CustomerIdentityField } from "../types/customerIdentity";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import { useLanguage } from "../../../contexts/LanguageContext";
import { PermissionGate } from "../../auth/components/PermissionGate";
import SearchInput from "../../../shared/components/ui/SearchInput";

export default function CustomerIdentityPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [fields, setFields] = useState<CustomerIdentityField[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedFieldType, setSelectedFieldType] = useState<string>("all");
  const [showColumnPicker, setShowColumnPicker] = useState(false);

  // Always skip cache on load and retry
  const loadFields = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data =
        await customerIdentityService.getCustomerIdentityFields(true);
      setFields(data);
    } catch (err) {
      console.error("Failed to load customer identity fields", err);
      const message =
        err instanceof Error
          ? err.message
          : t.customerIdentity.unableToLoadFields;
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [t.customerIdentity.unableToLoadFields]);

  useEffect(() => {
    loadFields();
  }, [loadFields]);

  const availableFieldTypes = useMemo(() => {
    const uniqueTypes = Array.from(
      new Set(
        fields
          .map((field) => field.field_type)
          .filter(Boolean),
      ),
    );
    return uniqueTypes.sort((a, b) => a.localeCompare(b));
  }, [fields]);

  const filteredFields = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return fields.filter((field) => {
      const matchesSearch =
        search.length === 0 ||
        (field.field_name || "").toLowerCase().includes(search) ||
        (field.field_value || "").toLowerCase().includes(search) ||
        (field.description || "").toLowerCase().includes(search) ||
        (field.source_table || "").toLowerCase().includes(search);

      const fieldTypeValue = field.field_type;
      const matchesType =
        selectedFieldType === "all" ||
        (fieldTypeValue && fieldTypeValue.toLowerCase() === selectedFieldType.toLowerCase());

      return matchesSearch && matchesType;
    });
  }, [fields, searchTerm, selectedFieldType]);

  const hasNoFields = useMemo(() => {
    if (isLoading) return false;
    return fields.length === 0;
  }, [fields.length, isLoading]);

  const hasNoFilteredResults = useMemo(() => {
    if (isLoading || hasNoFields) return false;
    return filteredFields.length === 0;
  }, [filteredFields.length, hasNoFields, isLoading]);

  const tableColumns: TableColumn<CustomerIdentityField>[] = [
    {
      id: "id",
      label: t.customerIdentity.id,
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <button
          type="button"
          onClick={() =>
            navigate(
              `/dashboard/customer-identity/fields/${row.id}`,
              {
                state: { field: row },
              },
            )
          }
          className="font-semibold hover:underline text-sm"
          style={{ color: color.primary.accent }}
        >
          {row.id}
        </button>
      ),
    },
    {
      id: "field_name",
      label: t.customerIdentity.fieldName,
      visible: true,
      sortable: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <span className="text-sm text-gray-900 font-medium">
          {row.field_name}
        </span>
      ),
    },
    {
      id: "field_type",
      label: t.customerIdentity.fieldType,
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <span className="text-sm text-gray-700">
          {row.field_type || "—"}
        </span>
      ),
    },
    {
      id: "source_table",
      label: t.customerIdentity.sourceTable,
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <span className="text-sm text-gray-700">
          {row.source_table || "—"}
        </span>
      ),
    },
    {
      id: "description",
      label: t.customerIdentity.descriptionLabel,
      visible: true,
      filterConfig: { type: 'text' },
      render: (_, row) => (
        <span className="text-sm text-gray-600">
          {row.description || "—"}
        </span>
      ),
    },
    {
      id: "actions",
      label: t.customerIdentity.actions,
      visible: true,
      sortable: false,
      render: (_, row) => (
        <button
          type="button"
          onClick={() =>
            navigate(
              `/dashboard/customer-identity/fields/${row.id}`,
              {
                state: { field: row },
              },
            )
          }
          className={`p-2 icon-edit ${tw.rounded} text-black transition-colors hover:bg-gray-100`}
          title={t.customerIdentity.viewDetails}
        >
          <Eye className="h-4 w-4" />
        </button>
      ),
    },
  ];

  const {
    columns,
    currentPage: tableCurrentPage,
    pageSize: tablePageSize,
    handlePageChange: tableHandlePageChange,
    handlePageSizeChange: tableHandlePageSizeChange,
    sortConfigs,
    handleSort,
    toggleColumn,
  } = useTable({
    tableId: "customer-identity-table",
    defaultColumns: tableColumns,
    persistToLocalStorage: true,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    tableHandlePageChange(1);
  }, [searchTerm, selectedFieldType, tableHandlePageChange]);

  return (
    <PermissionGate permission="customer-identity.read">
      <div className="space-y-6">
        <div>
          <h1 className={`${tw.mainHeading} text-gray-900`}>
            {t.customerIdentity.title}
          </h1>
          <p className={`${tw.textSecondary} mt-2 text-sm`}>
            {t.customerIdentity.description}
          </p>
        </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="w-full md:flex-1">
          <SearchInput
            value={searchTerm}
            onChange={(value) => setSearchTerm(value)}
            placeholder={t.customerIdentity.searchFields}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <HeadlessSelect
            options={[
              { value: "all", label: t.customerIdentity.allFieldTypes },
              ...availableFieldTypes.map((type) => ({
                value: type,
                label: type.charAt(0).toUpperCase() + type.slice(1),
              })),
            ]}
            value={selectedFieldType}
            onChange={(value) => setSelectedFieldType(value as string)}
            placeholder={t.customerIdentity.filterByFieldType}
            className="sm:min-w-[200px]"
          />
        </div>
      </div>

      <div className="space-y-4">
        {(isLoading || error || hasNoFields || hasNoFilteredResults) && (
          <div
            className={`border ${tw.rounded} p-6`}
            style={{
              borderColor: color.border.default,
              backgroundColor: color.surface.background,
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner variant="modern" size="lg" color="primary" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <AlertTriangle className="h-10 w-10 text-red-500" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {t.customerIdentity.unableToLoadFields}
                  </h3>
                  <p className={`${tw.textSecondary} mt-2`}>{error}</p>
                </div>
                <button
                  type="button"
                  onClick={loadFields}
                  className={`px-4 py-2 text-sm font-semibold text-white ${tw.rounded} hover:opacity-95 transition-colors`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  {t.customerIdentity.retry}
                </button>
              </div>
            ) : hasNoFields ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.customerIdentity.noFieldsAvailable}
                </h3>
                <p className={`${tw.textSecondary}`}>
                  {t.customerIdentity.noFieldsConfigured}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.customerIdentity.noMatchingFields}
                </h3>
                <p className={`${tw.textSecondary}`}>
                  {t.customerIdentity.tryAdjustingSearch}
                </p>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && !hasNoFields && !hasNoFilteredResults && (
          <>
            <div className={`${tw.rounded} overflow-hidden`}>
              <Table<CustomerIdentityField>
                columns={columns}
                data={filteredFields}
                totalItems={filteredFields.length}
                currentPage={tableCurrentPage}
                pageSize={tablePageSize}
                isLoading={isLoading}
                onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
                onSort={handleSort}
                sortConfigs={sortConfigs}
                onHideColumn={toggleColumn}
                onManageColumnsClick={() => setShowColumnPicker(true)}
                style={{
                  headerBackground: color.surface.tableHeader,
                  headerTextColor: color.surface.tableHeaderText,
                  rowBackground: color.surface.tablebodybg,
                  rowSpacing: "0 8px",
                }}
              />
            </div>
            <Pagination
              currentPage={tableCurrentPage}
              pageSize={tablePageSize}
              totalItems={filteredFields.length}
              onPageChange={tableHandlePageChange}
                onPageSizeChange={tableHandlePageSizeChange}
            />
          </>
        )}
      </div>
      </div>
    </PermissionGate>
  );
}
