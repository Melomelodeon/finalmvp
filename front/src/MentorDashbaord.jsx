import React, { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE } from "./config";
import {
  Users,
  Calendar,
  Star,
  Clock,
  Check,
  X,
  ArrowRight,
} from "lucide-react";
import WeatherWidget from "./components/WeatherWidget";

// --- HELPER COMPONENTS ---
const StarRating = ({ rating }) => (
  <div className="flex text-lg">
    {[...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 transition-colors duration-150 ${
          i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
        }`}
      />
    ))}
  </div>
);

const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

const formatSessionDate = (dateStr) => {
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white p-5 rounded-xl shadow-lg flex items-center justify-between transition hover:shadow-xl hover:scale-[1.02]">
    <div className="flex items-center">
      <div className={`p-3 rounded-full ${color} text-white mr-4 shadow-md`}>
        <Icon size={24} />
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-900 leading-none">
          {value}
        </h3>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      </div>
    </div>
  </div>
);

const Card = ({ title, children, link, id }) => (
  <div
    id={id}
    className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
  >
    <div className="flex justify-between items-center p-5 border-b border-gray-100">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      {link && (
        <a
          href={link.href}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
        >
          {link.text}
        </a>
      )}
    </div>
    <div className="p-5">{children}</div>
  </div>
);

const EmptyState = ({ icon: Icon, title, message }) => (
  <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-dashed border-2 border-gray-200">
    <Icon size={32} className="mx-auto text-indigo-400 mb-3" />
    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    <p className="mt-1 text-sm">{message}</p>
  </div>
);

// --- MAIN COMPONENT ---
export default function MentorDashboard() {
  const [dashboardData, setDashboardData] = useState({
    active_mentees: 0,
    upcoming_sessions: 0,
    feedback_score: 0,
    pending_requests: 0,
  });
  const [pendingRequests, setPendingRequests] = useState([]);
  const [mentees, setMentees] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const API_URL = `${API_BASE}`;
  const user = JSON.parse(localStorage.getItem("user"));
  const fetchSessions = async () => {
    if (!user) return;

    try {
      // Fetch groups
      const res = await fetch(`${API_URL}/api/groups?mentor_id=${user.id}`);
      const groups = await res.json();
      const groupForMentor = groups.find((g) => g.instructor_id === user.id);
      if (!groupForMentor) return;

      // Fetch sessions for this group
      const resSessions = await fetch(
        `${API_URL}/api/sessions/${groupForMentor.id}`
      );
      const sessionsData = await resSessions.json();
      setSessions(
        Array.isArray(sessionsData.sessions) ? sessionsData.sessions : []
      );

      // Update upcoming sessions count
      setDashboardData((prev) => ({
        ...prev,
        upcoming_sessions: Array.isArray(sessionsData.sessions)
          ? sessionsData.sessions.length
          : 0,
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMentorships = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/mentorship`);
      const all = res.data;
      // Filter only active and pending mentees
      const activeMentees = all.filter(
        (m) => m.status.toLowerCase() === "active" || m.id === user.id
      );
      const pending = all.filter((m) => m.status.toLowerCase() === "pending");

      setMentees(activeMentees);
      setPendingRequests(pending);

      setDashboardData((prev) => ({
        ...prev,
        active_mentees: activeMentees.length,
        pending_requests: pending.length,
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorships();
    fetchSessions();
  }, []);

  // Handle accept/reject mentorship requests
  const handleRequest = async (requestId, action) => {
    try {
      if (action === "reject") {
        const rejectionConfirmed = prompt(
          "To reject this request, please type 'REJECT' (case sensitive)."
        );
        if (rejectionConfirmed !== "REJECT") {
          setToast({ message: "Rejection cancelled.", type: "error" });
          return;
        }
      }

      // API call
      await axios.post(
        `${API_BASE}/api/mentors/${requestId}/${action}`
      );

      setToast({
        message:
          action === "accept"
            ? "Request accepted! The mentee is now active."
            : "Request rejected successfully.",
        type: "success",
      });

      // Refresh mentorship data
      fetchMentorships();
    } catch (err) {
      console.error(err);
      setToast({ message: "Failed to process request.", type: "error" });
    }
  };

  // Toast disappearance effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <div className="min-h-screen font-sans">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-2">
          Mentor Dashboard
        </h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Active Mentees"
            value={dashboardData.active_mentees}
            icon={Users}
            color="bg-blue-600"
          />
          <StatCard
            title="Upcoming Sessions"
            value={dashboardData.upcoming_sessions}
            icon={Calendar}
            color="bg-green-600"
          />
          <StatCard
            title="Feedback Score"
            value={`${dashboardData.feedback_score}/5.0`}
            icon={Star}
            color="bg-purple-600"
          />
          <StatCard
            title="Pending Requests"
            value={dashboardData.pending_requests}
            icon={Clock}
            color="bg-orange-600"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Actions */}
            {/*
            <Card title="Quick Actions">
              <div className="flex flex-wrap gap-4">
                <a
                  href="/mentees"
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 relative"
                >
                  Approve Requests
                  {dashboardData.pending_requests > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {dashboardData.pending_requests}
                    </span>
                  )}
                </a>
                <a
                  href="/schedule"
                  className="flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl shadow-md text-white bg-green-600 hover:bg-green-700 transition duration-150"
                >
                  Schedule Session
                </a>
                <a
                  href="/feedback"
                  className="flex items-center justify-center px-6 py-3 border border-gray-300 text-base font-semibold rounded-xl shadow-md text-gray-700 bg-white hover:bg-gray-50 transition duration-150"
                >
                  View Feedback
                </a>
              </div>
            </Card>
                  */}

            {/* Pending Mentorship Requests
            {pendingRequests.length > 0 && (
              <Card title="Pending Mentorship Requests" id="mentees-pending">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {pendingRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-indigo-50/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {request.first_name} {request.last_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                          {request.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleRequest(request.id, "accept")}
                            className="text-white bg-green-500 hover:bg-green-600 font-semibold py-1 px-3 rounded-lg text-xs mr-2 transition duration-150 shadow-md"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleRequest(request.id, "reject")}
                            className="text-white bg-red-500 hover:bg-red-600 font-semibold py-1 px-3 rounded-lg text-xs transition duration-150 shadow-md"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )} */}

            {/* My Mentees */}
            <Card
              title="My Mentees"
              link={{ href: "/mentees", text: "View All" }}
            >
              {mentees.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No Active Mentees"
                  message="Accept mentorship requests to start mentoring!"
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                    
                     
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {mentees.map((mentee) => (
                      <tr key={mentee.id} className="hover:bg-indigo-50/20">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 text-indigo-700 rounded-full flex items-center justify-center font-bold text-sm">
                              {mentee.full_name
                                ? mentee.full_name.charAt(0).toUpperCase()
                                : "?"}
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {mentee.full_name || "Unknown"}
                            </div>
                          </div>
                        </td>
                       
                        {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`#mentee-view-${mentee.id}`}
                            className="text-white bg-indigo-500 hover:bg-indigo-600 font-semibold py-1.5 px-3 rounded-xl text-sm transition duration-150 shadow-md"
                          >
                            View Report
                          </a>
                        </td> */}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-1 space-y-8">
            {/* Weather Widget */}
            <WeatherWidget city="Manila,PH" className="mb-6" />
            
            {/* Upcoming Sessions */}
            <Card
              title="Upcoming Sessions"
              link={{ href: "/schedule", text: "View Session" }}
            >
              {sessions.length === 0 ? (
                <p className="text-gray-400 text-center py-8">
                  No upcoming sessions
                </p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className="py-4 flex items-start space-x-3 hover:bg-gray-50 transition duration-150"
                    >
                      <div className="flex-shrink-0 mt-1">
                        <Calendar size={20} className="text-indigo-500" />
                      </div>
                      <div className="flex-grow">
                        <div className="text-sm font-semibold text-gray-900 leading-snug">
                          {session.title}{" "}
                          {session.student_name && ` - ${session.student_name}`}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatSessionDate(session.session_date)}
                        </div>
                        {session.meeting_link && (
                          <a
                            href={session.meeting_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center mt-1"
                          >
                            Join Meeting{" "}
                            <ArrowRight size={14} className="ml-1" />
                          </a>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-2xl text-white font-semibold flex items-center space-x-3 transition-opacity duration-300 ${
            toast.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {toast.type === "success" ? <Check size={20} /> : <X size={20} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
