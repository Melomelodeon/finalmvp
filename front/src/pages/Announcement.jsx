import React, { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE } from "../config";

// --- Modal Component ---
const Modal = ({ onClose, children }) => (
  <div
    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    onClick={onClose}
  >
    <div
      className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 md:p-8 relative transform transition-all duration-300 scale-100 opacity-100"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-900 text-2xl font-semibold transition"
      >
        &times;
      </button>
      {children}
    </div>
  </div>
);

// --- Helper Functions ---
const formatDate = (dateStr) =>
  dateStr ? new Date(dateStr).toLocaleDateString() : "";

const timeAgo = (dateStr) => {
  const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

// --- Main Component ---
export default function Announcements() {
  const API_BASE_URL = `${API_BASE}/api`; // LavaLust backend
  const [user, setUser] = useState(null);
  const [allAnnouncements, setAllAnnouncements] = useState([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    target_role: "",
    expiry_date: "",
  });
  const [alert, setAlert] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // --- Inside your Announcements component ---

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true);
      const userData = localStorage.getItem("user")
        ? JSON.parse(localStorage.getItem("user"))
        : null;
      const currentUser = userData?.data || userData;
      setUser(currentUser);

      const res = await axios.get(`${API_BASE_URL}/announcements`);
      const announcements = res.data;

      const now = new Date();
      const filtered = announcements
        .filter((a) => {
          if (a.expiry_date && new Date(a.expiry_date) < now) return false;
          return (
            !a.target_role ||
            a.target_role === currentUser?.role ||
            currentUser?.role === "Admin"
          );
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setAllAnnouncements(announcements);
      setFilteredAnnouncements(filtered);
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Failed to load data." });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Call fetchAnnouncements() in useEffect instead of inline code ---
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  // --- Update handleCreate to re-fetch announcements ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      setAlert({
        type: "error",
        message: "Title and Description are required.",
      });
      setTimeout(() => setAlert(null), 3000);
      return;
    }
    setIsSubmitting(true);

    try {
      await axios.post(`${API_BASE_URL}/announcements`, {
        ...form,
        created_by: user.id,
      });

      setForm({ title: "", description: "", target_role: "", expiry_date: "" });
      setShowCreateModal(false);
      setAlert({
        type: "success",
        message: "Announcement created successfully!",
      });
      setTimeout(() => setAlert(null), 3000);

      // REFRESH ANNOUNCEMENTS AFTER SUCCESS
      await fetchAnnouncements();
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Failed to create announcement." });
      setTimeout(() => setAlert(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete announcement
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?"))
      return;

    try {
      await axios.delete(`${API_BASE_URL}/announcements/${id}`);
      setAllAnnouncements((prev) => prev.filter((a) => a.id !== id));

      // REFRESH ANNOUNCEMENTS AFTER SUCCESS
      await fetchAnnouncements();
      setTimeout(() => setAlert(null), 3000);
    } catch (err) {
      console.error(err);
      setAlert({ type: "error", message: "Failed to delete announcement." });
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const isCreatorOrAdmin = (announcement) =>
    user?.role === "admin" || announcement.created_by === user?.id;

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-48 h-6 bg-gray-300 rounded-lg"></div>
          <div className="w-64 h-4 bg-gray-200 rounded-lg"></div>
          <div className="w-32 h-4 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              📢 Announcements
            </h1>
            <p className="text-gray-600 mt-1">
              Important updates for **{user.role}**
            </p>
          </div>
          {(user.role === "Admin" || user.role === "Mentor") && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium shadow hover:bg-indigo-700 transition transform hover:scale-105"
            >
              + New Announcement
            </button>
          )}
        </div>

        {/* Alerts */}
        {alert && (
          <div
            className={`p-4 mb-4 rounded-lg shadow-md transition-opacity duration-300 ${
              alert.type === "success"
                ? "bg-green-100 text-green-700 border-l-4 border-green-500"
                : alert.type === "error"
                ? "bg-red-100 text-red-700 border-l-4 border-red-500"
                : "bg-blue-100 text-blue-700 border-l-4 border-blue-500"
            }`}
          >
            {alert.message}
          </div>
        )}

        {/* Announcement List */}
        {filteredAnnouncements.length === 0 ? (
          <div className="bg-white shadow-xl rounded-xl p-10 text-center border-t-4 border-indigo-500">
            <div className="text-indigo-500 text-5xl mb-3">✨</div>
            <h2 className="font-bold text-gray-800 mb-2 text-xl">
              No relevant announcements found.
            </h2>
            <p className="text-gray-500">
              {user.role === "admin" || user.role === "instructor"
                ? "Create your first announcement."
                : "Check back later for updates."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredAnnouncements.map((a) => (
              <div
                key={a.id}
                className="bg-white shadow-lg rounded-xl p-5 border-l-4 border-indigo-500 hover:shadow-xl transition"
              >
                <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{a.title}</h2>
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 text-sm">
                      {timeAgo(a.created_at)}
                    </span>
                    {isCreatorOrAdmin(a) && (
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="px-3 py-1 text-xs bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                  {a.description}
                </p>
                <div className="flex justify-between items-center flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="text-gray-500">
                      Posted by: **{a.author_name}**
                    </span>
                    {a.created_by === 1 && (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Admin Post
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {a.expiry_date && (
                      <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                        Expires: {formatDate(a.expiry_date)}
                      </span>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        a.target_role
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {a.target_role
                        ? `Target: ${
                            a.target_role.charAt(0).toUpperCase() +
                            a.target_role.slice(1)
                          }`
                        : "For: Everyone"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Announcement Modal */}
      {showCreateModal && (
        <Modal onClose={() => setShowCreateModal(false)}>
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Create New Announcement
          </h2>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Title *"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <textarea
              placeholder="Description *"
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              rows={4}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              required
            />
            <select
              value={form.target_role}
              onChange={(e) =>
                setForm({ ...form, target_role: e.target.value })
              }
              className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition bg-white"
            >
              <option value="">Everyone</option>
              <option value="student">Students Only</option>
              <option value="mentor">Mentors Only</option>
              <option value="instructor">Instructors Only</option>
            </select>
            <label className="text-sm text-gray-600">
              Optional Expiry Date/Time:
              <input
                type="datetime-local"
                value={form.expiry_date}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
                min={new Date().toISOString().substring(0, 16)}
                className="mt-1 w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
              />
            </label>
            <div className="flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-5 py-2 text-white rounded-lg font-medium transition ${
                  isSubmitting
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {isSubmitting ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
