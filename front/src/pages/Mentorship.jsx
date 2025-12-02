import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { BookOpen, CheckCircle } from "lucide-react";

import { API_BASE } from "../config";

// Reusable Button
const Button = ({
  children,
  onClick,
  className = "",
  disabled = false,
  type = "button",
}) => (
  <button
    type={type}
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

// Notification Component
const NotificationMessage = ({ message, type, onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white ${
        type === "success"
          ? "bg-green-500"
          : type === "error"
          ? "bg-red-500"
          : "bg-indigo-500"
      }`}
    >
      <p className="font-semibold">{message}</p>
    </div>
  );
};

// Request Modal
const RequestMentorModal = ({ mentor, onClose, onSubmit }) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSubject("");
    setMessage("");
  }, [mentor]);

  if (!mentor) return null;
  const fullName = `${mentor.first_name} ${mentor.last_name}`;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    onSubmit(subject, message);
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">
          Request Mentorship: {fullName}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium">Subject/Topic *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border rounded px-3 py-2"
              rows={4}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button className="bg-gray-200 text-gray-700" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-indigo-600 text-white">
              Send Request
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Mentor Card (updated for My Mentor / Available)
const MentorCard = ({ mentor, onRequest, isMyMentor, onFeedback }) => {
  const fullName = `${mentor.first_name} ${mentor.last_name}`;
  const subjects = mentor.subjects?.join(", ") || "Not specified";

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-6 flex flex-col sm:flex-row gap-5 shadow-md hover:shadow-xl transition duration-300">
      {mentor.profile_image && (
        <img
          src={mentor.profile_image}
          alt={fullName}
          className="w-16 h-16 rounded-full flex-shrink-0"
        />
      )}
      <div className="flex-1">
        <h3 className="text-xl font-semibold mb-1">{fullName}</h3>
        <p className="text-sm text-indigo-600 mb-2 flex items-center">
          <BookOpen className="w-4 h-4 mr-1" /> {subjects}
        </p>
        <p className="text-gray-500 text-sm mb-2">
          {mentor.bio || "No bio provided"}
        </p>

        {isMyMentor ? (
          <Button onClick={() => onFeedback(mentor)}>Send Feedback</Button>
        ) : (
          <Button onClick={() => onRequest(mentor)}>Request Mentorship</Button>
        )}
      </div>
    </div>
  );
};

// Main Page
export default function MentorshipPage() {
  const [mentors, setMentors] = useState([]);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [myMentor, setMyMentor] = useState(null);
  const [activeTab, setActiveTab] = useState("myMentor");
  const [notification, setNotification] = useState({ message: "", type: "" });
  const student_id = localStorage.getItem("user_id");

  const closeNotification = useCallback(
    () => setNotification({ message: "", type: "" }),
    []
  );

  useEffect(() => {
    // Fetch all mentors
    axios
      .get(`${API_BASE}/api/mentors/getMentor`)
      .then((res) => setMentors(res.data))
      .catch(() =>
        setNotification({ message: "Failed to load mentors", type: "error" })
      );

    // Fetch current mentorship
    axios
      .get(`${API_BASE}/api/mentorships?student_id=${student_id}`)
      .then((res) => {
        if (res.data && res.data.length > 0) {
          setMyMentor(res.data[0]);
        }
      })
      .catch(() => console.log("No current mentorship"));
  }, [student_id]);

  const requestMentor = (subject, message) => {
    if (!selectedMentor) return;

    axios
      .post(`${API_BASE}/api/mentorships`, {
        mentor_id: selectedMentor.id,
        student_id,
        subject,
      })
      .then(() => {
        setNotification({
          message: `Request sent to ${selectedMentor.first_name} ${selectedMentor.last_name}!`,
          type: "success",
        });
        setMyMentor({ ...selectedMentor, status: "Pending" });

        // Remove my mentor from available mentors
        setMentors((prev) => prev.filter((m) => m.id !== selectedMentor.id));
        setSelectedMentor(null);
      })
      .catch(() =>
        setNotification({ message: "Failed to send request", type: "error" })
      );
  };

  const sendFeedback = (mentor) => {
    // Example: just show notification for now
    setNotification({
      message: `Feedback sent to ${mentor.first_name}!`,
      type: "success",
    });
  };

  // Filter mentors to exclude my mentor
  const availableMentors = myMentor
    ? mentors.filter((m) => m.id !== myMentor.id)
    : mentors;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Mentorship Dashboard</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`px-6 py-3 font-semibold transition duration-200 ${
            activeTab === "myMentor"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-indigo-600"
          }`}
          onClick={() => setActiveTab("myMentor")}
        >
          My Mentor {myMentor ? `(${myMentor.status})` : ""}
        </button>
        <button
          className={`px-6 py-3 font-semibold transition duration-200 ${
            activeTab === "available"
              ? "text-indigo-600 border-b-2 border-indigo-600"
              : "text-gray-500 hover:text-indigo-600"
          }`}
          onClick={() => setActiveTab("available")}
        >
          Available Mentors ({availableMentors.length})
        </button>
      </div>

      {/* Content */}
      <div className="pb-12">
        {activeTab === "myMentor" ? (
          myMentor ? (
            <div className="grid gap-6">
              <MentorCard
                mentor={myMentor}
                isMyMentor={true}
                onFeedback={sendFeedback}
                onRequest={() => {}}
              />
            </div>
          ) : (
            <p className="text-gray-400 text-lg py-10 italic text-center">
              You do not have a mentor yet.
            </p>
          )
        ) : availableMentors.length === 0 ? (
          <p className="text-gray-400 text-lg py-10 italic text-center">
            No mentors available.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableMentors.map((mentor) => (
              <MentorCard
                key={mentor.id}
                mentor={mentor}
                isMyMentor={false}
                onRequest={setSelectedMentor}
                onFeedback={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      <RequestMentorModal
        mentor={selectedMentor}
        onClose={() => setSelectedMentor(null)}
        onSubmit={requestMentor}
      />

      {/* Notifications */}
      <NotificationMessage
        message={notification.message}
        type={notification.type}
        onClose={closeNotification}
      />
    </div>
  );
}
