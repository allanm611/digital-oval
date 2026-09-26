import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Crosshair, Edit, Plus, Trash2 } from "lucide-react";
import BackButton from "../../../shared/components/ui/BackButton";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import DateFormatter from "../../../shared/components/DateFormatter";
import ActivateDeactivateButton from "../../../shared/components/ui/ActivateDeactivateButton";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import Input from "../../../shared/components/ui/Input";
import Textarea from "../../../shared/components/ui/Textarea";
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
  catalogFieldOperatorCount,
  engineSourceTypeLabel,
  trackingOperatorLabel,
  type EngineFieldDataType,
  type TrackingSelectorOperator,
  type UpdateEngineTrackingSourceFieldPayload,
} from "../types/engineTrackingSource";
import { deriveFieldKey } from "../components/engine-tracking/engineTrackingFieldUtils";

interface FieldFormState {
  fieldName: string;
  fieldKey: string;
  dataType: EngineFieldDataType;
  isRequired: boolean;
  isPrimaryKey: boolean;
  isAmountField: boolean;
  isRevenueField: boolean;
  isProductField: boolean;
  description: string;
}

const EMPTY_FIELD_FORM: FieldFormState = {
  fieldName: "",
  fieldKey: "",
  dataType: "text",
  isRequired: false,
  isPrimaryKey: false,
  isAmountField: false,
  isRevenueField: false,
  isProductField: false,
  description: "",
};

function formatCodes(codes?: string[] | null): string {
  if (!codes?.length) return "—";
  return codes.join(", ");
}

