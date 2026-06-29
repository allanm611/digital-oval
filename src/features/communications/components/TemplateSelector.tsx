import { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Eye, Trash2 } from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import { MessageTemplate } from "../types/template";
import { CommunicationChannel } from "../types/communication";
import { templateService } from "../services/templateService";
import DeleteConfirmModal from "../../../shared/components/ui/DeleteConfirmModal";
import { useDeleteConfirm } from "../../../shared/hooks/useDeleteConfirm";

interface TemplateSelectorProps {
  channel: CommunicationChannel;
  onSelectTemplate: (template: MessageTemplate) => void;
  onCreateNew?: () => void;
}

export default function TemplateSelector({
  channel,
  onSelectTemplate,
  onCreateNew,
}: TemplateSelectorProps) {
  const { deleteConfirm, openDeleteConfirm, closeDeleteConfirm } = useDeleteConfirm({ onDelete: async () => handleConfirmDelete() });

  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] =
    useState<MessageTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const loadTemplates = useCallback(() => {
    const allTemplates = templateService.getTemplatesByChannel(channel);
    setTemplates(allTemplates);
  }, [channel]);

  useEffect(() => {
    loadTemplates();
  }, [channel, loadTemplates]);

  const handleSelect = (template: MessageTemplate) => {
    setSelectedId(template.id);
    onSelectTemplate(template);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const template = templates.find(t => t.id === id);
    setTemplateToDelete(id);
    openDeleteConfirm(template?.id || id, template?.name || "Template");
  };

  const handleConfirmDelete = () => {
    if (!templateToDelete) return;
    templateService.deleteTemplate(templateToDelete);
    loadTemplates();
    if (selectedId === templateToDelete) {
      setSelectedId(null);
    }
    closeDeleteConfirm();
    setTemplateToDelete(null);
  };

  const handleCancelDelete = () => {
    closeDeleteConfirm();
    setTemplateToDelete(null);
  };

  const handlePreview = (template: MessageTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewTemplate(template);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-700">
            Message Templates
          </h3>
        </div>
        {onCreateNew && (
          <button
            type="button"
            onClick={onCreateNew}
            className={`flex items-center space-x-1 px-3 py-1.5 text-sm ${tw.rounded} border border-gray-300 hover:bg-gray-50 transition-colors`}
          >
            <Plus className="w-4 h-4" />
            <span>New Template</span>
          </button>
        )}
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No templates available for {channel}</p>
          {onCreateNew && (
            <button
              onClick={onCreateNew}
              className="mt-3 text-sm font-medium"
              style={{ color: color.primary.accent }}
            >
              Create your first template
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => handleSelect(template)}
              className={`
                p-3 ${tw.rounded} border-2 cursor-pointer transition-all
                ${
                  selectedId === template.id
                    ? "shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }
              style={
                selectedId === template.id
                  ? {
                      borderColor: color.primary.accent,
                      backgroundColor: `${color.primary.accent}10`,
                    }
                  : {}
              }
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">
                    {template.name}
                  </h4>
                  {template.description && (
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {template.description}
                    </p>
                  )}
                  {template.subject && (
                    <p className="text-xs text-gray-600 mt-1 italic truncate">
                      Subject: {template.subject}
                    </p>
                  )}
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">
                      {template.variables.length} variable
                      {template.variables.length !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <button
                    onClick={(e) => handlePreview(template, e)}
                    className="p-0 icon-edit hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  {!template.id.startsWith("default_") && (
                    <button
                      onClick={(e) => handleDelete(template.id, e)}
                      className="p-0 icon-delete hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewTemplate && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000] p-4"
          onClick={() => setPreviewTemplate(null)}
        >
          <div
            className={`bg-white ${tw.rounded} shadow-xl max-w-2xl w-full max-h-[80vh] overflow-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">
                {previewTemplate.name}
              </h3>
              {previewTemplate.subject && (
                <p className="text-sm text-gray-600 mt-1">
                  Subject: {previewTemplate.subject}
                </p>
              )}
            </div>
            <div className="p-6">
              {previewTemplate.isRichText ? (
                <div
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
                />
              ) : (
                <p className="whitespace-pre-wrap text-gray-700">
                  {previewTemplate.body}
                </p>
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className={`px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 ${tw.rounded} hover:bg-gray-50`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.id !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        itemName={templates.find((t) => t.id === templateToDelete)?.name || ""}
        isLoading={false}
        confirmText="Delete Template"
        cancelText="Cancel"
      />
    </div>
  );
}
