// FileUpload.jsx
import React, { useState } from "react";
import { toast } from "react-toastify";
import { API_BASE } from "../config"; 

const API_URL = `${API_BASE}`;

export default function FileUpload({ groupId, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem("user"));

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append("userfile", file); // LavaLust expects 'userfile'
    formData.append("user_id", user.id);

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/groups/${groupId}/files`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      toast.success("File uploaded successfully!");
      setFile(null);

      if (onUploadSuccess) onUploadSuccess(data.file);
    } catch (err) {
      console.error(err);
      toast.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-2 items-center">
      <input
        type="file"
        onChange={handleFileChange}
        className="border rounded-md px-3 py-2 text-sm"
      />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}
