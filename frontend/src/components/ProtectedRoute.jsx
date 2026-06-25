import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// komponenta koja stiti rute - pusta samo prijavljene korisnike
// ako ruta trazi odredjenu rolu (allowedRole), pusta samo tu rolu
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  // ako korisnik nije prijavljen, saljemo ga na stranicu za prijavu
  if (!user) {
    return <Navigate to="/login" />;
  }

  // ako ruta trazi odredjenu rolu a korisnik je nema, saljemo ga na pregled
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/overview" />;
  }

  // sve je ok - prikazujemo trazenu stranicu
  return children;
};

export default ProtectedRoute;
