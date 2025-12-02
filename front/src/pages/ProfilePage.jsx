import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { Camera } from "lucide-react";
import "react-toastify/dist/ReactToastify.css";

import { API_BASE } from "../config";

const API_URL = `${API_BASE}/api/users`;

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    role: "",
    bio: "",
    skills: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const userId = localStorage.getItem("user_id");
      if (!userId) return;
      try {
        const res = await axios.get(`${API_URL}/${userId}`);
        setUser(res.data);
        setForm({
          first_name: res.data.first_name,
          last_name: res.data.last_name,
          email: res.data.email,
          username: res.data.username,
          role: res.data.role,
          bio: res.data.bio || "",
          skills: res.data.skills || "",
        });
        setProfileImage(res.data.profile_image || null);
      } catch (err) {
        console.error("Failed to fetch user:", err);
        // no toast here
      }
    };
    fetchUser();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 2 * 1024 * 1024) {
      const reader = new FileReader();
      reader.onload = (event) => setProfileImage(event.target.result);
      reader.readAsDataURL(file);
      setForm({ ...form, profile_image: file });
    } else {
      toast.error("Please select an image smaller than 2MB.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "profile_image") {
          if (value instanceof File) {
            formData.append("profile_image", value);
          } else {
            formData.append("profile_image", user.profile_image || "");
          }
        } else {
          formData.append(key, value);
        }
      });

      await axios.post(`${API_URL}/${user.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Profile updated successfully!");

      setUser({
        ...user,
        ...form,
        profile_image: profileImage || user.profile_image,
      });
    } catch (err) {
      console.error("Profile update failed:", err);
      toast.error("Failed to update profile.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen">
      {/* Toast Container */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        closeButton={false}
      />

      <h1 className="text-3xl font-bold mb-2 text-gray-800">
        Profile Settings
      </h1>
      <p className="text-gray-500 mb-8">
        Manage your account and personal information
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT COLUMN */}
        <div className="space-y-6">
          <form
            onSubmit={handleSubmit}
            className="space-y-6 bg-white p-6 rounded-2xl shadow-md border border-gray-200"
          >
            {/* Personal Information */}
            <fieldset className="border border-gray-300 rounded-lg p-4">
              <legend className="font-semibold text-gray-700 px-2">
                Personal Information
              </legend>

              {/* Profile Image */}
              <div className="flex items-center gap-4 mb-4">
                <label className="relative cursor-pointer group">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-blue-400"
                    />
                  ) : (
                    <div className="bg-blue-100 w-20 h-20 flex items-center justify-center text-3xl font-bold text-blue-600 rounded-full">
                      {form.first_name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full shadow-sm">
                    <Camera size={14} />
                  </div>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/gif"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your first name"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Enter your last name"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2 "
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className="w-full mt-1 border rounded-lg px-3 py-2"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Role
                  </label>
                  <input
                    type="text"
                    placeholder="User role"
                    value={form.role}
                    disabled
                    className="w-full mt-1 border rounded-lg px-3 py-2 bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
            </fieldset>

            {/* Bio */}
            <fieldset className="border border-gray-300 rounded-lg p-4">
              <legend className="font-semibold text-gray-700 px-2">Bio</legend>
              <textarea
                rows="4"
                placeholder="Tell us about yourself"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </fieldset>

            {/* Skills */}
            <fieldset className="border border-gray-300 rounded-lg p-4">
              <legend className="font-semibold text-gray-700 px-2">
                Skills / Subjects
              </legend>
              <input
                type="text"
                placeholder="Comma separated (e.g., JavaScript, React)"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </fieldset>

            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-6">
          {/* Account Info */}
          <div className="bg-white p-6 rounded-2xl shadow border border-gray-200">
            <h2 className="text-lg font-semibold mb-4">Account Information</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Account Status</label>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    user.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {user.status}
                </span>
              </div>
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
