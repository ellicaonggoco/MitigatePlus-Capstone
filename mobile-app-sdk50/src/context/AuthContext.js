import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import * as Location from "expo-location";
import api from "../services/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const syncLastKnownLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const { coords } = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const res = await api.patch("/auth/location", {
        lat: coords.latitude,
        lng: coords.longitude,
        accuracy: coords.accuracy,
      });

      setUser((prev) => (prev ? { ...prev, ...res.data.data } : prev));
    } catch {
      // Location sync is helpful for admins, but it should never block login.
    }
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const token = await SecureStore.getItemAsync("token");
        if (token) {
          try {
            const res = await api.get("/auth/users/me");
            if (mounted) {
              setUser(res.data.data);
              syncLastKnownLocation();
            }
          } catch {
            await SecureStore.deleteItemAsync("token");
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    const { token, user: userData } = res.data;
    await SecureStore.setItemAsync("token", token);
    setUser(userData);
    syncLastKnownLocation();
    return { success: true, user: userData };
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setUser(null);
  };

  const updateUser = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
