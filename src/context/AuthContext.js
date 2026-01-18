// src/context/AuthContext.js

import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load stored user on app startup
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("userData");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (err) {
        console.log("Error loading stored user:", err);
      }
      setIsLoading(false);
    };

    loadUserFromStorage();
  }, []);

  // Save user to AsyncStorage & update state
  const saveUser = async (data) => {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(data));
      setUser(data);
    } catch (err) {
      console.log("Error saving user:", err);
    }
  };

  // Logout & clear storage
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      setUser(null);
    } catch (err) {
      console.log("Error removing user:", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, saveUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
