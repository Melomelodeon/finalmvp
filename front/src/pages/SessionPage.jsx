import React, { useState, useEffect } from "react";
import { Send, X } from "lucide-react";
import { toast } from "react-toastify";

import { API_BASE } from "../config";

function SessionPage() {
  const API_URL = `${API_BASE}`;
  const user = JSON.parse(localStorage.getItem("user"));

  const [group, setGroup] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    session_date: "",
    duration: "",
    description: "",
    meeting_link: "https://meet.google.com/vzb-zbqy-dun",
  });

  useEffect(() => {
    const fetchGroupAndSessions = async () => {
      if (!user) {
        toast.error("No user found. Please login.");
        setLoading(false);
        return;
      }

      try {
        // 1️⃣ Fetch groups
        const res = await fetch(`${API_URL}/api/groups?mentor_id=${user.id}`);
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
          toast.info("No groups found.");
          setGroup(null);
          setLoading(false);
          return;
        }

        // 2️⃣ Find the mentor's group
        const groupForMentor = data.find((g) => g.instructor_id === user.id);

        if (!groupForMentor) {
          toast.info("No group found for this mentor.");
          setGroup(null);
          setLoading(false);
          return;
        }

        setGroup(groupForMentor);

        // 3️⃣ Fetch sessions for this group
        const resSessions = await fetch(
          `${API_URL}/api/sessions/${groupForMentor.id}`
        );
        const sessionsData = await resSessions.json();

        // 4️⃣ Set sessions state
        setSessions(
          Array.isArray(sessionsData.sessions) ? sessionsData.sessions : []
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load group or sessions");
      } finally {
        setLoading(false);
      }
    };

    fetchGroupAndSessions();
  }, []);

  const formatDateTime = (datetimeLocal) => {
    const dt = new Date(datetimeLocal);
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    const hh = String(dt.getHours()).padStart(2, "0");
    const min = String(dt.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:00`;
  };

  const handleAddSession = async () => {
    if (!group) return;

    if (!newSession.title || !newSession.session_date || !newSession.duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      title: newSession.title,
      session_date: formatDateTime(newSession.session_date),
      duration: newSession.duration,
      user_id: user.id,
      description: newSession.description,
      meeting_link:
        newSession.meeting_link || "https://meet.google.com/vzb-zbqy-dun",
    };

    try {
      const response = await fetch(`${API_URL}/api/sessions/${group.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();

      if (response.ok) {
        toast.success("Session created successfully!");
        setSessions((prev) => [...prev, data.session]);
        setShowModal(false);
        setNewSession({
          title: "",
          session_date: "",
          duration: "",
          description: "",
          meeting_link: "https://meet.google.com/vzb-zbqy-dun",
        });
      } else {
        toast.error(data.error || "Failed to create session");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while creating session");
    }
  };

  if (loading) {
    return (
      <p className="text-center py-4 text-gray-500">Loading sessions...</p>
    );
  }

  return (
    <div>
      <div className="border rounded-xl p-4 bg-white shadow-sm overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Scheduled Sessions
          </h3>
          <button
            onClick={() => setShowModal(true)}
            disabled={!group}
            className={`bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors ${
              !group ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            + Add Session
          </button>
        </div>

        {!group ? (
          <p className="text-center text-gray-500 italic">
            You currently have no group assigned. Please contact admin.
          </p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="border-b p-3 text-left text-sm font-semibold text-gray-700">
                  Title
                </th>
                <th className="border-b p-3 text-left text-sm font-semibold text-gray-700">
                  Date & Time
                </th>
                <th className="border-b p-3 text-left text-sm font-semibold text-gray-700">
                  Duration (min)
                </th>
                <th className="border-b p-3 text-left text-sm font-semibold text-gray-700">
                  Meeting Link
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-4 text-gray-500 italic bg-gray-50"
                  >
                    No sessions scheduled yet.
                  </td>
                </tr>
              ) : (
                sessions.map((s, index) => (
                  <tr
                    key={s.id}
                    className={`${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-indigo-50 transition-colors`}
                  >
                    <td className="border-t p-3 text-sm text-gray-800">
                      {s.title}
                    </td>
                    <td className="border-t p-3 text-sm text-gray-700">
                      {new Date(s.session_date).toLocaleString()}
                    </td>
                    <td className="border-t p-3 text-sm text-gray-700">
                      {s.duration}
                    </td>
                    <td className="border-t p-3 text-sm text-center">
                      {s.meeting_link ? (
                        <a
                          href={s.meeting_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline"
                        >
                          Join Meeting
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && group && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold mb-4">Add New Session</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Session Title"
                value={newSession.title}
                onChange={(e) =>
                  setNewSession({ ...newSession, title: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={newSession.session_date}
                onChange={(e) =>
                  setNewSession({ ...newSession, session_date: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <input
                type="number"
                placeholder="Duration (minutes)"
                value={newSession.duration}
                onChange={(e) =>
                  setNewSession({ ...newSession, duration: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm"
              />
              <textarea
                placeholder="Description (optional)"
                value={newSession.description}
                onChange={(e) =>
                  setNewSession({ ...newSession, description: e.target.value })
                }
                className="w-full border rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="mt-5 flex justify-end">
              <button
                onClick={handleAddSession}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Save Session
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SessionPage;
