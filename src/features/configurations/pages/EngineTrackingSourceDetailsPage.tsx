import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Edit, Plus, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Input from "../../../shared/components/ui/Input";
import HeadlessSelect from "../../../shared/components/ui/HeadlessSelect";
import Checkbox from "../../../shared/components/ui/Checkbox";
import { useToast } from "../../../contexts/ToastContext";
import { extractBackendError } from "../../../shared/utils/errorHandler";
import { color, tw, button } from "../../../shared/utils/utils";
import {
  engineTrackingSourceService,
  type EngineTrackingSource,
  type EngineTrackingSourceField,
} from "../services/engineTrackingSourceService";
import {
  ENGINE_FIELD_DATA_TYPE_OPTIONS,
  engineSourceTypeLabel,
  type EngineFieldDataType,
} from "../types/engineTrackingSource";

export default function EngineTrackingSourceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState<EngineTrackingSource | null>(null);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [addingField, setAddingField] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [fieldKey, setFieldKey] = useState("");
  const [dataType, setDataType] = useState<EngineFieldDataType>("text");
  const [isRequired, setIsRequired] = useState(false);
  const [isAmountField, setIsAmountField] = useState(false);

  useEffect(() => {
    loadSource();
  }, [id]);

  const loadSource = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const found = await engineTrackingSourceService.getById(Number(id));
      setSource(found);
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to load tracking source."),
      );
      navigate("/dashboard/tracking-sources");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!source) return;
    const newActive = !(source.isActive !== false);
    setToggling(true);
    setSource((prev) => (prev ? { ...prev, isActive: newActive } : prev));
    try {
      const updated = await engineTrackingSourceService.update(source.id, {
        isActive: newActive,
      });
      setSource({ ...source, ...updated, isActive: newActive });
      showSuccess(
        newActive ? "Activated" : "Deactivated",
        newActive
          ? `${source.name} has been activated`
          : `${source.name} has been deactivated`,
      );
    } catch (err) {
      setSource((prev) =>
        prev ? { ...prev, isActive: !newActive } : prev,
      );
      showError(
        extractBackendError(err, "Failed to update status."),
      );
    } finally {
      setToggling(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!source) return;
    try {
      setDeleting(true);
      await engineTrackingSourceService.delete(source.id, { hard: true });
      showSuccess(`"${source.name}" has been deleted successfully.`);
      navigate("/dashboard/tracking-sources");
    } catch (err) {
      showError(
        extractBackendError(err, "Failed to delete tracking source."),
      );
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleAddField = async () => {
    if (!source || !fieldName.trim()) {
      showError("Field name is required.");
      return;
    }
    try {
      setAddingField(true);
      const created = await engineTrackingSourceService.addField(source.id, {
        fieldName: fieldName.trim(),
        ...(fieldKey.trim()
          ? { fieldKey: fieldKey.trim().toLowerCase() }
          : {}),
        dataType,
        isRequired,
        isAmountField,
      });
      setSource((prev) =>
        prev
          ? {
              ...prev,
              fields: [...(prev.fields || []), created],
            }
          : prev,
      );
      setFieldName("");
      setFieldKey("");
      setDataType("text");
      setIsRequired(false);
      setIsAmountField(false);
      setShowAddField(false);
      showSuccess("Field added");
    } catch (err) {
      showError(extractBackendError(err, "Failed to add field."));
    } finally {
      setAddingField(false);
    }
  };

  const handleDeleteField = async (field: EngineTrackingSourceField) => {
    if (!source) return;
    try {
      await engineTrackingSourceService.deleteField(source.id, field.id);
      setSource((prev) =>
        prev
          ? {
              ...prev,
              fields: (prev.fields || []).map((f) =>
                f.id === field.id ? { ...f, isActive: false } : f,
              ),
            }
          : prev,
      );
      showSuccess(`Field "${field.fieldName}" deactivated`);
    } catch (err) {
      showError(extractBackendError(err, "Failed to remove field."));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <LoadingSpinner variant="modern" size="xl" color="primary" />
        <p className={`${tw.textMuted} font-medium mt-4`}>
          Loading tracking source...
        </p>
      </div>
    );
  }

  if (!source) return null;

  const activeFields = (source.fields || []).filter((f) => f.isActive !== false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackButton showBreadcrumb={true} currentLabel={source.name} />
        <div className="flex items-center gap-2">
          <ActivateDeactivateButton
            isActive={source.isActive !== false}
            isLoading={toggling}
            onToggle={handleToggleActive}
          >
            {source.isActive !== false ? "Deactivate" : "Activate"}
          </ActivateDeactivateButton>
          <button
            type="button"
            onClick={() =>
              navigate(`/dashboard/tracking-sources/${source.id}/edit`)
            }
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: color.primary.action }}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className={`${tw.rounded} font-semibold transition-all duration-200 flex items-center gap-2 text-xs w-fit`}
            style={{
              backgroundColor: button.delete.background,
              color: button.delete.color,
              border: button.delete.border,
              padding: `${button.delete.paddingY} ${button.delete.paddingX}`,
              borderRadius: button.delete.borderRadius,
              fontSize: button.delete.fontSize,
            }}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className={tw.textMuted}>Code</p>
            <p className={`font-mono ${tw.textPrimary}`}>{source.code}</p>
          </div>
          <div>
            <p className={tw.textMuted}>Type</p>
            <p className={tw.textPrimary}>
              {engineSourceTypeLabel(source.sourceType)}
            </p>
          </div>
          <div>
            <p className={tw.textMuted}>Attribution window</p>
            <p className={tw.textPrimary}>
              {source.attributionWindowHours} hours
            </p>
          </div>
          <div>
            <p className={tw.textMuted}>Cooldown</p>
            <p className={tw.textPrimary}>{source.cooldownHours} hours</p>
          </div>
          <div>
            <p className={tw.textMuted}>Min / Max amount</p>
            <p className={tw.textPrimary}>
              {source.minAmount ?? "—"} / {source.maxAmount ?? "—"}
            </p>
          </div>
          <div>
            <p className={tw.textMuted}>Status</p>
            <p
              className={
                source.isActive !== false ? tw.success : tw.textMuted
              }
            >
              {source.isActive !== false ? "Active" : "Inactive"}
            </p>
          </div>
          <div className="md:col-span-2">
            <p className={tw.textMuted}>Description</p>
            <p className={tw.textPrimary}>
              {source.description?.trim() || "—"}
            </p>
          </div>
          {(source.createdAt || source.updatedAt) && (
            <div className="md:col-span-2 flex flex-wrap gap-6 text-xs">
              {source.createdAt ? (
                <span className={tw.textMuted}>
                  Created: <DateFormatter date={source.createdAt} />
                </span>
              ) : null}
              {source.updatedAt ? (
                <span className={tw.textMuted}>
                  Updated: <DateFormatter date={source.updatedAt} />
                </span>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-base font-semibold ${tw.textPrimary}`}>
              Fields
            </h2>
            <p className={`text-sm ${tw.textMuted}`}>
              Fields power the tracking rule selector for this source.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddField((v) => !v)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border ${tw.rounded}`}
            style={{
              borderColor: color.primary.accent,
              color: color.primary.accent,
            }}
          >
            <Plus className="w-4 h-4" />
            Add field
          </button>
        </div>

        {showAddField ? (
          <div className="border border-gray-200 rounded p-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                label="Field name"
                value={fieldName}
                onChange={(v) => setFieldName(String(v))}
                placeholder="Recharge Amount"
              />
              <Input
                label="Field key"
                value={fieldKey}
                onChange={(v) => setFieldKey(String(v))}
                placeholder="amount (optional)"
              />
              <HeadlessSelect
                label="Data type"
                value={dataType}
                onChange={(v) => setDataType(v as EngineFieldDataType)}
                options={ENGINE_FIELD_DATA_TYPE_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="new-field-required"
                  checked={isRequired}
                  onChange={(e) => setIsRequired(e.target.checked)}
                />
                <span className="text-sm">Required</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  id="new-field-amount"
                  checked={isAmountField}
                  onChange={(e) => setIsAmountField(e.target.checked)}
                />
                <span className="text-sm">Amount field</span>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddField(false)}
                className={`px-3 py-1.5 border ${tw.rounded}`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingField}
                onClick={handleAddField}
                className={`text-white px-3 py-1.5 ${tw.rounded} disabled:opacity-50`}
                style={{ backgroundColor: color.primary.action }}
              >
                {addingField ? "Adding..." : "Save field"}
              </button>
            </div>
          </div>
        ) : null}

        {activeFields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>No active fields yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Name
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Key
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Type
                  </th>
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Flags
                  </th>
                  <th className={`py-2 font-medium ${tw.textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeFields.map((field) => (
                  <tr
                    key={field.id}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                      {field.fieldName}
                    </td>
                    <td className={`py-3 pr-4 font-mono ${tw.textPrimary}`}>
                      {field.fieldKey}
                    </td>
                    <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                      {field.dataType}
                    </td>
                    <td className={`py-3 pr-4 ${tw.textSecondary}`}>
                      {[
                        field.isRequired && "required",
                        field.isPrimaryKey && "pk",
                        field.isAmountField && "amount",
                        field.isRevenueField && "revenue",
                        field.isProductField && "product",
                      ]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => handleDeleteField(field)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                        title="Deactivate field"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Tracking Source"
        description="This permanently deletes the tracking source. This action cannot be undone. Sources referenced by conversion rules or reward mappings cannot be deleted — deactivate them instead."
        itemName={source.name}
        isLoading={deleting}
      />
    </div>
  );
}
