import { Award, Target, Users, Settings, Trash2 } from "lucide-react";
import { CampaignSegment } from "../../types/campaign";
import { color , tw} from "../../../../shared/utils/utils";

interface ChampionChallengerDisplayProps {
  champion: CampaignSegment | null;
  challengers: CampaignSegment[];
  onAddChampion: () => void;
  onAddChallenger: () => void;
  onRemoveSegment: (segmentId: string) => void;
  onConfigureControlGroup: (segmentId: string) => void;
}

export default function ChampionChallengerDisplay({
  champion,
  challengers,
  onAddChallenger,
  onRemoveSegment,
  onConfigureControlGroup,
}: ChampionChallengerDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Champion Section */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Award className="w-5 h-5 text-[#588157]" />
          <h3 className="text-base font-semibold text-gray-900">
            Champion Segment
          </h3>
        </div>

        {champion ? (
          <div className={`border border-[#588157] ${tw.rounded} p-4`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1">
                <div
                  className={`w-10 h-10 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                  style={{ backgroundColor: `${color.primary.accent}20` }}
                >
                  <Award
                    className="w-5 h-5"
                    style={{ color: color.primary.accent }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="text-base font-semibold text-gray-900">
                      {champion.name}
                    </h4>
                    <span
                      className={`px-2 py-0.5  text-xs font-medium rounded-full`}
                      style={{ backgroundColor: color.primary.accent }}
                    >
                      🏆 CHAMPION
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600 font-medium">
                        {champion.customer_count.toLocaleString()} customers
                      </span>
                    </div>
                    {champion.control_group_config &&
                      champion.control_group_config.type !== "none" && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium"
                          style={{
                            backgroundColor: `${color.primary.accent}15`,
                            color: color.primary.accent,
                          }}
                        >
                          Control Group
                        </span>
                      )}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onConfigureControlGroup(champion.id)}
                  className={`p-2 text-gray-400 hover:text-gray-600 ${tw.rounded} transition-colors`}
                  title="Configure Control Group"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onRemoveSegment(champion.id)}
                  className={`p-2 text-gray-400 hover:text-red-500 ${tw.rounded} transition-colors`}
                  title="Remove Champion"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`border-2 border-dashed border-gray-300 ${tw.rounded} p-4`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gray-100 ${tw.rounded} flex items-center justify-center`}>
                <Award className="w-5 h-5 text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-1">
                  No Champion Defined
                </h3>
                <p className="text-xs text-gray-600">
                  Add your champion segment first
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Challengers Section */}
      {champion && (
        <div className="space-y-3 mt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-[#588157]" />
              <h3 className="text-base font-semibold text-gray-900">
                Challenger Segments
              </h3>
              <span className="text-sm text-gray-500">
                ({challengers.length})
              </span>
            </div>
            <button
              onClick={onAddChallenger}
              className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
              style={{ backgroundColor: color.primary.action }}
            >
              <Target className="w-4 h-4 mr-2" />
              Add Challenger
            </button>
          </div>

          {challengers.length > 0 ? (
            <div className={`border border-gray-200 ${tw.rounded} overflow-hidden`}>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Challenger Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Customers
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Control Group
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {challengers.map((challenger, index) => (
                    <tr
                      key={challenger.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 text-xs font-semibold rounded `}
                            style={{ backgroundColor: color.primary.action }}
                          >
                            C{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 ${tw.rounded} flex items-center justify-center flex-shrink-0`}
                            style={{
                              backgroundColor: `${color.primary.accent}20`,
                            }}
                          >
                            <Target
                              className="w-4 h-4"
                              style={{ color: color.primary.accent }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {challenger.name}
                            </div>
                            <div className="text-xs text-gray-500">
                              {challenger.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {challenger.customer_count.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {challenger.control_group_config &&
                        challenger.control_group_config.type !== "none" ? (
                          <span
                            className="text-xs px-2 py-1 rounded-full font-medium"
                            style={{
                              backgroundColor: `${color.primary.accent}15`,
                              color: color.primary.accent,
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() =>
                              onConfigureControlGroup(challenger.id)
                            }
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
                            title="Configure Control Group"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onRemoveSegment(challenger.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={` border border-gray-300 ${tw.rounded} p-8`}>
              <div className="flex flex-col items-center justify-center text-center">
                <Target className="w-12 h-12 text-[#588157] mb-3" />
                <h4 className="font-medium text-gray-900 mb-2">
                  No Challengers Yet
                </h4>
                <p className="text-sm text-gray-600 mb-4 max-w-sm">
                  Add challenger segments to test alternative strategies against
                  your champion.
                </p>
                <button
                  onClick={onAddChallenger}
                  className={`inline-flex items-center px-4 py-2 text-white ${tw.rounded} text-sm font-medium`}
                  style={{ backgroundColor: color.primary.action }}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Add First Challenger
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
