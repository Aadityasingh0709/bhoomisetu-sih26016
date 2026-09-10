import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Landmark, Loader2, ArrowLeft, Mail } from "lucide-react";
import { forgotPasswordRequest } from "../../api/auth.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const response = await forgotPasswordRequest(values.email);
      setResetInfo(response.demo || null);
      setSubmitted(true);
      toast.success("Password reset link sent to your email");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send reset link. Please try again.");
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
            Password Recovery
          </h2>
          <p className="mt-4 text-sm text-ink-300 leading-relaxed max-w-md">
            Enter your registered email address and we'll send you a link to reset your password.
            The link will expire in 10 minutes for security.
          </p>
        </div>

        <div className="relative z-10" />
      </div>

      {/* Right Column: Form */}
      <div className="flex lg:w-1/2 flex-col justify-center px-8 py-12 sm:px-12 lg:px-16">
        <div className="w-full max-w-md mx-auto">
          {!submitted ? (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Reset Your Password</h1>
                <p className="mt-2 text-sm text-ink-300">
                  We'll send a recovery link to your registered email address
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-white mb-2">
                    <div className="flex items-center gap-2">
                      <Mail size={16} />
                      Email Address
                    </div>
                  </label>
                  <input
                    type="email"
                    placeholder="your.email@landacquisition.gov.in"
                    disabled={loading}
                    {...register("email")}
                    className="w-full px-4 py-3 bg-ink-800/50 border border-ink-700 rounded-xl text-white placeholder-ink-500 focus:outline-none focus:ring-2 focus:ring-ochre-500 focus:border-transparent disabled:opacity-50"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-ochre-500 to-ochre-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ochre-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send Reset Link"
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
            </>
          ) : (
            <div className="text-center py-8">
              <div className="flex justify-center mb-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20 border border-green-500/30">
                  <Mail size={32} className="text-green-400" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-white mb-2">Check Your Email</h2>
              <p className="text-ink-300 mb-6">
                We've sent a password reset link to your email. The link will expire in 10 minutes.
              </p>

              {resetInfo && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 text-left">
                  <p className="text-xs font-semibold text-amber-300 mb-2">
                    🔐 Demo Mode - Reset Information
                  </p>
                  <div className="space-y-2 text-xs text-amber-200 font-mono">
                    <p>
                      <span className="text-amber-400">Reset Token:</span> {resetInfo.resetToken}
                    </p>
                    <p className="break-all">
                      <span className="text-amber-400">Reset URL:</span> {resetInfo.resetUrl}
                    </p>
                    <p>
                      <span className="text-amber-400">Expires in:</span> {resetInfo.expiresIn}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <button
                  onClick={() => navigate("/login")}
                  className="w-full py-3 px-4 bg-gradient-to-r from-ochre-500 to-ochre-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-ochre-500/30 transition-all"
                >
                  Back to Login
                </button>
                <button
                  onClick={() => setSubmitted(false)}
                  className="w-full py-3 px-4 bg-ink-800 border border-ink-700 text-white font-semibold rounded-xl hover:bg-ink-700 transition-all"
                >
                  Send to Another Email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
