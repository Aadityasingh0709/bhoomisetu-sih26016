import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { Landmark, Loader2 } from "lucide-react";
import { loginRequest } from "../../api/auth.js";
import { useAuthStore } from "../../store/authStore.js";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const { token, user } = await loginRequest(values.email, values.password);
      setSession(token, user);
      toast.success(`Welcome back, ${user.name}`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-ochre-500">
            <Landmark size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">BhoomiSetu</h1>
          <p className="mt-1 text-sm text-ink-300">
            National Land Acquisition &amp; Management System
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4">
            <label className="mb-1 block text-sm font-medium text-ink-700">Email</label>
            <input
              type="email"
              {...register("email")}
              placeholder="you@department.gov.in"
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
            />
            {errors.email && <p className="mt-1 text-xs text-status-delayed">{errors.email.message}</p>}
          </div>
          <div className="mb-6">
            <label className="mb-1 block text-sm font-medium text-ink-700">Password</label>
            <input
              type="password"
              {...register("password")}
              placeholder="••••••••"
              className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-ochre-500 focus:ring-1 focus:ring-ochre-500"
            />
            {errors.password && <p className="mt-1 text-xs text-status-delayed">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 py-2.5 text-sm font-semibold text-white hover:bg-ink-700 disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            Log in
          </button>
          <p className="mt-4 text-center text-xs text-ink-300">
            Demo: admin@landacquisition.gov.in / password123
          </p>
        </form>
      </div>
    </div>
  );
}
