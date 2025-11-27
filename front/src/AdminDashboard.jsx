import React, { useEffect, useState } from "react";
import { Users, GraduationCap, BookOpen, MessageCircle } from "lucide-react";
import axios from "axios";
import Footer from "./components/Footer";

import { API_BASE } from "./config";
import ChatbotWidget from "./components/ChatbotWidget";

export default function AdminDashboard() {
  const [totalUser, setTotalUsers] = useState(0);
  const [active_mentors, setActiveMentors] = useState(0);
  const [total_groups, setTotalGroups] = useState(0);
  const [forum_posts, setForumPosts] = useState(40);
  const [pending_Mentors, setPendingMentors] = useState([]);
  useEffect(() => {
    axios
      .get(`${API_BASE}/api/users/total`) // your PHP endpoint
      .then((res) => {
        setTotalUsers(res.data.total); // save to state
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
    axios
      .get(`${API_BASE}/api/users/totalmentor`) // your PHP endpoint
      .then((res) => {
        setActiveMentors(res.data.total); // save to state
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
    axios
      .get(`${API_BASE}/api/groups/total_groups`) // your PHP endpoint
      .then((res) => {
        setTotalGroups(res.data.total); // save to state
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
    axios
      .get(`${API_BASE}/api/forum/total-posts`) // your PHP endpoint
      .then((res) => {
        setForumPosts(res.data.total_posts); // save to state
      })
      .catch((err) => {
        console.error("Error fetching users:", err);
      });
  }, []);

  const [recentUsers, setRecentUsers] = useState([]);

  const [distribution, setDistribution] = useState([]);
  const [logs, setLogs] = useState([]);
  const [backupStatus, setBackupStatus] = useState("");

  useEffect(() => {
    // Fetch recent users
    axios
      .get(`${API_BASE}/api/users/recent`) // create this endpoint in PHP
      .then((res) => setRecentUsers(res.data))
      .catch((err) => console.error("Error fetching recent users:", err));

    // // // Fetch pending mentors
    axios
      .get(`${API_BASE}/api/users/pendingMentors`)
      .then((res) => setPendingMentors(res.data))
      .catch((err) => console.error("Error fetching pending mentors:", err));

    // // // // Fetch user distribution
    axios
      .get(`${API_BASE}/api/users/distribution`)
      .then((res) => setDistribution(res.data))
      .catch((err) => console.error("Error fetching distribution:", err));

    // // Fetch system logs
    axios
      .get(`${API_BASE}/api/logs`) // create this endpoint
      .then((res) => setLogs(res.data))
      .catch((err) => console.error("Error fetching logs:", err));
  }, []);

  const timeAgo = (dateString) => {
    const diff = (Date.now() - new Date(dateString)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const approveMentor = (userId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this mentor?`))
      return;
    alert(`Mentor ${userId} marked as ${status}`);
  };

  const totalUsers = distribution.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* --- Stats --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          color="bg-blue-500"
          icon={<Users className="text-white" />}
          value={totalUser}
          label="Total Users"
        />
        <StatCard
          color="bg-green-500"
          icon={<GraduationCap className="text-white" />}
          value={active_mentors}
          label="Active Mentors"
        />
        <StatCard
          color="bg-purple-500"
          icon={<BookOpen className="text-white" />}
          value={total_groups}
          label="Active Groups"
        />
        <StatCard
          color="bg-orange-500"
          icon={<MessageCircle className="text-white" />}
          value={forum_posts}
          label="Forum Posts"
        />
      </div>

      {/* --- Pending Alert --- */}
      {pending_Mentors > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-lg shadow-sm">
          ⚠️ You have {pending_Mentors} pending mentor approval(s).
          <button className="ml-4 text-blue-600 font-medium hover:underline">
            Review Now
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <DataCard title="Recent Users" linkText="Manage All">
          <ModernTable
            headers={["Name", "Role", "Status", "Joined"]}
            rows={recentUsers.map((u, i) => [
              <div key={i} className="flex items-center gap-2">
                {u.profile_image ? (
                  <img
                    src={u.profile_image}
                    alt={`${u.first_name} ${u.last_name}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">
                    {u.first_name.charAt(0)}
                  </div>
                )}
                <span>
                  {u.first_name} {u.last_name}
                </span>
              </div>,
              <span className="capitalize">{u.role}</span>,
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  u.status === "active"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {u.status}
              </span>,
              u.created_at,
            ])}
          />
        </DataCard>

        {/* --- Pending Mentors --- */}
        {pending_Mentors > 0 && (
          <DataCard title="Pending Mentor Approvals" linkText="View All">
            <ModernTable
              headers={["Name", "Subjects", "Actions"]}
              rows={pending_Mentors.map((m) => [
                <div key={m.id}>
                  <strong>{m.name}</strong>
                  <br />
                  <small className="text-gray-500">{m.email}</small>
                </div>,
                m.subjects,
                <div className="flex gap-2">
                  <button
                    onClick={() => approveMentor(m.id, "approved")}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => approveMentor(m.id, "rejected")}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition"
                  >
                    Reject
                  </button>
                </div>,
              ])}
            />
          </DataCard>
        )}

        {/* --- Distribution --- */}
        <DataCard title="User Distribution">
          <ModernTable
            headers={["Role", "Count", "Percentage"]}
            rows={distribution.map((d, i) => {
              const percent = totalUsers
                ? ((d.count / totalUsers) * 100).toFixed(1)
                : 0;
              return [
                <span className="capitalize">{d.role}</span>,
                d.count,
                <div className="flex items-center gap-2 w-full">
                  <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-2"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{percent}%</span>
                </div>,
              ];
            })}
          />
        </DataCard>

        {/* --- Logs --- */}
        <DataCard title="Recent Activity Logs" linkText="View All">
          <ModernTable
            headers={["User", "Action", "Status", "Time"]}
            rows={logs.map((log) => [
              log.name || "System",
              log.action,
              <span
                className={`px-2 py-1 rounded text-xs font-medium ${
                  log.status === "success"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {log.status}
              </span>,
              <span className="text-xs text-gray-500">
                {timeAgo(log.created_at)}
              </span>,
            ])}
          />
        </DataCard>
        {/* --- Quick Actions --- */}
        <TopUsers
          topMentor={{
            name: "Jane Mentor",
            email: "jane@peerconnect.com",
            icon: "🎓",
            sessions: 12,
          }}
          topMentee={{
            name: "Bob Student",
            email: "bob@student.com",
            icon: "📚",
            courses: 8,
          }}
        />
      </div>
    </div>
  );
}

/* ---------- COMPONENTS ---------- */
function StatCard({ color, icon, value, label }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition flex items-center gap-4 border border-gray-100">
      <div className={`p-3 rounded-full ${color}`}>{icon}</div>
      <div>
        <h3 className="text-2xl font-bold">{value}</h3>
        <p className="text-gray-600">{label}</p>
      </div>
    </div>
  );
}

function DataCard({ title, linkText, children }) {
  return (
    <div className="bg-white shadow-md rounded overflow-hidden border border-gray-100">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
        <h2 className="font-semibold text-lg">{title}</h2>
        {linkText && (
          <button className="text-blue-500 text-sm font-medium hover:underline">
            {linkText}
          </button>
        )}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function ModernTable({ headers = [], rows = [] }) {
  // Limit visible rows to 5
  const visibleRows = rows.slice(0, 5);

  return (
    <div className="bg-white shadow-sm  overflow-hidden">
      <div className="overflow-y-auto max-h-[300px]">
        <table className="min-w-full text-sm text-gray-700">
          {/* Table Header */}
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              {headers.map((h, i) => (
                <th
                  key={i}
                  className="py-3 px-4 text-left font-semibold text-gray-600 uppercase tracking-wide border-b border-gray-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {visibleRows.length > 0 ? (
              visibleRows.map((cols, i) => (
                <tr
                  key={i}
                  className={`hover:bg-blue-50 transition-colors duration-150 ${
                    i % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  {cols.map((cell, j) => (
                    <td
                      key={j}
                      className="py-3 px-4 border-b border-gray-100 align-middle"
                    >
                      {typeof cell === "string" ? (
                        cell
                      ) : (
                        <div className="flex items-center space-x-2">
                          {cell}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={headers.length}
                  className="py-6 text-center text-gray-400 italic"
                >
                  No records available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function TopUsers({ topMentor, topMentee }) {
  return (
    <div className="space-y-4 bg-slate-100 p-4 rounded-lg border border-gray-200">
      {/* Heading */}
      <h2 className="font-semibold text-lg">Top Users</h2>

      {/* Grid for Mentor and Mentee */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Top Mentor */}
        <div className="bg-white shadow-md border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-3xl mb-2">{topMentor.icon}</div>
          <span className="text-sm font-medium text-gray-700 text-center">
            Top Mentor
          </span>
          <h3 className="mt-2 font-semibold">{topMentor.name}</h3>
          <p className="text-xs text-gray-500">{topMentor.email}</p>
          <span className="mt-2 inline-block bg-green-100 text-green-700 px-2 py-1 text-xs rounded-full">
            Sessions: {topMentor.sessions}
          </span>
        </div>

        {/* Top Mentee */}
        <div className="bg-white shadow-md border border-gray-100 rounded-lg p-4 flex flex-col items-center justify-center">
          <div className="text-3xl mb-2">{topMentee.icon}</div>
          <span className="text-sm font-medium text-gray-700 text-center">
            Top Mentee
          </span>
          <h3 className="mt-2 font-semibold">{topMentee.name}</h3>
          <p className="text-xs text-gray-500">{topMentee.email}</p>
          <span className="mt-2 inline-block bg-blue-100 text-blue-700 px-2 py-1 text-xs rounded-full">
            Courses Completed: {topMentee.courses}
          </span>
        </div>
      </div>
      <ChatbotWidget />
    </div>
  );
}
