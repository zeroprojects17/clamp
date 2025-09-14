import React, { useState, useEffect } from "react";
import {
  Power,
  Gauge,
  Activity,
  Layers,
  LogIn,
  LogOut,
  RefreshCw,
} from "lucide-react";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";
import {
  getAuth,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

// 🔹 Firebase Config (from .env)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const App = () => {
  // Authentication
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Clamp Data
  const [deviceData, setDeviceData] = useState({
    __connected: "disconnected",
    current_now: "0.000",
    mode: "measurement",
    unit: "0.000",
  });

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [status, setStatus] = useState("Disconnected");

  // 🔹 Init Firebase
  useEffect(() => {
    let app, database, authService;
    try {
      if (!getApps().length) {
        app = initializeApp(firebaseConfig);
      } else {
        app = getApp();
      }
      database = getDatabase(app);
      authService = getAuth(app);
      setDb(database);
      setAuth(authService);

      // Auth listener
      onAuthStateChanged(authService, (currentUser) => {
        setUser(currentUser);
      });
    } catch (e) {
      console.error("Firebase init error:", e);
    }
  }, []);

  // 🔹 Listen to Clamp Data
  useEffect(() => {
    if (db && user) {
      const dataRef = ref(db, "/");
      onValue(
        dataRef,
        (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setDeviceData({
              __connected: data.__connected || "disconnected",
              current_now: parseFloat(data.current_now || 0).toFixed(3),
              mode: data.mode || "measurement",
              unit: parseFloat(data.unit || 0).toFixed(3),
            });
            setStatus("Connected");
          }
        },
        (error) => {
          console.error("DB read error:", error);
          setStatus("Disconnected");
        }
      );
    }
  }, [db, user]);

  // 🔹 Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!auth) return;
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError("Login failed. Check email & password.");
      console.error("Login error:", error);
    }
  };

  // 🔹 Logout
  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // 🔹 Toggle mode
  const toggleMode = async () => {
    if (!db) return;
    const newMode =
      deviceData.mode === "measurement" ? "monitoring" : "measurement";
    try {
      await set(ref(db, "mode"), newMode);
    } catch (error) {
      console.error("Failed to toggle mode:", error);
    }
  };

  // 🔹 Login Page
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg w-full max-w-sm">
          <h1 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-center">
            <LogIn className="mr-2 text-indigo-600" />
            Clamp Login
          </h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            {loginError && (
              <p className="text-sm text-red-500">{loginError}</p>
            )}
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 text-sm"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 🔹 Dashboard
  return (
    <div className="min-h-screen bg-gray-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 gap-3">
          <h1 className="text-xl sm:text-2xl font-bold flex items-center">
            <Power className="mr-2 text-indigo-600" /> Clamp Monitor
          </h1>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <span className="text-sm text-gray-600 break-all">
              {user.email}
            </span>
            <span
              className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                status === "Connected"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {status}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-800 text-sm"
            >
              <LogOut size={16} className="mr-1" /> Logout
            </button>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-xl flex flex-col items-center">
            <Gauge className="text-indigo-600 mb-2" size={28} />
            <p className="text-xs sm:text-sm text-gray-500">Current (A)</p>
            <p className="text-2xl font-bold">{deviceData.current_now}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl flex flex-col items-center">
            <Layers className="text-indigo-600 mb-2" size={28} />
            <p className="text-xs sm:text-sm text-gray-500">Unit (kWh)</p>
            <p className="text-2xl font-bold">{deviceData.unit}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl flex flex-col items-center">
            <Activity className="text-indigo-600 mb-2" size={28} />
            <p className="text-xs sm:text-sm text-gray-500">Mode</p>
            <p className="text-lg font-semibold">{deviceData.mode}</p>
            <button
              onClick={toggleMode}
              className="mt-3 px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center text-sm"
            >
              <RefreshCw size={14} className="mr-2" />
              Toggle Mode
            </button>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl flex flex-col items-center">
            <Power className="text-indigo-600 mb-2" size={28} />
            <p className="text-xs sm:text-sm text-gray-500">Connection</p>
            <p className="text-lg font-semibold">{deviceData.__connected}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
