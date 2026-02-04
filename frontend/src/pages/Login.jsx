import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import AuthCard from "../components/AuthCard";

export default function Login() {
  const BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const loginHandler = async (e) => {
    e.preventDefault();

    try {
      await signInWithEmailAndPassword(auth, email, password);
      await fetch(`{BASE_URL}/api/users/last-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      alert("✅ Login Successful!");
    } catch (error) {
      alert("❌ " + error.message);
    }
  };

  return (
    <AuthCard title="Welcome Back">
      <form onSubmit={loginHandler} className="space-y-4">
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 border rounded-xl bg-white"
          required
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 border rounded-xl bg-white"
          required
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="w-full bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700">
          Login
        </button>
      </form>
    </AuthCard>
  );
}
