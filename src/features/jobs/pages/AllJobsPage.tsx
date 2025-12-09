import { useState } from "react";
import {
  Plus,
  Search,
  Briefcase,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
} from "lucide-react";
import { color, tw } from "../../../shared/utils/utils";
import LoadingSpinner from "../../../shared/components/ui/LoadingSpinner";

interface Job {
  id: number;
  name: string;
  type?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

export default function AllJobsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading] = useState(false);
  const [jobs] = useState<Job[]>([]);

  const filteredJobs = jobs.filter((job) =>
    job.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "text-green-600 bg-green-50";
      case "running":
        return "text-blue-600 bg-blue-50";
      case "failed":
        return "text-red-600 bg-red-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return CheckCircle;
      case "running":
        return Clock;
      case "failed":
        return XCircle;
      default:
        return Clock;
    }
  };

  return (
    <div
      className="min-h-screen p-6"
      style={{ backgroundColor: color.primary.background }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Jobs</h1>
          <p className="text-gray-600">
            View and manage all jobs in the system
          </p>
        </div>

        {/* Actions Bar */}
        <div className={`bg-white ${tw.rounded} shadow-sm border border-gray-200 p-4 mb-6`}>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search jobs by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 border border-gray-300 ${tw.rounded} focus:ring-2 focus:ring-[#3b8169] focus:border-transparent`}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button className={`flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 ${tw.rounded} hover:bg-gray-200 transition-colors`}>
                <Filter className="h-4 w-4" />
                Filter
              </button>
              <button
                onClick={() => {
                  // Navigate to create job page when implemented
                }}
                className={`flex items-center gap-2 px-4 py-2 text-white ${tw.rounded} transition-colors`}
                style={{ backgroundColor: color.primary.main }}
              >
                <Plus className="h-4 w-4" />
                Create Job
              </button>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className={`bg-white ${tw.rounded} shadow-sm border border-gray-200`}>
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No jobs found
              </h3>
              <p className="text-gray-600 mb-4">
                {searchQuery
                  ? "No jobs match your search criteria."
                  : "Get started by creating your first job."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => {
                    // Navigate to create job page when implemented
                  }}
                  className={`inline-flex items-center gap-2 px-4 py-2 text-white ${tw.rounded} transition-colors`}
                  style={{ backgroundColor: color.primary.main }}
                >
                  <Plus className="h-4 w-4" />
                  Create Job
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => {
                    const StatusIcon = getStatusIcon(job.status);
                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => {
                          // Navigate to job details when implemented
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Briefcase className="h-5 w-5 text-gray-400 mr-3" />
                            <div className="text-sm font-medium text-gray-900">
                              {job.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {job.type || "N/A"}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={tw(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                              getStatusColor(job.status)
                            )}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {job.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.created_at
                            ? new Date(job.created_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.updated_at
                            ? new Date(job.updated_at).toLocaleDateString()
                            : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
