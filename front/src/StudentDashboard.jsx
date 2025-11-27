import React, { useState, useEffect } from "react";
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  MessageSquare,
  ArrowRight,
  User,
} from "lucide-react";
import ChatbotWidget from "./components/ChatbotWidget";

// --- HELPER FUNCTIONS ---
const timeAgo = (dateStr) => {
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

const formatSessionDate = (dateStr) =>
  new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

// --- REUSABLE COMPONENTS ---
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

const Card = ({ title, children, link }) => (
  <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
export default function StudentDashboard({ user }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch sessions joined by the student
  useEffect(() => {
    if (!user?.id) return;

    const fetchSessions = async () => {
      try {
        const response = await fetch(
          `http://localhost/backend/api/sessions/user/${user.id}`
        );
        const data = await response.json();

        // Optional: filter only upcoming sessions
        const upcoming = data.filter(
          (s) => new Date(s.session_date) >= new Date()
        );

        setSessions(upcoming);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  return (
    <div className="min-h-screen font-sans bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-8 border-b pb-2">
          Welcome back, {user?.name || "Student"}!
        </h1>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          <StatCard
            title="Upcoming Sessions"
            value={sessions.length}
            icon={Calendar}
            color="bg-green-600"
          />
          <StatCard
            title="Groups Joined"
            value={3}
            icon={Users}
            color="bg-blue-600"
          />
          <StatCard
            title="Study Hours This Week"
            value="5.5h"
            icon={Clock}
            color="bg-purple-600"
          />
        </div>

        {/* Upcoming Sessions */}
        <Card
          title="Upcoming Sessions"
          link={{ href: "#all-sessions", text: "View All" }}
        >
          {loading ? (
            <p className="text-gray-400 text-center py-8">Loading...</p>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No Upcoming Sessions"
              message="Once you join a group, upcoming sessions will appear here."
            />
          ) : (
            <ul className="divide-y divide-gray-200">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="py-4 flex items-start space-x-3 hover:bg-gray-50 transition duration-150"
                >
                  <div className="flex-shrink-0 mt-1">
                    <Calendar size={20} className="text-indigo-500" />
                  </div>
                  <div className="flex-grow">
                    <div className="text-sm font-semibold text-gray-900 leading-snug">
                      {s.title} —{" "}
                      {s.type === "group" ? "Group Session" : "Solo"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatSessionDate(s.session_date)} · {s.duration} mins
                    </div>
                    {s.meeting_link && (
                      <a
                        href={s.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center mt-1"
                      >
                        Join Meeting
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
      <ChatbotWidget />
    </div>
  );
}
