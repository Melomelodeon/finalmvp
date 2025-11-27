import React, { useState, useEffect } from "react";
import { Search, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/forum`;

const timeAgo = (date) => {
  const diff = (new Date() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function ForumPage() {
  const [posts, setPosts] = useState([]);
  const [popularTags, setPopularTags] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("recent");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tags: "" });
  const navigate = useNavigate();

  // Fetch threads
  const fetchForums = async () => {
    try {
      const response = await axios.get(`${API_URL}/threads`);
      const data = response.data;

      // Ensure tags are arrays
      const formatted = data.map((post) => ({
        ...post,
        tags: post.tags ? post.tags.split(",").map((t) => t.trim()) : [],
      }));

      setPosts(formatted);

      // Derive top tags for sidebar
      const allTags = formatted.flatMap((p) => p.tags);
      const uniqueTags = [...new Set(allTags)];
      setPopularTags(uniqueTags.slice(0, 8));
    } catch (err) {
      console.error("Failed to fetch forums:", err);
    }
  };

  useEffect(() => {
    fetchForums();
  }, []);

  // Handle new thread form
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const user_id = localStorage.getItem("user_id");

    if (!user_id) {
      alert("You must be logged in to post a question.");
      return;
    }

    const payload = {
      user_id,
      title: form.title,
      content: form.content,
      tags: form.tags,
    };

    try {
      await axios.post(`${API_URL}/thread`, payload);
      setShowModal(false);
      setForm({ title: "", content: "", tags: "" });
      fetchForums(); // refresh list
    } catch (error) {
      console.error("Error saving forum:", error);
      alert("Error saving your question.");
    }
  };

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.content.toLowerCase().includes(search.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Discussion Forum</h1>
          <p className="text-gray-500">Ask questions and share knowledge</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition"
        >
          <Plus size={18} /> Post Question
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-sm mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1">
          <Search size={18} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border-none focus:ring-0 outline-none text-gray-700"
          />
        </div>

        <div className="flex gap-2">
          {["recent", "popular", "unanswered"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                filter === f
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* POSTS LIST */}
        <div className="lg:col-span-2 space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
              <div className="text-3xl mb-3">💬</div>
              <h2 className="font-semibold text-gray-700 mb-1">
                No questions found
              </h2>
              <p className="text-gray-500">Be the first to post a question!</p>
              <button
                className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl"
                onClick={() => setShowModal(true)}
              >
                Post a Question
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <motion.div
                key={post.id}
                layout
                onClick={() => navigate(`/forum/${post.id}`)}
                className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition cursor-pointer"
              >
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="text-indigo-600 font-bold text-xl">
                      {post.answer_count || 0}
                    </div>
                    <div className="text-xs text-gray-500">answers</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {post.views} views
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800 text-lg mb-1">
                      {post.title}
                    </h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                      {post.content}
                    </p>

                    <div className="flex justify-between items-center flex-wrap gap-2">
                      <div className="flex gap-2 flex-wrap">
                        {post.tags.map((t, i) => (
                          <span
                            key={i}
                            className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-lg"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {post.created_by_name || "Unknown"} •{" "}
                        {timeAgo(post.created_at)}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* SIDEBAR */}
        <div className="space-y-4">
          {/* POPULAR TAGS */}
          <div className="bg-white p-5 rounded-2xl shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3">Popular Tags</h3>
            <div className="flex flex-wrap gap-2">
              {popularTags.map((t, i) => (
                <button
                  key={i}
                  onClick={() => setSearch(t)}
                  className="px-3 py-1 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-indigo-100"
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* POST QUESTION MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg text-gray-800">
                  Post a Question
                </h2>
                <button
                  className="text-gray-400 hover:text-gray-600"
                  onClick={() => setShowModal(false)}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-3">
                <input
                  type="text"
                  placeholder="Question title"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <textarea
                  rows="5"
                  placeholder="Question details..."
                  required
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                  className="w-full border rounded-lg p-2"
                />
                <input
                  type="text"
                  placeholder="Tags (comma separated)"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  className="w-full border rounded-lg p-2"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-3 py-1 rounded-lg bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white"
                  >
                    Post
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
