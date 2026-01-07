import { useState } from "react";
import toast from "react-hot-toast";
import { login } from "../api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Username and password are required");
      return;
    }

    setLoading(true);

    try {
      await login(username, password);
      toast.success("Login successful");
      onLogin();
    } catch (err) {
      if (err.response?.status === 401) {
        toast.error("Invalid username or password");
      } else {
        toast.error("Server error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-sky-50 to-purple-50">
      <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-10 w-full max-w-md">
        
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800">
          Your AI Co-Pilot for LinkedIn
        </h2>
        <p className="text-center text-gray-600 mb-6 text-sm">
          Automate content, schedule smarter, and grow your professional presence.
        </p>

        {/* Feature List */}
        <div className="bg-indigo-50/60 rounded-xl p-4 mb-6 text-sm text-gray-700 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">🤖</span>
            <span>AI-generated LinkedIn posts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">🗓️</span>
            <span>Manual & automatic scheduling</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">🔥</span>
            <span>Latest trending news topics</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-indigo-500">📈</span>
            <span>Consistent posting = better reach</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            required
            className="w-full p-3 rounded-xl border focus:ring-2 focus:ring-indigo-400 outline-none"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            disabled={loading}
            className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-3 rounded-xl font-medium transition disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
