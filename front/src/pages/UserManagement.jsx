import React, { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE } from "../config";
import {
  Edit,
  Trash2,
  Plus,
  Eye,
  Upload,
  Search,
  Users,
  Mail,
  Shield,
  Activity,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const API_URL = `${API_BASE}/api/users`;

export default function UserManagement() {
  // State
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    password: "",
    skills: "",
    role: "Mentee",
    bio: "",
    profile_image: "",
    status: "Active",
  });
  const [formErrors, setFormErrors] = useState({});

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      // expect array in res.data
      setUsers(res.data || []);
    } catch (err) {
      console.error("Failed to fetch users", err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Simple validation
  const validateForm = () => {
    const errors = {};
    if (!form.first_name) errors.first_name = "First name is required";
    if (!form.last_name) errors.last_name = "Last name is required";
    if (!form.email) errors.email = "Email is required";
    if (!form.username) errors.username = "Username is required";
    if (!isEditing && !form.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Add handler
  const handleAdd = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (key === "profile_image") {
          if (value instanceof File) formData.append("profile_image", value);
        } else {
          formData.append(key, value);
        }
      });

      await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("User created successfully!");
      fetchUsers();
      resetForm();
    } catch (err) {
      console.error("Add failed:", err);
      toast.error("Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };
  // UPDATE USER
  const handleUpdate = async () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      Object.entries(form).forEach(([key, value]) => {
        if (key === "profile_image") {
          if (value instanceof File) {
            formData.append("profile_image", value);
          } else {
            formData.append(
              "profile_image_old",
              value || selectedUser.profile_image || ""
            );
          }
        } else {
          formData.append(key, value);
        }
      });

      // <-- Fix: POST directly to /api/users/{id} without _method
      await axios.post(`${API_URL}/${selectedUser.id}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("User updated successfully!");
      fetchUsers();
      resetForm();
    } catch (err) {
      console.error("Update failed:", err);
      toast.error("Failed to update user");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit handler
  const handleEdit = (user) => {
    setIsEditing(true);
    setSelectedUser(user);

    setForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      email: user.email || "",
      username: user.username || "",
      password: "",
      skills: user.skills || "",
      role: user.role || "Mentee",
      bio: user.bio || "",
      profile_image: user.profile_image || "",
      status: user.status || "Active",
    });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchUsers();
      toast.success("User deleted successfully");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  // Reset form
  const resetForm = () => {
    setForm({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      password: "",
      skills: "",
      role: "Mentee",
      bio: "",
      profile_image: "",
      status: "Active",
    });
    setFormErrors({});
    setIsAdding(false);
    setIsEditing(false);
    setSelectedUser(null);
  };

  // Filtering + Pagination
  const filteredUsers = users.filter((u) => {
    const searchMatch =
      u.first_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.username?.toLowerCase().includes(search.toLowerCase()) ||
      u.skills?.toLowerCase().includes(search.toLowerCase());
    const roleMatch = filterRole === "All" || u.role === filterRole;
    const statusMatch = filterStatus === "All" || u.status === filterStatus;
    return searchMatch && roleMatch && statusMatch;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Ensure currentPage is valid when filters change
  React.useEffect(() => {
    if (totalPages === 0) {
      setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages]);

  // Render View Modal
  const renderViewModal = () => (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-white">User Profile</h2>
        <button
          onClick={() => {
            setIsViewing(false);
            setSelectedUser(null);
          }}
          className="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      {/* Profile Content */}
      <div className="p-5">
        {/* Profile Header */}
        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg mb-3">
            <img
              src={selectedUser?.profile_image || "./kk.png"}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <h3 className="text-xl font-bold text-gray-900">
            {selectedUser?.first_name} {selectedUser?.last_name}
          </h3>
          <p className="text-sm text-gray-600 mt-1 flex items-center gap-2">
            <Shield size={14} />
            {selectedUser?.role}
          </p>
          <span
            className={`mt-2 px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1.5 ${
              selectedUser?.status === "Active"
                ? "bg-green-100 text-green-700"
                : selectedUser?.status === "Inactive"
                ? "bg-gray-200 text-gray-600"
                : "bg-red-100 text-red-700"
            }`}
          >
            {selectedUser?.status === "Active" ? (
              <CheckCircle size={12} />
            ) : selectedUser?.status === "Banned" ? (
              <XCircle size={12} />
            ) : (
              <AlertCircle size={12} />
            )}
            {selectedUser?.status}
          </span>
        </div>

        {/* User Info */}
        <div className="space-y-3">
          {[
            { label: "Email", value: selectedUser?.email, icon: Mail },
            { label: "Username", value: selectedUser?.username, icon: Users },
            { label: "Skills", value: selectedUser?.skills, icon: Activity },
            { label: "Bio", value: selectedUser?.bio, icon: null },
            {
              label: "Date Joined",
              value: selectedUser?.date_joined
                ? new Date(selectedUser.date_joined).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )
                : "",
              icon: null,
            },
          ].map(
            (item, idx) =>
              item.value && (
                <div key={idx} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    {item.icon && (
                      <item.icon size={14} className="text-gray-400" />
                    )}
                    <span className="text-xs font-semibold text-gray-600 uppercase">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900">{item.value}</p>
                </div>
              )
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-50 px-5 py-3 border-t border-gray-200">
        <button
          onClick={() => {
            setIsViewing(false);
            setSelectedUser(null);
          }}
          className="w-full bg-gray-600 text-white px-5 py-2 rounded-xl hover:bg-gray-700 transition-colors font-medium text-sm"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Render Form Modal
  const renderForm = () => (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-auto overflow-hidden max-h-[90vh] flex flex-col">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">
          {isEditing ? "Edit User" : "Add New User"}
        </h2>
        <p className="text-blue-100 text-sm mt-1">
          {isEditing ? "Update user information" : "Create a new user account"}
        </p>
      </div>

      {/* Modal Body */}
      <div className="p-6 overflow-y-auto flex-1">
        {/* Profile Upload */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <img
              src={
                form.profile_image instanceof File
                  ? URL.createObjectURL(form.profile_image)
                  : form.profile_image || "./kk.png"
              }
              alt="Profile"
              className="w-32 h-32 rounded-full object-cover border-4 border-blue-100 shadow-lg"
            />
            <label className="absolute bottom-2 right-2 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 shadow-lg transition-colors">
              <Upload size={20} />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) =>
                  e.target.files[0] &&
                  setForm((prev) => ({
                    ...prev,
                    profile_image: e.target.files[0],
                  }))
                }
              />
            </label>
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Click the icon to upload photo
          </p>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* First Name */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className={`w-full border ${
                formErrors.first_name ? "border-red-500" : "border-gray-300"
              } py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="Enter first name"
              disabled={submitting}
            />
            {formErrors.first_name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.first_name}
              </p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className={`w-full border ${
                formErrors.last_name ? "border-red-500" : "border-gray-300"
              } py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="Enter last name"
              disabled={submitting}
            />
            {formErrors.last_name && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.last_name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={`w-full border ${
                formErrors.email ? "border-red-500" : "border-gray-300"
              } py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="Enter email address"
              disabled={submitting}
            />
            {formErrors.email && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.email}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Username <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              className={`w-full border ${
                formErrors.username ? "border-red-500" : "border-gray-300"
              } py-3 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="Enter username"
              disabled={submitting}
            />
            {formErrors.username && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.username}
              </p>
            )}
          </div>

          {/* Skills */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Skills <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              className={`w-full border ${
                formErrors.skills ? "border-red-500" : "border-gray-300"
              } py-3 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder="e.g., JavaScript, Python, React"
              disabled={submitting}
            />
            {formErrors.skills && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.skills}
              </p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Password {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={`w-full border ${
                formErrors.password ? "border-red-500" : "border-gray-300"
              } py-3 px-4 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 transition`}
              placeholder={
                isEditing ? "Leave blank to keep current" : "Enter password"
              }
              disabled={submitting}
            />
            {formErrors.password && (
              <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                <XCircle size={14} />
                {formErrors.password}
              </p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Role
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border border-gray-300 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
            >
              <option>Admin</option>
              <option>Mentor</option>
              <option>Mentee</option>
              <option>Moderator</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-base font-semibold text-gray-800 mb-2">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              disabled={submitting}
            >
              <option>Active</option>
              <option>Inactive</option>
              <option>Banned</option>
              <option>Pending</option>
              <option>Rejected</option>
            </select>
          </div>
        </div>

        {/* Bio - Full Width */}
        <div className="mt-5">
          <label className="block text-base font-semibold text-gray-800 mb-2">
            Bio
          </label>
          <textarea
            rows="4"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            className="w-full border border-gray-300 py-2 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition resize-none"
            placeholder="Tell us about yourself..."
            disabled={submitting}
          ></textarea>
        </div>
      </div>

      {/* Modal Footer */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
        <button
          onClick={resetForm}
          disabled={submitting}
          className="px-6 py-3 border border-gray-300 rounded-xl text-base font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={isEditing ? handleUpdate : handleAdd}
          disabled={submitting}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl text-base font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {submitting && <Loader2 className="animate-spin" size={18} />}
          {isEditing ? "Update User" : "Create User"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen ">
      <ToastContainer position="top-right" autoClose={3000} />

      <div>
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg">
              <Users className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                Manage system users and their roles
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 items-center lg:items-start lg:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                size={20}
              />
              <input
                type="text"
                placeholder="Search by name, email, username, or skills..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterRole}
                onChange={(e) => {
                  setFilterRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[120px] border border-gray-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Mentor">Mentor</option>
                <option value="Mentee">Mentee</option>
                <option value="Moderator">Moderator</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="min-w-[120px] border border-gray-300 px-3 py-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Banned">Banned</option>
              </select>
            </div>

            {/* Add Button */}
            <div className="mt-3 lg:mt-0">
              <button
                onClick={() => setIsAdding(true)}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg font-medium text-sm whitespace-nowrap"
              >
                <Plus size={18} />
                Add User
              </button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Total Users
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.length}
                </p>
              </div>
              <Users className="text-blue-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.filter((u) => u.status === "Active").length}
                </p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Inactive
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.filter((u) => u.status === "Inactive").length}
                </p>
              </div>
              <AlertCircle className="text-yellow-500" size={32} />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-3 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Banned</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredUsers.filter((u) => u.status === "Banned").length}
                </p>
              </div>
              <XCircle className="text-red-500" size={32} />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-blue-600" size={40} />
            </div>
          ) : (
            <>
              {/* Mobile cards (shown on small screens) */}
              <div className="md:hidden p-3">
                {paginatedUsers.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    {paginatedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="bg-white border rounded-lg p-3 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          {u.profile_image ? (
                            <img
                              src={u.profile_image}
                              alt={u.first_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {u.first_name?.[0]}
                              {u.last_name?.[0]}
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {u.first_name} {u.last_name}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {u.email}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setIsViewing(true);
                                    setSelectedUser(u);
                                  }}
                                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                  <Eye size={16} />
                                </button>
                                <button
                                  onClick={() => handleEdit(u)}
                                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(u.id)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {u.role}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                {u.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-600 p-3">
                    No users found
                  </div>
                )}
              </div>

              {/* Desktop/table view (md+) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        User
                      </th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Skills
                      </th>
                      <th className="py-2 px-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="py-2 px-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-3">
                              {u.profile_image ? (
                                <img
                                  src={u.profile_image}
                                  alt={u.first_name}
                                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm">
                                  {u.first_name?.[0]}
                                  {u.last_name?.[0]}
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {u.first_name} {u.last_name}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700">
                            {u.email}
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700">
                            {u.username}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-medium ${
                                u.role === "Admin"
                                  ? "bg-purple-100 text-purple-700"
                                  : u.role === "Mentor"
                                  ? "bg-blue-100 text-blue-700"
                                  : u.role === "Mentee"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-sm text-gray-700 max-w-xs truncate">
                            {u.skills}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 text-sm font-semibold rounded-full ${
                                u.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : u.status === "Inactive"
                                  ? "bg-gray-200 text-gray-700"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {u.status === "Active" ? (
                                <CheckCircle size={12} />
                              ) : u.status === "Banned" ? (
                                <XCircle size={12} />
                              ) : (
                                <AlertCircle size={12} />
                              )}
                              {u.status}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setIsViewing(true);
                                  setSelectedUser(u);
                                }}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                onClick={() => handleEdit(u)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit User"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete User"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="text-center py-8 text-gray-600"
                        >
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 0 && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                    <span className="text-sm text-gray-700 font-medium">
                      Showing{" "}
                      {filteredUsers.length === 0
                        ? 0
                        : (currentPage - 1) * itemsPerPage + 1}
                      –
                      {filteredUsers.length === 0
                        ? 0
                        : Math.min(
                            currentPage * itemsPerPage,
                            filteredUsers.length
                          )}{" "}
                      of {filteredUsers.length} users
                    </span>
                    <div className="flex gap-2">
                      <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => p - 1)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          currentPage === 1
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Previous
                      </button>
                      {[...Array(Math.min(totalPages, 5))].map((_, index) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = index + 1;
                        } else if (currentPage <= 3) {
                          pageNum = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + index;
                        } else {
                          pageNum = currentPage - 2 + index;
                        }
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                              currentPage === pageNum
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          currentPage === totalPages
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Add/Edit Modal */}
        {(isAdding || isEditing) && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {renderForm()}
          </div>
        )}

        {/* View Modal */}
        {isViewing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            {renderViewModal()}
          </div>
        )}
      </div>
    </div>
  );
}
