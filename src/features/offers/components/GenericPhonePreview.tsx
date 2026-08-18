/**
 * Generic Phone Preview Component
 * Fallback preview for unknown/new channels
 * Shows content in a neutral mobile phone mockup
 */

interface GenericPhonePreviewProps {
  title: string;
  message: string;
}

export default function GenericPhonePreview({
  title,
  message,
}: GenericPhonePreviewProps) {
  return (
    <div className="flex justify-center py-4">
      {/* Phone Frame */}
      <div className="w-80 bg-black rounded-3xl p-3 shadow-2xl">
        {/* Phone Screen */}
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Status Bar */}
          <div className="bg-gray-900 text-white px-4 py-2 flex justify-between items-center text-xs">
            <span>9:41</span>
            <div className="flex gap-1">
              <span>📶</span>
              <span>📡</span>
              <span>🔋</span>
            </div>
          </div>

          {/* Message Content */}
          <div className="bg-gray-50 p-4 min-h-96 flex flex-col justify-start">
            {/* Title */}
            {title && (
              <div className="mb-3">
                <p className="text-sm font-semibold text-gray-900 break-words">
                  {title}
                </p>
              </div>
            )}

            {/* Message Body */}
            {message && (
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
                  {message}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!title && !message && (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p className="text-sm">No content to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
