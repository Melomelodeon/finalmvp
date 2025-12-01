// Sidebar.jsx
import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Users,
  MessageCircle,
  CalendarDays,
  GraduationCap,
  TrendingUp,
  Star,
  Megaphone,
  BarChart3,
  ClipboardList,
  Bell,
  CheckCircle,
  DatabaseBackup,
} from "lucide-react";
import Footer from "./Footer";

/**
 * Sidebar navigation component
 * - Displays dynamic links based on user role
 * - Later you can replace the mock counts (pending mentors, mentees)
 *   with real API calls to your backend.
 */
export default function Sidebar({ user }) {
  const [pendingMentees, setPendingMentees] = useState(0);
  const [pendingMentors, setPendingMentors] = useState(0);

  // Simulate data fetching for role-specific notifications
  useEffect(() => {
    if (user?.role === "mentor") setPendingMentees(2);
    if (user?.role === "admin") setPendingMentors();
  }, [user?.role]);

  const toggleSidebar = () => {
    document.getElementById("sidebar")?.classList.toggle("-translate-x-full");
  };

  // If user is not loaded yet
  if (!user) {
    return (
      <aside className="bg-slate-50 text-slate-700 w-64 min-h-screen flex flex-col items-center justify-center shadow-md">
        <div className="text-2xl font-semibold mb-2 text-blue-500">
          PeerConnect
        </div>
        <p className="text-slate-400 animate-pulse">Loading...</p>
      </aside>
    );
  }

  return (
    <aside
      id="sidebar"
      className="fixed md:static left-0 top-0 z-40 w-64 h-full bg-white text-slate-800 shadow-lg border-r border-slate-200 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <h2 className="text-xl font-bold text-blue-600 tracking-wide">
          PeerConnect
        </h2>
        <button
          onClick={toggleSidebar}
          className="text-slate-500 hover:text-blue-600 text-2xl font-bold md:hidden"
        >
          ×
        </button>
      </div>

      {/* Navigation (take all remaining space) */}
      <nav className="flex-1 flex flex-col p-4 space-y-1 overflow-y-auto">
        <SidebarLink
          to="/dashboard"
          icon={<LayoutDashboard />}
          text="Dashboard"
        />
        <SidebarLink to="/profile" icon={<User />} text="Profile" />
        <SidebarLink to="/group" icon={<User />} text="Study Groups" />
        <SidebarLink to="/forum" icon={<MessageCircle />} text="Forum" />

        {/* Role-based links */}
        {user.role === "Mentee" && (
          <>
            <SidebarLink
              to="/mentorship"
              icon={<GraduationCap />}
              text="Find Mentor"
            />
            {/* <SidebarLink
              to="/progress"
              icon={<TrendingUp />}
              text="My Progress"
            /> */}
          </>
        )}

        {user.role === "Mentor" && (
          <>
            <SidebarLink
              to="/mentees"
              icon={<Users />}
              text="My Mentees"
              badge={pendingMentees}
            />
            <SidebarLink
              to="/schedule"
              icon={<Users />}
              text="Session"
              badge={pendingMentees}
            />
            <SidebarLink to="/feedback" icon={<Star />} text="Feedback" />
          </>
        )}

        {user.role === "Admin" && (
          <>
            <SidebarLink
              to="/admin-users"
              icon={<Users />}
              text="User Management"
            />
            <SidebarLink
              to="/admin-mentors"
              icon={<CheckCircle />}
              text="Approve Mentors"
              badge={pendingMentors}
            />
            <SidebarLink
              to="/admin-logs"
              icon={<ClipboardList />}
              text="System Logs"
            />
            <SidebarLink
              to="/announcements"
              icon={<Megaphone />}
              text="Announcements"
            />
          </>
        )}

        {/* <SidebarLink to="/notifications" icon={<Bell />} text="Notifications" /> */}
      </nav>

      {/* Footer at the bottom */}
      <div className="mt-auto">
        <Footer />
      </div>
    </aside>
  );
}

/**
 * SidebarLink — reusable navigation link
 * Highlights when active, shows optional badge
 */
function SidebarLink({ to, icon, text, badge }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-blue-100 text-blue-700 font-semibold"
            : "hover:bg-blue-50 hover:text-blue-600 text-slate-700"
        }`
      }
    >
      <div className="flex items-center space-x-3">
        <span className="w-5 h-5">{icon}</span>
        <span>{text}</span>
      </div>
      {badge > 0 && (
        <span className="bg-blue-500 text-xs text-white px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );
}
