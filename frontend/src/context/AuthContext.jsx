import React, { createContext, useContext, useState } from "react";

// context for the logged-in user - so it can be accessed from the whole app
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // keep the user in localStorage so they stay logged in after a page refresh
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      return JSON.parse(savedUser);
    } else {
      return null;
    }
  });

  // called after a successful login or registration (data = { token, user })
  const loginUser = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  // logout - remove the token and the user
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// shortcut to read the logged-in user from any component
export const useAuth = () => useContext(AuthContext);
