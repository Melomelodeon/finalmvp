import React, { useEffect, useState } from "react";
import axios from "axios";

import { API_BASE } from "../config";

import {
  Users,
  Clock,
  Calendar,
  BookOpen,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Helper ---
const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// --- Button Component ---
const Button = ({ children, onClick, className = "", disabled = false }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:shadow-md transition duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      disabled
        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
        : className.includes("bg-")
        ? className
        : "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500"
    }`}
  >
    {children}
  </button>
);

// --- Main Page ---
const MenteesPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [activeMentees, setActiveMentees] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const currentMentorId = Number(localStorage.getItem("user_id")); // convert to number

  // --- Fetch mentorships ---
  const fetchMentorships = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/mentorship`);
      const all = res.data;

      setActiveMentees(
        all.filter(
          (m) => m.status === "active" && m.mentor_id === currentMentorId
        )
      );
      setPendingRequests(
        all.filter(
          (m) => m.status === "pending" && m.mentor_id === currentMentorId
        )
      );
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentorships();
  }, []);

  const handleRequest = async (id, action) => {
    try {
      const baseURL = `${API_BASE}/api/mentorships`; // full backend URL

      if (action === "accept") {
        await axios.put(`${baseURL}/${id}`, { status: "Active" }); // capital A
      } else if (action === "reject") {
        await axios.put(`${baseURL}/${id}`, { status: "Reject" }); // mark as rejected
      }

      // Refresh lists after action
      fetchMentorships();
    } catch (err) {
      console.error("Error updating mentorship:", err);
    }
  };

  // --- Cards ---
  const ActiveMenteeCard = ({ mentee }) => (
    <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row gap-5 shadow-md hover:shadow-xl transition duration-300">
      {/* Profile Picture */}
      <div className="w-16 h-16 flex-shrink-0">
        <img
          src={mentee.profile_image || "/default-profile.png"} // fallback image
          alt={mentee.full_name}
          className="w-full h-full rounded-full object-cover"
        />
      </div>

      <div className="flex-1">
        <h2 className="text-xl font-semibold text-gray-900 mb-1">
          {mentee.full_name} {/* Display full name */}
        </h2>
        <p className="text-sm text-indigo-600 mb-3 font-medium flex items-center">
          <BookOpen className="w-4 h-4 mr-1" /> {mentee.subject}
        </p>
        <div className="flex gap-3">
          <Button onClick={() => navigate("/schedule")}>
            Schedule Session
          </Button>
        </div>
      </div>
    </div>
  );

  const PendingRequestCard = ({ request }) => (
    <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center">
      <div className="flex items-center flex-1 mb-4 sm:mb-0 gap-4">
        {/* Profile Picture */}
        <div className="w-12 h-12 flex-shrink-0">
          <img
            src={request.profile_image || "/default-profile.png"} // fallback
            alt={request.full_name}
            className="w-full h-full rounded-full object-cover"
          />
        </div>

        <div>
          <h3 className="font-semibold text-lg text-gray-900">
            {request.full_name}
          </h3>
          <p className="text-sm text-indigo-600 font-medium mb-1 flex items-center">
            <BookOpen className="w-4 h-4 mr-1" /> {request.subject}
          </p>
          <p className="text-gray-400 text-xs">
            Requested: {formatDate(request.created_at)}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-shrink-0">
        <Button
          className="bg-green-600 text-white hover:bg-green-700"
          onClick={() => handleRequest(request.id, "accept")}
        >
          Accept
        </Button>
        <Button
          className="bg-red-600 text-white hover:bg-red-700"
          onClick={() => handleRequest(request.id, "reject")}
        >
          Reject
        </Button>
      </div>
    </div>
  );

  if (loading) return <p>Loading mentorships...</p>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      <h1 className="text-4xl font-extrabold text-gray-900 mb-8">My Mentees</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          className={`px-6 py-3 font-semibold transition duration-200 ${
            activeTab === "active"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-indigo-600"
          }`}
          onClick={() => setActiveTab("active")}
        >
          Active Mentees ({activeMentees.length})
        </button>
        <button
          className={`px-6 py-3 font-semibold transition duration-200 ${
            activeTab === "pending"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-indigo-600"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending Requests ({pendingRequests.length})
        </button>
      </div>

      {/* Content */}
      <div className="pb-12">
        {activeTab === "active" && activeMentees.length === 0 && (
          <p className="text-gray-400 text-lg py-10 italic col-span-full text-center">
            You have no active mentees.
          </p>
        )}
        {activeTab === "active" && activeMentees.length > 0 && (
          <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-2">
            {activeMentees.map((m) => (
              <ActiveMenteeCard key={m.id} mentee={m} />
            ))}
          </div>
        )}

        {activeTab === "pending" && pendingRequests.length === 0 && (
          <p className="text-gray-400 text-lg py-10 italic col-span-full text-center">
            No pending requests at the moment.
          </p>
        )}
        {activeTab === "pending" && pendingRequests.length > 0 && (
          <div className="grid gap-6">
            {pendingRequests.map((r) => (
              <PendingRequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MenteesPage;
