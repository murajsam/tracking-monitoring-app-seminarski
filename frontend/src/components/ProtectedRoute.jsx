import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// route guard - allows only logged-in users
// if the route requires a role (allowedRole), only that role is allowed
const ProtectedRoute = ({ children, allowedRole }) => {
  const { user } = useAuth();

  // if the user isn't logged in, send them to the login page
  if (!user) {
    return <Navigate to="/login" />;
  }

  // if the route requires a role the user doesn't have, send them to the overview
  if (allowedRole && user.role !== allowedRole) {
    return <Navigate to="/overview" />;
  }

  // all good - render the requested page
  return children;
};

export default ProtectedRoute;
