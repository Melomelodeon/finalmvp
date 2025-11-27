import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { X, Users, Mail, Lock, Eye, EyeOff, Upload } from "lucide-react";
import { API_BASE } from "./config";
function RegisterPage({
  toggleRegister,
  showPassword,
  setShowPassword,
  setShowRegister,
  setShowLogin,
}) {
  const API_URL = `${API_BASE}/api/users`;
const API_AUTH = `${API_BASE}/api/userauth`;
  const [submitting, setSubmitting] = useState(false);
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
 
  const validateForm = () => {
    const errors = {};
    if (!form.first_name) errors.first_name = "First name is required";
    if (!form.last_name) errors.last_name = "Last name is required";
    if (!form.email) errors.email = "Email is required";
    if (!form.username) errors.username = "Username is required";
    if (!form.password) errors.password = "Password is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Automatically set status based on role
  const handleRoleChange = (e) => {
    const selectedRole = e.target.value;
    const updatedStatus = selectedRole === "Mentor" ? "Pending" : "Active";
    setForm({ ...form, role: selectedRole, status: updatedStatus });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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

      toast.success("Registered successfully! You can now log in.");

      setTimeout(() => {
        setShowRegister(false);
        setShowLogin(true);
      }, 1500);
    } catch (err) {
      console.error("Registration failed:", err);
      if (err.response?.data?.error) {
        toast.error(err.response.data.error);
      } else if (err.response?.data?.message) {
        toast.error(err.response.data.message);
      } else if (err.message) {
        toast.error(`Registration failed: ${err.message}`);
      } else {
        toast.error("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (typeof toggleRegister === "function") toggleRegister();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleRegister]);

  return (
    <div>
      <ToastContainer position="top-right" autoClose={3000} />
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-title"
      >
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
          <button
            onClick={toggleRegister}
            aria-label="Close registration"
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded z-10"
          >
            <X size={20} />
          </button>

          {/* LEFT SIDE */}
          <div className="md:w-2/5 relative flex flex-col items-center justify-center p-6 text-center border-r border-gray-100 bg-white">
            <div className="absolute inset-0 opacity-30 bg-[url('https://assets-v2.lottiefiles.com/a/fe0a9612-83f3-11ee-9945-27ca59862aef/gMMelbR6U7.gif')] bg-cover bg-center"></div>
            <div className="relative z-10 max-w-[14rem]">
              <img
                src="/icon.png"
                alt="PeerConnect"
                className="w-16 h-16 mx-auto mb-3"
              />
              <h2
                id="register-title"
                className="text-xl font-bold text-gray-900 mb-2"
              >
                Join <span className="text-indigo-600">PeerConnect</span>
              </h2>
              <p className="text-gray-600 text-sm">
                Connect, collaborate, and grow with mentors and peers.
              </p>
              <ul className="mt-4 text-left space-y-1.5 text-xs text-gray-700">
                <li>• Build your public profile</li>
                <li>• Share your skills</li>
                <li>• Find mentors and groups</li>
              </ul>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="md:w-3/5 w-full p-5 flex flex-col justify-center overflow-y-auto max-h-[85vh]">
            <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
              Create an Account
            </h3>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* First and Last Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    First Name
                  </label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) =>
                      setForm({ ...form, first_name: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.first_name
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    Last Name
                  </label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) =>
                      setForm({ ...form, last_name: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.last_name
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
                </div>
              </div>

              {/* Email and Username */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={form.username}
                    onChange={(e) =>
                      setForm({ ...form, username: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.username ? "border-red-500" : "border-gray-300"
                    } rounded-lg px-2.5 py-1.5 text-sm focus:ring-1 focus:ring-slate-400 outline-none`}
                  />
                </div>
              </div>

              {/* Password and Role */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                      size={16}
                    />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      className={`w-full border ${
                        formErrors.password
                          ? "border-red-500"
                          : "border-gray-300"
                      } rounded-lg pl-8 pr-9 py-1.5 text-sm focus:ring-1 focus:ring-slate-400 outline-none`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 mb-1 text-sm">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={handleRoleChange}
                    className="w-full border border-gray-300 rounded-lg py-1.5 px-2.5 text-sm"
                  >
                    <option>Admin</option>
                    <option>Mentor</option>
                    <option>Mentee</option>
                  </select>
                  {form.role === "Mentor" && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠ Mentors require admin approval before activation.
                    </p>
                  )}
                </div>
              </div>

              {/* Hidden status field */}
              <input type="hidden" name="status" value={form.status} />

              {/* Skills */}
              <div>
                <label className="block text-gray-600 mb-1 text-sm">
                  Skills
                </label>
                <input
                  type="text"
                  placeholder="e.g., JavaScript, React"
                  value={form.skills}
                  onChange={(e) => setForm({ ...form, skills: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-1.5 px-2.5 text-sm"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-gray-600 mb-1 text-sm">Bio</label>
                <textarea
                  rows="2"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg py-1.5 px-2.5 text-sm"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              {/* Profile Image */}
              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <img
                    src={
                      form.profile_image instanceof File
                        ? URL.createObjectURL(form.profile_image)
                        : form.profile_image || "/kk.png"
                    }
                    alt="Profile preview"
                    className="w-12 h-12 rounded-full object-cover border"
                  />
                  <label className="absolute bottom-0 right-0 bg-white border border-gray-200 text-indigo-600 p-1.5 rounded-full cursor-pointer shadow">
                    <Upload size={12} />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files[0] &&
                        setForm({ ...form, profile_image: e.target.files[0] })
                      }
                    />
                  </label>
                </div>
                <div className="text-xs text-gray-600">
                  Upload a profile photo (required)
                </div>
              </div>

              {/* Terms and Register */}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <input
                  type="checkbox"
                  className="accent-indigo-600 scale-90"
                  required
                />
                <span>
                  I agree to the{" "}
                  <a href="#" className="text-indigo-600 hover:underline">
                    Terms
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-indigo-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all text-sm"
              >
                {submitting ? "Registering..." : "Register"}
              </button>
            </form>

            {/* Social Buttons */}
            <div className="flex items-center gap-2 my-3">
              <hr className="flex-1 border-gray-300" />
              <span className="text-gray-500 text-xs">OR</span>
              <hr className="flex-1 border-gray-300" />
            </div>

            <div className="flex flex-col gap-2">
              <button
             
               className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg py-1.5 hover:bg-gray-50 transition text-sm">
                <img
                  src="https://www.svgrepo.com/show/475656/google-color.svg"
                  alt="Google"
                  className="w-4 h-4"
                />
                Continue with Google
              </button>
             
            </div>

            <p className="text-gray-500 mt-3 text-center text-xs">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setShowRegister(false);
                  setShowLogin(true);
                }}
                className="text-indigo-600 hover:underline cursor-pointer"
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
