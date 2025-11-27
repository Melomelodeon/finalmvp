import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

import { API_BASE } from "../config";

// Helper to show relative time
const timeAgo = (date) => {
  const diff = (new Date() - new Date(date)) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function ForumPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [newReply, setNewReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState({}); // store new comment per reply

  // Fetch thread + answers + comments
  const fetchPost = async () => {
    try {
      const res = await axios.get(`${API_BASE}/thread/${id}`);
      const threadData = res.data.thread || null;
      const answersData = Array.isArray(res.data.answers)
        ? res.data.answers
        : [];

      // Ensure each answer has comments array
      const safeAnswers = answersData.map((a) => ({
        ...a,
        comments: Array.isArray(a.comments) ? a.comments : [],
      }));

      console.log("Fetched thread:", threadData);
      console.log("Fetched replies:", safeAnswers);

      setPost(threadData);
      setReplies(safeAnswers);
    } catch (error) {
      console.error("Error fetching thread:", error);
      alert("Failed to load thread");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, []);

  // Add reply
  const handleAddReply = async (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;

    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name") || "You";

    try {
      const response = await axios.post(`${API_BASE}/reply`, {
        post_id: id,
        user_id: userId,
        content: newReply,
      });

      const newReplyData = {
        id: response.data.reply_id || response.data.id,
        post_id: id,
        user_id: userId,
        content: newReply,
        created_at: new Date().toISOString(),
        replied_by_name: userName,
        comments: [],
      };

      setReplies((prev) => [...prev, newReplyData]);
      setNewReply("");
    } catch (error) {
      console.error("Error posting reply:", error);
      alert("Failed to post reply.");
    }
  };

  // Add comment to a reply
  const handleAddComment = async (replyId) => {
    const text = commentTexts[replyId]?.trim();
    if (!text) return;

    const userId = localStorage.getItem("user_id");
    const userName = localStorage.getItem("user_name") || "You";

    try {
      const response = await axios.post(`${API_BASE}/comment`, {
        answer_id: replyId,
        user_id: userId,
        content: text,
      });

      const comment = {
        id: response.data.comment_id,
        answer_id: replyId,
        user_id: userId,
        content: text,
        created_at: new Date().toISOString(),
        commented_by_name: userName,
      };

      // Update replies state safely
      setReplies((prevReplies) =>
        prevReplies.map((r) =>
          r.id === replyId
            ? { ...r, comments: [...(r.comments || []), comment] }
            : r
        )
      );

      setCommentTexts({ ...commentTexts, [replyId]: "" });
    } catch (error) {
      console.error("Error posting comment:", error);
      alert("Failed to post comment.");
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!post) return <div className="p-6 text-gray-500">Post not found.</div>;

  return (
    <div className="p-6 min-h-screen">
      {/* Back button */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/forum")}
          className="text-indigo-600 hover:underline"
        >
          ← Back to Forum
        </button>
      </div>

      {/* Post info */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <h1 className="text-2xl font-bold mb-3">{post.title}</h1>
        <div className="flex items-center gap-3 mb-4 border-b pb-4">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center font-bold text-indigo-600">
            {post.created_by_name?.charAt(0).toUpperCase() || "U"}
          </div>
          <div className="text-gray-600 text-sm">
            <strong>{post.created_by_name || "Unknown"}</strong> •{" "}
            {timeAgo(post.created_at)} • {post.views} views
          </div>
        </div>
        <p className="text-gray-700 whitespace-pre-wrap">{post.content}</p>

        {post.tags && (
          <div className="mt-3 flex gap-2 flex-wrap">
            {post.tags.split(",").map((t, i) => (
              <span
                key={i}
                className="bg-gray-100 px-2 py-1 rounded-lg text-gray-700 text-sm"
              >
                #{t.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Replies Section */}
      <div className="bg-white p-6 rounded-2xl shadow-sm mb-6">
        <h2 className="text-lg font-semibold mb-4">
          {replies.length} Answer{replies.length !== 1 ? "s" : ""}
        </h2>

        {replies.length === 0 && (
          <div className="text-center text-gray-500">
            💬 No replies yet. Be the first to answer!
          </div>
        )}

        {replies.map((r) => (
          <div key={r.id} className="border-b py-4">
            <p className="text-gray-700 mb-2 whitespace-pre-wrap">
              {r.content}
            </p>
            <div className="flex items-center gap-2 text-gray-500 text-sm mb-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                {r.replied_by_name?.charAt(0).toUpperCase() || "U"}
              </div>
              <strong>{r.replied_by_name || "Unknown"}</strong> •{" "}
              {timeAgo(r.created_at)}
            </div>

            {/* Comments */}
            {r.comments?.map((c) => (
              <div
                key={c.id}
                className="ml-6 mb-2 p-2 border-l border-gray-200"
              >
                <p className="text-gray-700 mb-1 whitespace-pre-wrap">
                  {c.content}
                </p>
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600">
                    {c.commented_by_name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <strong>{c.commented_by_name || "Unknown"}</strong> •{" "}
                  {timeAgo(c.created_at)}
                </div>
              </div>
            ))}

            {/* Add Comment Form */}
            <div className="ml-6 mt-2 flex gap-2">
              <input
                type="text"
                placeholder="Write a comment..."
                className="border rounded-lg p-2 flex-1"
                value={commentTexts[r.id] || ""}
                onChange={(e) =>
                  setCommentTexts({ ...commentTexts, [r.id]: e.target.value })
                }
              />
              <button
                onClick={() => handleAddComment(r.id)}
                className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg text-sm"
              >
                Comment
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Reply Form */}
      <div className="bg-white p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg font-semibold mb-3">Your Answer</h2>
        <form onSubmit={handleAddReply} className="flex flex-col gap-3">
          <textarea
            rows="5"
            className="border rounded-lg p-2"
            placeholder="Write your answer here..."
            required
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Post Answer
          </button>
        </form>
      </div>
    </div>
  );
}
