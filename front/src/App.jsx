// App.jsx
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

// Dashboards
import AdminDashboard from "./AdminDashboard";
import StudentDashboard from "./StudentDashboard";

// Pages
import PeerConnectLanding from "./AuthPage";
import ProfilePage from "./pages/ProfilePage";
import GroupsPage from "./pages/GroupsPage";
import GroupView from "./pages/GroupView";
import ForumPage from "./pages/ForumPage";
import ForumPost from "./pages/ForumPost";

import ApproveMentors from "./pages/ApproveMentors";
import Announcements from "./pages/Announcement";
import SystemLogs from "./pages/SystemLogs";
// import NotificationsPage from "./pages/NotificationPage";
import MentorshipPage from "./pages/Mentorship";
import MenteesPage from "./pages/Mentees";
import StudentProgress from "./pages/StudentProgress";
import FeedbackDashboard from "./pages/Feedback";
import MentorDashboard from "./MentorDashbaord";
import UserManagement from "./pages/UserManagement";
import SessionPage from "./pages/SessionPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true); //  added loading state

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedRole = localStorage.getItem("user_role");
    const savedToken = localStorage.getItem("auth_token");

    if (savedUser && savedRole && savedToken) {
      const parsedUser = JSON.parse(savedUser);
      parsedUser.role = savedRole;
      setUser(parsedUser);
    }

    // Mock notifications
    const mockData = [
      {
        id: 1,
        title: "Welcome!",
        message: "You have joined PeerConnect 🎉",
        is_read: false,
        created_at: "2025-11-05T10:00:00Z",
      },
      {
        id: 2,
        title: "New Mentor!",
        message: "A new mentor has joined your field",
        is_read: true,
        created_at: "2025-11-04T08:30:00Z",
      },
    ];
    setNotifications(mockData);
    setUnreadCount(mockData.filter((n) => !n.is_read).length);

    setLoading(false); // ✅ mark as loaded
  }, []);

  // Layout wrapper
  const Layout = ({ children }) => {
    const location = useLocation();
    const isLanding = location.pathname === "/";
    return (
      <div className="flex h-screen bg-gray-100">
        {!isLanding && user && (
          <div className="w-64 bg-white border-r">
            <Sidebar user={user} />
          </div>
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          {!isLanding && user && (
            <Topbar
              user={user}
              notifications={notifications}
              unreadCount={unreadCount}
            />
          )}

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    );
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading...
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          {/* Landing / Auth Page */}
          <Route
            path="/"
            element={
              <PeerConnectLanding
                onLoginSuccess={(userData) => {
                  const u = userData?.user || userData || null;
                  if (u) setUser(u);
                }}
              />
            }
          />

          <Route
            path="/admin-dashboard"
            element={
              user?.role === "Admin" ? <AdminDashboard /> : <Navigate to="/" />
            }
          />
          <Route
            path="/mentor-dashboard"
            element={
              user?.role === "Mentor" ? (
                <MentorDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />
          <Route
            path="/schedule"
            element={
              user?.role === "Mentor" ? <SessionPage /> : <Navigate to="/" />
            }
          />

          <Route
            path="/mentee-dashboard"
            element={
              user?.role === "Mentee" ? (
                <StudentDashboard />
              ) : (
                <Navigate to="/" />
              )
            }
          />

          {/* Shared Pages */}
          <Route
            path="/profile"
            element={user ? <ProfilePage /> : <Navigate to="/" />}
          />
          <Route
            path="/forum"
            element={user ? <ForumPage /> : <Navigate to="/" />}
          />
          <Route
            path="/forum/:id"
            element={user ? <ForumPost /> : <Navigate to="/" />}
          />
          <Route
            path="/group"
            element={user ? <GroupsPage /> : <Navigate to="/" />}
          />
          <Route
            path="/group/:id"
            element={user ? <GroupView /> : <Navigate to="/" />}
          />

          {/* <Route
            path="/notifications"
            element={user ? <NotificationsPage /> : <Navigate to="/" />}
          /> */}
          <Route
            path="/mentees"
            element={user ? <MenteesPage /> : <Navigate to="/" />}
          />
          <Route
            path="/progress"
            element={user ? <StudentProgress /> : <Navigate to="/" />}
          />
          <Route
            path="/feedback"
            element={user ? <FeedbackDashboard /> : <Navigate to="/" />}
          />

          {/* Admin-only Pages */}
          <Route
            path="/admin-users"
            element={
              user?.role === "Admin" ? <UserManagement /> : <Navigate to="/" />
            }
          />
          <Route
            path="/dashboard"
            element={
              user?.role === "Admin" ? (
                <AdminDashboard />
              ) : user?.role === "Mentor" ? (
                <MentorDashboard />
              ) : (
                <StudentDashboard />
              )
            }
          />

          <Route
            path="/admin-mentors"
            element={
              user?.role === "Admin" ? <ApproveMentors /> : <Navigate to="/" />
            }
          />
          <Route
            path="/admin-logs"
            element={
              user?.role === "Admin" ? <SystemLogs /> : <Navigate to="/" />
            }
          />

          {/* Common Pages */}
          <Route
            path="/announcements"
            element={user ? <Announcements /> : <Navigate to="/" />}
          />
          <Route
            path="/mentorship"
            element={user ? <MentorshipPage /> : <Navigate to="/" />}
          />

          {/* 404 Fallback */}
          <Route path="*" element={<div>404 - Page Not Found</div>} />
        </Routes>
      </Layout>
    </Router>
  );
}