function operatorChips(operators?: TrackingSelectorOperator[] | null) {
  if (!operators?.length) {
    return (
      <span className={`text-xs ${tw.textMuted}`}>
        None — offer rules will fall back to type defaults
      </span>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {operators.map((op) => (
        <span
          key={op.id}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] rounded bg-gray-100 text-gray-700"
          title={[
            trackingOperatorLabel(op),
            op.requiresTwoValues ? "two values" : null,
            op.applicableFieldTypes?.length
              ? `types: ${op.applicableFieldTypes.join(", ")}`
              : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        >
          <span className="font-mono">{op.symbol || op.code}</span>
          <span>{trackingOperatorLabel(op)}</span>
        </span>
      ))}
    </div>
  );
}

function fieldFlags(field: EngineTrackingSourceField): string {
  return (
    [
      field.isRequired && "required",
      field.isPrimaryKey && "pk",
      field.isAmountField && "amount",
      field.isRevenueField && "revenue",
      field.isProductField && "product",
    ]
      .filter(Boolean)
      .join(", ") || "—"
  );
}

function toFieldForm(field: EngineTrackingSourceField): FieldFormState {
  return {
    fieldName: field.fieldName,
    fieldKey: field.fieldKey,
    dataType: (field.dataType as EngineFieldDataType) || "text",
    isRequired: !!field.isRequired,
    isPrimaryKey: !!field.isPrimaryKey,
    isAmountField: !!field.isAmountField,
    isRevenueField: !!field.isRevenueField,
    isProductField: !!field.isProductField,
    description: field.description || "",
  };
}

function validateFieldForm(
  form: FieldFormState,
  existing: EngineTrackingSourceField[],
  editingId?: number,
): string | null {
  const name = form.fieldName.trim();
  const key = (form.fieldKey.trim() || deriveFieldKey(name)).toLowerCase();

  if (!name) return "Field name is required.";
  if (!key) return "Field key is required.";
  if (!/^[a-z][a-z0-9_]*$/.test(key)) {
    return "Field key must be lowercase snake_case starting with a letter.";
  }

  const activeOthers = existing.filter(
    (f) => f.isActive !== false && f.id !== editingId,
  );
  if (activeOthers.some((f) => f.fieldKey.toLowerCase() === key)) {
    return "Field key must be unique among active fields.";
  }
  if (
    form.isAmountField &&
    activeOthers.some((f) => f.isAmountField)
  ) {
    return "Only one amount field is allowed per tracking source.";
  }
  if (
    form.isPrimaryKey &&
    activeOthers.some((f) => f.isPrimaryKey)
  ) {
    return "Only one primary key field is allowed per tracking source.";
  }
  return null;
}

function FieldFormEditor({
  form,
  onChange,
  onCancel,
  onSave,
  saving,
  submitLabel,
}: {
  form: FieldFormState;
  onChange: (next: FieldFormState) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  submitLabel: string;
}) {
  const patch = (partial: Partial<FieldFormState>) =>
    onChange({ ...form, ...partial });

  const handleNameChange = (value: string) => {
    const next: FieldFormState = { ...form, fieldName: value };
    if (!form.fieldKey || form.fieldKey === deriveFieldKey(form.fieldName)) {
      next.fieldKey = deriveFieldKey(value);
    }
    onChange(next);
  };

  return (
    <div className="border border-gray-200 rounded p-4 space-y-3 bg-gray-50/50">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Input
          label="Field name *"
          value={form.fieldName}
          onChange={(v) => handleNameChange(String(v))}
          placeholder="Recharge Amount"
          disabled={saving}
        />
        <Input
          label="Field key *"
          value={form.fieldKey}
          onChange={(v) => patch({ fieldKey: String(v).toLowerCase() })}
          placeholder="amount"
          disabled={saving}
        />
        <HeadlessSelect
          label="Data type"
          value={form.dataType}
          onChange={(v) => patch({ dataType: v as EngineFieldDataType })}
          options={ENGINE_FIELD_DATA_TYPE_OPTIONS.map((o) => ({
            value: o.value,
            label: o.label,
          }))}
          disabled={saving}
        />
      </div>
      <Textarea
        label="Description"
        value={form.description}
        onChange={(v) => patch({ description: String(v) })}
        rows={2}
        placeholder="Optional helper text"
        disabled={saving}
      />
      <div className="flex flex-wrap gap-4">
        {(
          [
            ["isRequired", "Required"],
            ["isPrimaryKey", "Primary key"],
            ["isAmountField", "Amount field"],
            ["isRevenueField", "Revenue field"],
            ["isProductField", "Product field"],
          ] as const
        ).map(([prop, label]) => (
          <label key={prop} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              id={`field-form-${prop}`}
              checked={form[prop]}
              onChange={(e) => patch({ [prop]: e.target.checked })}
              disabled={saving}
            />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={`px-3 py-1.5 border ${tw.rounded} disabled:opacity-50`}
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className={`text-white px-3 py-1.5 ${tw.rounded} disabled:opacity-50`}
          style={{ backgroundColor: color.primary.action }}
        >
          {saving ? "Saving..." : submitLabel}
        </button>
      </div>
    </div>
  );
}

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
  const [addForm, setAddForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);

  const [editingFieldId, setEditingFieldId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FieldFormState>(EMPTY_FIELD_FORM);
  const [savingField, setSavingField] = useState(false);
  const [fieldToDelete, setFieldToDelete] =
    useState<EngineTrackingSourceField | null>(null);
  const [deletingField, setDeletingField] = useState(false);

  useEffect(() => {
    loadSource();
  }, [id]);

  const loadSource = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const found = await engineTrackingSourceService.getByIdWithSelectorConfig(
        Number(id),
      );
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

  const buildFieldPayload = (
    form: FieldFormState,
  ): UpdateEngineTrackingSourceFieldPayload => {
    const fieldName = form.fieldName.trim();
    const fieldKey =
      form.fieldKey.trim().toLowerCase() || deriveFieldKey(fieldName);
    return {
      fieldName,
      fieldKey,
      dataType: form.dataType,
      isRequired: form.isRequired,
      isPrimaryKey: form.isPrimaryKey,
      isAmountField: form.isAmountField,
      isRevenueField: form.isRevenueField,
      isProductField: form.isProductField,
      description: form.description.trim() || null,
    };
  };

  const handleAddField = async () => {
    if (!source) return;
    const validationError = validateFieldForm(
      addForm,
      source.fields || [],
    );
    if (validationError) {
      showError(validationError);
      return;
    }
    try {
      setAddingField(true);
      const created = await engineTrackingSourceService.addField(
        source.id,
        buildFieldPayload(addForm),
      );
      setSource((prev) =>
        prev
          ? { ...prev, fields: [...(prev.fields || []), created] }
          : prev,
      );
      setAddForm(EMPTY_FIELD_FORM);
      setShowAddField(false);
      showSuccess("Field added");
    } catch (err) {
      showError(extractBackendError(err, "Failed to add field."));
    } finally {
      setAddingField(false);
    }
  };

  const startEditField = (field: EngineTrackingSourceField) => {
    setShowAddField(false);
    setEditingFieldId(field.id);
    setEditForm(toFieldForm(field));
  };

  const handleUpdateField = async () => {
    if (!source || editingFieldId == null) return;
    const validationError = validateFieldForm(
      editForm,
      source.fields || [],
      editingFieldId,
    );
    if (validationError) {
      showError(validationError);
      return;
    }
    try {
      setSavingField(true);
      const updated = await engineTrackingSourceService.updateField(
        source.id,
        editingFieldId,
        buildFieldPayload(editForm),
      );
      setSource((prev) =>
        prev
          ? {
              ...prev,
              fields: (prev.fields || []).map((f) =>
                f.id === editingFieldId
                  ? {
                      ...f,
                      ...updated,
                      operators: updated.operators ?? f.operators,
                    }
                  : f,
              ),
            }
          : prev,
      );
      setEditingFieldId(null);
      showSuccess("Field updated");
    } catch (err) {
      showError(extractBackendError(err, "Failed to update field."));
    } finally {
      setSavingField(false);
    }
  };

  const handleDeleteField = (field: EngineTrackingSourceField) => {
    if (!Number.isFinite(field.id) || field.id <= 0) {
      showError(
        "This field cannot be deleted because it has not been saved with an id.",
      );
      return;
    }
    setFieldToDelete(field);
  };

  const handleConfirmDeleteField = async () => {
    if (!source || !fieldToDelete) return;

    const fieldId = fieldToDelete.id;
    const fieldLabel = fieldToDelete.fieldName || fieldToDelete.fieldKey;

    const withoutField = (src: EngineTrackingSource): EngineTrackingSource => ({
      ...src,
      fields: (src.fields || []).filter((f) => f.id !== fieldId),
    });

    try {
      setDeletingField(true);
      await engineTrackingSourceService.deleteField(source.id, fieldId);

      setSource((prev) => (prev ? withoutField(prev) : prev));
      if (editingFieldId === fieldId) setEditingFieldId(null);

      try {
        const refreshed =
          await engineTrackingSourceService.getByIdWithSelectorConfig(
            source.id,
          );
        setSource(withoutField(refreshed));
      } catch {
        /* keep the optimistic removal if refresh fails */
      }

      showSuccess(`Field "${fieldLabel}" has been deleted.`);
      setFieldToDelete(null);
    } catch (err) {
      showError(extractBackendError(err, "Failed to delete field."));
    } finally {
      setDeletingField(false);
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
  const inactiveFields = (source.fields || []).filter(
    (f) => f.isActive === false,
  );
  const operatorCount = catalogFieldOperatorCount(activeFields);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <BackButton
          showBreadcrumb={true}
          parentLabel="Tracking Sources"
          currentLabel={source.name}
          onClick={() => navigate("/dashboard/tracking-sources")}
        />
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
              navigate(`/dashboard/tracking-sources/${source.id}/edit`, {
                state: { from: "details" },
              })
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

      <div className={`${tw.rounded} border border-gray-200 bg-white p-6`}>
        <div className="flex items-start gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color.primary.action }}
          >
            <Crosshair className="w-7 h-7 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className={`text-xl font-semibold ${tw.textPrimary}`}>
              {source.name}
            </h1>
            <p className={`text-sm ${tw.textSecondary} mt-1 font-mono`}>
              {source.code}
              {" · "}
              {engineSourceTypeLabel(source.sourceType)}
              {" · "}
              {activeFields.length} field
              {activeFields.length === 1 ? "" : "s"}
              {" · "}
              {operatorCount} operator
              {operatorCount === 1 ? "" : "s"}
            </p>
            {source.description ? (
              <p className={`text-sm ${tw.textMuted} mt-2`}>
                {source.description}
              </p>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>
              Attribution window
            </p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {source.attributionWindowHours} hours
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Cooldown</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {source.cooldownHours} hours
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>
              Min / Max amount
            </p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {source.minAmount ?? "—"} / {source.maxAmount ?? "—"}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Status</p>
            <p
              className={`text-sm mt-1 ${
                source.isActive !== false ? tw.success : tw.textMuted
              }`}
            >
              {source.isActive !== false ? "Active" : "Inactive"}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>
              Included products
            </p>
            <p className={`text-sm ${tw.textPrimary} mt-1 break-words`}>
              {formatCodes(source.includedProductCodes)}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>
              Excluded products
            </p>
            <p className={`text-sm ${tw.textPrimary} mt-1 break-words`}>
              {formatCodes(source.excludedProductCodes)}
            </p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Source ID</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>{source.id}</p>
          </div>
          <div>
            <p className={`text-xs uppercase ${tw.textMuted}`}>Created</p>
            <p className={`text-sm ${tw.textPrimary} mt-1`}>
              {source.createdAt ? (
                <DateFormatter date={source.createdAt} />
              ) : (
                "—"
              )}
            </p>
          </div>
          {source.updatedAt ? (
            <div>
              <p className={`text-xs uppercase ${tw.textMuted}`}>Updated</p>
              <p className={`text-sm ${tw.textPrimary} mt-1`}>
                <DateFormatter date={source.updatedAt} />
              </p>
            </div>
          ) : null}
        </div>
      </div>

      <div
        className={`${tw.rounded} border border-gray-200 bg-white p-6 shadow-sm space-y-4`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className={`text-lg font-semibold ${tw.textPrimary}`}>
              Fields
            </h2>
            <p className={`text-sm ${tw.textMuted}`}>
              Fields and operators come from GET /tracking-sources/selector-config.
              Operators bound to a field are the conditions offered when this
              source is used on an offer.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingFieldId(null);
              setShowAddField((v) => !v);
              setAddForm(EMPTY_FIELD_FORM);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white rounded-md"
            style={{ backgroundColor: color.primary.action }}
          >
            <Plus className="w-4 h-4" />
            Add field
          </button>
        </div>

        {showAddField ? (
          <FieldFormEditor
            form={addForm}
            onChange={setAddForm}
            onCancel={() => {
              setShowAddField(false);
              setAddForm(EMPTY_FIELD_FORM);
            }}
            onSave={handleAddField}
            saving={addingField}
            submitLabel="Save field"
          />
        ) : null}

        {activeFields.length === 0 ? (
          <p className={`text-sm ${tw.textMuted}`}>
            No active fields yet. Add fields so offers can build rules against
            this source.
          </p>
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
                  <th className={`py-2 pr-4 font-medium ${tw.textMuted}`}>
                    Operators
                  </th>
                  <th className={`py-2 font-medium ${tw.textMuted}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeFields.map((field) => (
                  <tr
                    key={field.id}
                    className="border-b border-gray-100 last:border-0 align-top"
                  >
                    {editingFieldId === field.id ? (
                      <td colSpan={6} className="py-3">
                        <FieldFormEditor
                          form={editForm}
                          onChange={setEditForm}
                          onCancel={() => setEditingFieldId(null)}
                          onSave={handleUpdateField}
                          saving={savingField}
                          submitLabel="Update field"
                        />
                      </td>
                    ) : (
                      <>
                        <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                          <div>{field.fieldName}</div>
                          {field.description ? (
                            <div className={`text-xs mt-0.5 ${tw.textMuted}`}>
                              {field.description}
                            </div>
                          ) : null}
                        </td>
                        <td
                          className={`py-3 pr-4 font-mono ${tw.textPrimary}`}
                        >
                          {field.fieldKey}
                        </td>
                        <td className={`py-3 pr-4 ${tw.textPrimary}`}>
                          {field.dataType}
                        </td>
                        <td className={`py-3 pr-4 ${tw.textSecondary}`}>
                          {fieldFlags(field)}
                        </td>
                        <td className="py-3 pr-4 max-w-xs">
                          {operatorChips(field.operators)}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => startEditField(field)}
                              className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                              title="Edit field"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDeleteField(field);
                              }}
                              disabled={deletingField}
                              className="p-1 text-red-500 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete field"
                              aria-label={`Delete field ${field.fieldName || field.fieldKey}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {inactiveFields.length > 0 ? (
          <div className="pt-2 border-t border-gray-100">
            <p className={`text-xs ${tw.textMuted}`}>
              {inactiveFields.length} deactivated field
              {inactiveFields.length === 1 ? "" : "s"} (hidden from selectors):{" "}
              {inactiveFields.map((f) => f.fieldKey).join(", ")}
            </p>
          </div>
        ) : null}
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

      <DeleteConfirmModal
        isOpen={fieldToDelete !== null}
        onClose={() => {
          if (deletingField) return;
          setFieldToDelete(null);
        }}
        onConfirm={handleConfirmDeleteField}
        title="Delete Field"
        description="This removes the field from this tracking source. Offer tracking rules that use this field may fail until they are updated. This action cannot be undone."
        itemName={
          fieldToDelete
            ? fieldToDelete.fieldName || fieldToDelete.fieldKey
            : ""
        }
        isLoading={deletingField}
        confirmText="Delete"
      />
    </div>
  );
}
