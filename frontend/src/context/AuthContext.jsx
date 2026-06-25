import React, { createContext, useContext, useState } from "react";

// kontekst za prijavljenog korisnika - da mu mozemo pristupiti iz cele aplikacije
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // korisnika cuvamo i u localStorage da ostane prijavljen i posle osvezavanja stranice
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      return JSON.parse(savedUser);
    } else {
      return null;
    }
  });

  // poziva se posle uspesne prijave ili registracije (data = { token, user })
  const loginUser = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  // odjava - brisemo token i korisnika
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

// kraci nacin da iz bilo koje komponente uzmemo prijavljenog korisnika
export const useAuth = () => useContext(AuthContext);
