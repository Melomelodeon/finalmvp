import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Send, X, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";

import { API_BASE } from "../config";

const API_URL = `${API_BASE}`;

export default function GroupView() {
  const { id: groupId } = useParams();
  const navigate = useNavigate();

  const [group, setGroup] = useState(null);
  const [tab, setTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [newSession, setNewSession] = useState({
    title: "",
    session_date: "",
    duration: "",
    description: "",
    meeting_link: "https://meet.google.com/vzb-zbqy-dun",
  });

  const user = JSON.parse(localStorage.getItem("user"));

  // --- Fetch group data ---
  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const res = await fetch(`${API_URL}/api/groups/view/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch group data");
        const data = await res.json();
        setGroup(data.group);
        setMembers(data.members || []);
        setMessages(data.messages || []);
        setSessions(data.sessions || []);
      } catch (err) {
        console.error(err);
        toast.error(`Error loading group: ${err.message}`);
      }
    };
    fetchGroupData();
  }, [groupId]);

  // --- Send chat message ---
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/groups/${groupId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, message: newMessage }),
      });
      if (!res.ok) throw new Error("Failed to send message");

      const data = await res.json();
      setMessages((prev) => [...prev, data.message]);
      setNewMessage("");
      toast.success("Message sent!");
    } catch (err) {
      console.error(err);
      toast.error(`Error sending message: ${err.message}`);
    }
  };

  // --- Fetch members ---
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/members/${groupId}`);
        if (!res.ok) throw new Error("Failed to fetch members");
        const data = await res.json();
        setMembers(data.members || []);
      } catch (err) {
        console.error(err);
        toast.error(`Error loading members: ${err.message}`);
      }
    };
    fetchMembers();
  }, [groupId]);

  const handleAddSession = async () => {
    if (!newSession.title || !newSession.session_date || !newSession.duration) {
      toast.error("Please fill in all required fields");
      return;
    }

    const payload = {
      title: newSession.title,
      session_date: newSession.session_date,
      duration: newSession.duration,
      user_id: user.id,
      description: newSession.description,
      meeting_link:
        newSession.meeting_link || "https://meet.google.com/vzb-zbqy-dun",
    };

    try {
      const response = await fetch(
        `${API_URL}/api/groups/${groupId}/sessions`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.session) {
        // Add the new session directly to the state
        setSessions((prev) => [...prev, data.session]);

        toast.success("Session created successfully!");
        setShowModal(false);
        setNewSession({
          title: "",
          session_date: "",
          duration: "",
          description: "",
          meeting_link: "",
        });
      } else {
        toast.error(data.error || "Failed to create session");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("An error occurred while creating session");
    }
  };

  if (!group)
    return (
      <div className="flex items-center justify-center h-screen text-gray-500">
        Loading group...
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* HEADER */}
      <div className="bg-white rounded-2xl shadow-sm p-5 mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition"
          >
            <ArrowLeft size={18} />
            <span className="font-medium">Back</span>
          </button>
        </div>
        <div className="text-center md:flex-1">
          <h1 className="text-2xl font-semibold text-gray-800">{group.name}</h1>
          <p className="text-gray-500 text-sm">
            {group.description || "No description available"}
          </p>
        </div>
        <div className="flex justify-center md:justify-end gap-2">
          <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium">
            {group.subject}
          </span>
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
            👥 {group.member_count} members
          </span>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm flex overflow-x-auto border">
        {["chat", "schedule", "members"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 px-4 py-3 font-medium transition border-b-2 ${
              tab === t
                ? "border-indigo-500 text-indigo-600 bg-indigo-50"
                : "border-transparent text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
            }`}
          >
            {t === "chat" && "💬 Chat"}
            {t === "schedule" && "📅 Schedule"}
            {t === "members" && "👥 Members"}
          </button>
        ))}
      </div>

      {/* CHAT TAB */}
      {tab === "chat" && (
        <div className="border rounded-xl flex flex-col h-[500px]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.user_id === user.id ? "flex-row-reverse" : ""
                } items-start gap-3`}
              >
                <div className="bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold">
                  {msg.name.charAt(0).toUpperCase()}
                </div>
                <div
                  className={`p-3 rounded-2xl max-w-[70%] shadow-sm ${
                    msg.user_id === user.id
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-800"
                  }`}
                >
                  {msg.user_id !== user.id && (
                    <div className="font-semibold text-sm mb-1">{msg.name}</div>
                  )}
                  <div className="text-sm">{msg.message}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t bg-white p-3 flex gap-2 items-center">
            <textarea
              className="flex-1 border rounded-full px-4 py-2 resize-none text-sm"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && !e.shiftKey && sendMessage()
              }
            />
            <button
              onClick={sendMessage}
              className="bg-indigo-600 text-white px-4 py-2 rounded-full"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {/* SCHEDULE TAB */}
      {tab === "schedule" && (
        <div className="border rounded-xl p-4 bg-white shadow-sm overflow-x-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Scheduled Sessions
            </h3>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 transition-colors"
            >
              + Add Session
            </button>
          </div>

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
                          href={"https://meet.google.com/vzb-zbqy-dun"}
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
        </div>
      )}

      {/* MEMBERS TAB */}
      {tab === "members" && (
        <div className="border rounded-xl p-4 overflow-x-auto">
          <table className="min-w-full table-auto border-collapse border border-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-2 text-left">Name</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-left">Role</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 && (
                <tr>
                  <td colSpan="3" className="text-center p-2 text-gray-500">
                    No members found.
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id}>
                  <td className="border p-2">{m.name}</td>
                  <td className="border p-2">{m.email}</td>
                  <td className="border p-2">{m.role || "Member"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD SESSION MODAL */}
      {showModal && (
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
