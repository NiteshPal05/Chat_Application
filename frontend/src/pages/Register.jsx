import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/firebaseconfig";
import AuthCard from "../components/AuthCard";

export default function Register() {
    const BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");


  const registerHandler = async (e) => {
    e.preventDefault();

    try {
      // ✅ Step 1: Register in Firebase
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      alert("✅ Registered Successfully!");

      // ✅ Step 2: Save user in MongoDB
      await fetch(`${BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUID: userCred.user.uid,
          email: userCred.user.email,
          username: username,

        }),
      });

      console.log("✅ User saved in MongoDB!");

    } catch (error) {
      alert("❌ " + error.message);
    }
  };

  return (
    <AuthCard title="Create Account">
      <form onSubmit={registerHandler} className="space-y-4">
        <input
          type="text"
          placeholder="Username"
          className="w-full p-3 border rounded-xl bg-white"
          required
          onChange={(e) => setUsername(e.target.value)}
        />

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

        <button className="w-full bg-green-600 text-white p-3 rounded-xl hover:bg-green-700">
          Register
        </button>
      </form>
    </AuthCard>
  );
}
