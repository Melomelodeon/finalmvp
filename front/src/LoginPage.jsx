import { React, useState, useRef } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { X, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";

import { API_BASE } from "./config";
function LoginPage({
  toggleLogin,
  setShowLogin,
  showPassword,
  setShowForgot,
  setShowPassword,
  setShowRegister,
  onLoginSuccess,
}) {
  const AUTH_URL = `${API_BASE}/api/auth/login`;

  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();

  const redirectToDashboard = (role) => {
    switch (role) {
      case "Admin":
        navigate("/admin-dashboard");
        break;
      case "Mentor":
        navigate("/mentor-dashboard");
        break;
      case "Mentee":
        navigate("/mentee-dashboard");
        break;
      default:
        navigate("/");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-[70%] max-w-4xl flex flex-col md:flex-row overflow-hidden relative animate-fadeIn">
        {/* Close Button */}
        <button
          onClick={toggleLogin}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={22} />
        </button>

        {/* LEFT SIDE – Branding (White/Slate Background) */}
        <div
          style={{
            backgroundImage: `url("https://assets-v2.lottiefiles.com/a/fe0a9612-83f3-11ee-9945-27ca59862aef/gMMelbR6U7.gif")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          className="md:w-1/2 relative bg-slate-100 flex flex-col items-center justify-center p-6 text-center border-r border-gray-200 text-[16px]"
        >
          {/* White overlay */}
          <div className="absolute inset-0 bg-white/85"></div>

          {/* Content (make sure it's above the overlay) */}
          <div className="relative z-10">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to <span className="text-indigo-600">PeerConnect!</span>
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Connect, learn, and grow with mentors and peers who inspire you.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE – Login Form */}
        <div className="md:w-1/2 w-full p-6 flex flex-col justify-center text-[16px]">
          <img
            src="/icon.png"
            alt="PeerConnect Logo"
            className="w-20 h-20 mx-auto mb-4"
          />
          <h3 className="text-xl font-bold text-gray-800 mb-5 text-center">
            Login to Your Account
          </h3>

          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setServerError("");
              const errors = {};
              if (!form.email) errors.email = "Email is required";
              else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                errors.email = "Enter a valid email";
              if (!form.password) errors.password = "Password is required";
              if (!captchaToken) errors.captcha = "Please complete the reCAPTCHA";
              setFormErrors(errors);
              if (Object.keys(errors).length) return;

              setSubmitting(true);

              try {
                // Login request
                const res = await axios.post(AUTH_URL, {
                  email: form.email,
                  password: form.password,
                  remember: form.remember,
                  recaptcha_token: captchaToken,
                });

                // Normalize response payload and persist auth/user reliably
                const payload = res.data || {};

                // Try common token/user locations returned by various backends
                const token =
                  payload.token ||
                  payload.accessToken ||
                  payload.data?.token ||
                  payload.data?.accessToken ||
                  null;

                const user = payload.user || payload.data?.user || payload || null;

                // Prefer localStorage only when remember is true
                const storage = form.remember ? localStorage : sessionStorage;

                if (token) storage.setItem("auth_token", token);
                if (user) storage.setItem("user", JSON.stringify(user));
                if (payload.role) storage.setItem("user_role", payload.role);
                if (payload.id) storage.setItem("user_id", payload.id);

                // Debug log for deployed verification
                console.debug("Login response payload:", payload);

                // Notify parent BEFORE navigating so App can set its `user` state
                if (typeof onLoginSuccess === "function") {
                  try {
                    onLoginSuccess({ user, token, role: payload.role, id: payload.id });
                  } catch (e) {
                    console.warn("onLoginSuccess threw:", e);
                  }
                }

                // Show toast
                toast.success("Login successful! Redirecting...", {
                  autoClose: 1500,
                });

                // Log the successful login (fire-and-forget)
                try {
                  await axios.post(`${API_BASE}/api/logs/add`, {
                    user_id: payload.id || null,
                    action: "login",
                    details: `User ${form.email} logged in successfully`,
                    status: "success",
                  });
                } catch (logErr) {
                  console.warn("Failed to log login event:", logErr);
                }

                // Close modal and redirect after a short delay so toast shows
                setShowLogin(false);
                setTimeout(() => {
                  const userRole = payload.role || user?.role || "Mentee";
                  redirectToDashboard(userRole);
                }, 500);
              } catch (err) {
                console.error("Login error", err);

                const message =
                  err.response?.data?.error ||
                  (err.response?.status === 401
                    ? "Invalid email or password"
                    : "Login failed. Please try again.");

                setServerError(message);
                toast.error(message);

                // Log the failed login attempt
                await axios.post(`${API_BASE}/api/logs/add`, {
                  user_id: null, // Unknown user
                  action: "login",
                  details: `Failed login attempt for ${form.email}`,
                  status: "error",
                });

                // Reset reCAPTCHA on error
                if (recaptchaRef.current) {
                  recaptchaRef.current.reset();
                  setCaptchaToken("");
                }
              } finally {
                setSubmitting(false);
              }
            }}
          >
            {/* Email */}
            <div className="space-y-4">
              {/* Email */}
              <div className="text-left relative">
                <label
                  htmlFor="login_email"
                  className="block text-gray-600 mb-1 text-[16px]"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    id="login_email"
                    type="email"
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    } rounded-lg pl-9 pr-3 py-1.5 text-[16px] focus:ring-2 focus:ring-indigo-300 outline-none`}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="text-left relative">
                <label
                  htmlFor="login_password"
                  className="block text-gray-600 mb-1 text-[16px]"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    id="login_password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) =>
                      setForm({ ...form, password: e.target.value })
                    }
                    className={`w-full border ${
                      formErrors.password ? "border-red-500" : "border-gray-300"
                    } rounded-lg pl-9 pr-10 py-1.5 text-[16px] focus:ring-2 focus:ring-indigo-300 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.password}
                  </p>
                )}
              </div>
            </div>
            {/* Remember me + Forgot Password */}
            <div className="flex items-center justify-between text-sm text-gray-600 text-[16px]">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="accent-indigo-600 scale-95"
                  checked={form.remember}
                  onChange={(e) =>
                    setForm({ ...form, remember: e.target.checked })
                  }
                />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => {
                  setShowLogin(false);
                  setShowForgot(true);
                }}
                className="text-indigo-600 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            {serverError && (
              <p className="text-red-600 text-sm">{serverError}</p>
            )}

            {/* reCAPTCHA */}
            <div className="flex flex-col items-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken("")}
              />
              {formErrors.captcha && (
                <p className="text-red-600 text-sm mt-1">{formErrors.captcha}</p>
              )}
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-1.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-all text-[16px]"
            >
              {submitting ? "Signing in..." : "Login"}
            </button>
          </form>

          {/* OR Divider */}
          <div className="flex items-center gap-2 my-4">
            <hr className="flex-1 border-gray-300" />
            <span className="text-gray-500 text-sm">OR</span>
            <hr className="flex-1 border-gray-300" />
          </div>

          {/* Register link */}
          <p className="text-gray-500 mt-5 text-center text-[16px]">
            Don't have an account?{" "}
            <span
              onClick={() => {
                setShowRegister(true);
                setShowLogin(false);
              }}
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
