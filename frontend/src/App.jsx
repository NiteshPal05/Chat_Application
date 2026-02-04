import { useEffect, useState } from "react";
import { auth } from "./firebase/firebaseconfig";
import { onAuthStateChanged } from "firebase/auth";

import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatDashboard from "./pages/ChatDashboard";

export default function App() {
  const [user, setUser] = useState(null);

  // ✅ Register page should show first
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
  }, []);

  if (user) {
    return <ChatDashboard />
  }

  return (
    <div>
      {showLogin ? <Login /> : <Register />}

      <p className="text-center mt-4 text-gray-600">
        {showLogin ? "New user?" : "Already have an account?"}

        <button
          className="ml-2 text-green-600 font-semibold"
          onClick={() => setShowLogin(!showLogin)}
        >
          {showLogin ? "Register" : "Login"}
        </button>
      </p>
    </div>
  );
}
