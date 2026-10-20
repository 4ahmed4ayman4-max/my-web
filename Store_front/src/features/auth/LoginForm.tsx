import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { z } from "zod";

/**
 * Login form schema - matches backend LoginRequestDto
 */
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

export interface LoginFormProps {
  isLoading?: boolean;
  onSuccess?: () => void;
}

export function LoginForm({ isLoading = false, onSuccess }: LoginFormProps) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const { login: performLogin, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const busy = isLoading || submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setErrors([]);
    setSubmitting(true);

    try {
      const validated = LoginSchema.parse(formData);
      const auth = await performLogin(validated);

      // Check if onSuccess was passed (parent may handle routing)
      if (onSuccess) {
        onSuccess();
      } else {
        // Default: redirect based on the role of the account that just logged in
        if (auth.user?.roles?.includes("Admin")) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      }
    } catch (error: any) {
      setErrors(error.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6">
        Sign In
      </h2>

      {errors.length > 0 && (
        <div className="mb-4 p-3 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
          {errors.map((err, index) => (
            <p key={index} className="mb-1 text-sm">
              {err}
            </p>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            autoComplete="email"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            placeholder="email@example.com"
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            autoComplete="current-password"
            className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-gray-100"
            required
          />
        </div>

        <button
          type="submit"
          disabled={busy}
          className={`w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            busy
              ? "opacity-60 cursor-not-allowed bg-gray-200 dark:bg-gray-600 text-gray-700"
              : "bg-primary-600 text-white hover:bg-primary-700 dark:hover:bg-primary-500"
          }`}
        >
          {busy ? "Signing in..." : "Sign In"}
        </button>
      </form>

      <div className="text-center mt-4 text-sm">
        <Link to="/register" className="text-primary-600 dark:text-primary-400 hover underline">
          Don't have an account? Register
        </Link>
      </div>

      {!isAuthenticated && (
        <p className="text-center text-sm mt-4 text-gray-500 dark:text-gray-400">
          Having trouble? Contact support.
        </p>
      )}
    </div>
  );
}