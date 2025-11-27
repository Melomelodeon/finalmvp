import React, { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE } from "../config";

export default function Topbar({ user }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false); // <-- add this
  const timeAgo = (dateString) => {
    const diff = (Date.now() - new Date(dateString)) / 1000;
    if (diff < 60) return `${Math.floor(diff)}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Fetch announcements (polling every 10s)
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const res = await axios.get(`${API_BASE}/api/announcements`);
        const now = new Date();

        // Filter relevant announcements
        const filtered = res.data.filter(
          (a) =>
            (!a.target_role ||
              a.target_role === user.role ||
              user.role === "Admin") &&
            (!a.expiry_date || new Date(a.expiry_date) > now)
        );

        setNotifications(filtered);
        setUnreadCount(filtered.filter((a) => !a.is_read).length);
      } catch (err) {
        console.error("Failed to fetch announcements:", err);
      }
    };

    fetchAnnouncements(); // initial fetch
    const interval = setInterval(fetchAnnouncements, 10000); // every 10s
    return () => clearInterval(interval);
  }, [user.role]);

  return (
    <header className="flex items-center justify-between bg-white shadow px-6 py-3 relative">
      {/* Left side */}
      <div className="text-lg font-semibold">📚 PeerConnect Dashboard</div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <div className="relative">
          <button
            className="text-xl"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            🔔
          </button>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
              {unreadCount}
            </span>
          )}

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-10 border">
              <div className="p-3 border-b font-semibold">Announcements</div>
              <div className="max-h-60 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-3 text-gray-500 text-sm">
                    No new announcements
                  </div>
                ) : (
                  notifications.map((a) => (
                    <div
                      key={a.id}
                      className={`p-3 border-b hover:bg-gray-50 ${
                        !a.is_read ? "bg-blue-50" : ""
                      }`}
                    >
                      <div className="font-medium">{a.title}</div>
                      <div className="text-sm text-gray-600 whitespace-pre-wrap">
                        {a.description}
                      </div>
                      <div className="text-xs text-gray-400">
                        {timeAgo(a.created_at)}
                      </div>
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="p-2 text-center border-t">
                  <a href="/announcements" className="text-blue-500 text-sm">
                    View All
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            className="flex items-center gap-2"
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className="w-8 h-8 flex items-center justify-center bg-blue-500 text-white rounded-full">
              {user?.first_name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <span>
              {user
                ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                : "User"}
            </span>
            <span>▼</span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg z-10 border">
              <a
                href="/profile"
                className="block px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                Profile Settings
              </a>
              <button
                onClick={() => {
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = "/";
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
