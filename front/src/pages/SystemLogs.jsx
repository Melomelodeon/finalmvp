import React, { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE } from "../config";

// Status badge component
const StatusBadge = ({ status }) => (
  <span
    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
      status === "success"
        ? "bg-green-100 text-green-700"
        : "bg-red-100 text-red-700"
    }`}
  >
    {status === "success" ? "Success" : "Failed"}
  </span>
);

// Time ago helper
const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function SystemLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [backupStatus, setBackupStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const logsPerPage = 10;

  // Fetch logs from backend
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/logs`);
      setLogs(res.data.reverse()); // latest first
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  // Backup simulation
  const backupDatabase = async () => {
    setBackupStatus("creating");
    try {
      await new Promise((res) => setTimeout(res, 1500));
      setBackupStatus("success");
    } catch {
      setBackupStatus("error");
    } finally {
      setTimeout(() => setBackupStatus(""), 3000);
    }
  };

  // Filtered logs by search
  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      (log.details &&
        log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.user_name &&
        log.user_name.toLowerCase().includes(search.toLowerCase()))
  );

  const totalLogs = filteredLogs.length;
  const totalPages = Math.ceil(totalLogs / logsPerPage);
  const startIdx = (currentPage - 1) * logsPerPage;
  const endIdx = Math.min(startIdx + logsPerPage, totalLogs);
  const currentLogs = filteredLogs.slice(startIdx, endIdx);

  const handlePrev = () => setCurrentPage((p) => Math.max(p - 1, 1));
  const handleNext = () => setCurrentPage((p) => Math.min(p + 1, totalPages));

  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-semibold text-gray-800">System Logs</h1>
          <p className="text-gray-500 mt-1">Monitor system activity</p>
        </div>

        {/* Backup Card */}

        {/* Logs Table */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Activity Logs</h2>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1 border rounded-lg focus:outline-none focus:ring focus:ring-indigo-200 text-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">
                    User
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">
                    Action
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">
                    Details
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 uppercase">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      Loading logs...
                    </td>
                  </tr>
                ) : currentLogs.length > 0 ? (
                  currentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{log.user_name || "System"}</td>
                      <td className="px-4 py-2">{log.action}</td>
                      <td className="px-4 py-2 text-gray-500 text-sm">
                        {log.details}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={log.status} />
                      </td>
                      <td className="px-4 py-2 text-gray-500 text-sm">
                        {timeAgo(log.created_at)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No logs found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4 text-gray-600 text-sm">
            <div>
              Showing {startIdx + 1}-{endIdx} of {totalLogs}
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded border ${
                  currentPage === 1
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                Prev
              </button>
              <button
                onClick={handleNext}
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded border ${
                  currentPage === totalPages
                    ? "bg-gray-200 cursor-not-allowed"
                    : "bg-white hover:bg-gray-100"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
