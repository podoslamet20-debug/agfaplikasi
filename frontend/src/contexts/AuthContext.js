import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_API_URL;
const API = `${BACKEND_URL}/api`;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Restore token from localStorage if it exists
        const token = localStorage.getItem("access_token");
        console.log("📝 Token from localStorage:", token ? token.substring(0, 20) + "..." : "NOT FOUND");

        if (token) {
          axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
          console.log("✅ Authorization header set from localStorage token");
        } else {
          console.log("⚠️ No token in localStorage, skipping auth header");
        }

        const { data } = await axios.get(`${API}/auth/me`);
        console.log("✅ Auth check passed, user:", data);
        setUser(data);
      } catch (error) {
        console.error("❌ Auth check failed:", error.response?.status, error.response?.data);
        // Clear invalid token
        localStorage.removeItem("access_token");
        delete axios.defaults.headers.common["Authorization"];
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await axios.post(`${API}/auth/login`, { email, password });
    if (data.access_token) {
      localStorage.setItem("access_token", data.access_token);
      // Set the token in axios default header
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
      console.log("✅ Token stored in localStorage and axios header set:", data.access_token.substring(0, 20) + "...");
    } else {
      console.warn("⚠️ Login response missing access_token field:", data);
    }
    setUser(data);
    return data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`);
    localStorage.removeItem("access_token");
    delete axios.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff";
  const isGuest = user?.role === "guest";
  const canEdit = isAdmin;
  const canEditPartial = isAdmin || isStaff;
  const canSeePrice = isAdmin;
  const canSeeCraftsman = isAdmin || isStaff;

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isStaff, isGuest, canEdit, canEditPartial, canSeePrice, canSeeCraftsman, API }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
