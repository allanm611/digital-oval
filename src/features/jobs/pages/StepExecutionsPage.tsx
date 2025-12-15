import { useEffect, useState } from "react";
import { stepExecutionService } from "../services/stepExecutionService";
import type { StepExecution } from "../types/stepExecution";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";
import { useToast } from "../../../contexts/ToastContext";
import { color, tw } from "../../../shared/utils/utils";

export default function StepExecutionsPage() {
  const { error: showError } = useToast();
  const [executions, setExecutions] = useState<StepExecution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [jobExecutionId, setJobExecutionId] = useState<string>("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const list = jobExecutionId
          ? await stepExecutionService.getStepExecutionsByJobExecution(
              jobExecutionId,
              { limit: 50, offset: 0 }
            )
          : await stepExecutionService.searchStepExecutions({
              limit: 50,
              offset: 0,
            });
        setExecutions(list.data || []);
      } catch (err) {
        showError(
          "Step Executions",
          err instanceof Error ? err.message : "Failed to load step executions"
        );
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [jobExecutionId, showError]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${tw.textPrimary}`}>
            Step Executions
          </h1>
          <p className={`${tw.textSecondary} mt-1 text-sm`}>
            View step executions (filter by job execution)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            className={`${tw.rounded} border border-gray-200 px-3 py-2 text-sm`}
            placeholder="Job execution ID (optional)"
            value={jobExecutionId}
            onChange={(e) => setJobExecutionId(e.target.value)}
            style={{ minWidth: "260px" }}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : executions.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">
          No step executions found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table
            className="w-full"
            style={{ borderCollapse: "separate", borderSpacing: "0 8px" }}
          >
            <thead>
              <tr>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                    borderTopLeftRadius: "0.375rem",
                  }}
                >
                  Step Exec ID
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Job Exec ID
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                  }}
                >
                  Step ID
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{
                    color: color.surface.tableHeaderText,
                    backgroundColor: color.surface.tableHeader,
                    borderTopRightRadius: "0.375rem",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {executions.map((exec) => (
                <tr key={exec.id}>
                  <td
                    className="px-4 py-3"
                    style={{
                      backgroundColor: color.surface.tablebodybg,
                      borderTopLeftRadius: "0.375rem",
                      borderBottomLeftRadius: "0.375rem",
                    }}
                  >
                    <span className="font-mono text-xs">{exec.id}</span>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    <span className="font-mono text-xs">
                      {exec.job_execution_id}
                    </span>
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{ backgroundColor: color.surface.tablebodybg }}
                  >
                    {exec.step_id}
                  </td>
                  <td
                    className="px-4 py-3"
                    style={{
                      backgroundColor: color.surface.tablebodybg,
                      borderTopRightRadius: "0.375rem",
                      borderBottomRightRadius: "0.375rem",
                    }}
                  >
                    <span className="text-xs font-medium capitalize">
                      {exec.execution_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
