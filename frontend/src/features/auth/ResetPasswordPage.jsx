import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Landmark, Loader2, ArrowLeft, Lock, Eye, EyeOff } from "lucide-react";
import { resetPasswordRequest } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";

const schema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "Passwords don't match",
  path: ["passwordConfirm"],
});

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    if (!token) {
      toast.error("Invalid reset token");
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordRequest(token, values.password, values.passwordConfirm);
      setSession(response.token, response.user);
      toast.success("Password reset successful! Logging you in...");
      navigate(response.user.role === "DepartmentOfficer" ? "/department" : "/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-900 text-ink-100">
      {/* Left Column */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-ink-950 via-ink-900 to-slate-900 border-r border-ink-800">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-ochre-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-ochre-500 to-ochre-600 text-white shadow-xl shadow-ochre-500/30">
              <Landmark size={26} className="stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-white">BhoomiSetu</span>
                <span className="rounded-full bg-ochre-500/20 border border-ochre-500/30 px-2.5 py-0.5 text-[10px] font-bold text-ochre-300">
                  SIH 26016
                </span>
              </div>
              <p className="text-xs font-medium text-ink-300">
                Ministry of Rural Development · Dept. of Land Resources (DoLR)
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 my-auto py-8">
          <h2 className="text-3xl font-extrabold text-white leading-tight tracking-tight max-w-lg">
            Create a Strong New Password
          </h2>
          <p className="mt-4 text-sm text-ink-300 leading-relaxed max-w-md">
            Ensure your password is secure with uppercase, lowercase, numbers, and special characters.
            Minimum 8 characters recommended.
          </p>
        </div>

        <div className="relative z-10" />
      </div>

      {/* Right Column: Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-8 sm:px-10 lg:px-16 min-h-screen">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Header */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-ochre-500 text-white mb-2 shadow-lg">
              <Landmark size={24} />
            </div>
            <h1 className="text-xl font-bold text-white">BhoomiSetu</h1>
            <p className="text-xs text-ink-400">National Land Acquisition &amp; Management System</p>
          </div>

          <div className="mb-6 sm:mb-8">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Reset Your Password</h1>
            <p className="mt-1.5 text-xs sm:text-sm text-ink-300">
              Enter a new password for your account
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  New Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  disabled={loading}
                  {...register("password")}
                  className="w-full px-4 py-3 bg-ink-800/50 border border-ink-700 rounded-xl text-white placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-ochre-500 focus:border-transparent disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                <div className="flex items-center gap-2">
                  <Lock size={16} />
                  Confirm Password
                </div>
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  disabled={loading}
                  {...register("passwordConfirm")}
                  className="w-full px-4 py-3 bg-ink-800/50 border border-ink-700 rounded-xl text-white placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-ochre-500 focus:border-transparent disabled:opacity-50 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-300 transition-colors"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.passwordConfirm && (
                <p className="mt-1 text-sm text-red-400">{errors.passwordConfirm.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-ink-800/50 border border-ink-700 rounded-xl p-4">
              <p className="text-xs font-semibold text-ink-300 mb-2">Password Requirements:</p>
              <ul className="text-xs text-ink-400 space-y-1">
                <li>✓ At least 8 characters</li>
                <li>✓ Mix of uppercase and lowercase letters</li>
                <li>✓ Include numbers</li>
                <li>✓ Include special characters (@, #, $, !, etc.)</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-gradient-to-r from-ochre-500 to-ochre-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ochre-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          <div className="mt-6 border-t border-ink-700 pt-6">
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 text-ochre-400 hover:text-ochre-300 font-medium transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
