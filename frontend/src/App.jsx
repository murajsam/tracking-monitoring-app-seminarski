import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import UploadPage from "./pages/Upload Page/UploadPage";
import OverviewPage from "./pages/Overview Page/OverviewPage";
import DetailPage from "./pages/Detail Page/DetailPage";
import LoginPage from "./pages/Auth Page/LoginPage";
import RegisterPage from "./pages/Auth Page/RegisterPage";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App = () => {
  return (
    // AuthProvider wraps the whole app so we always know who is logged in
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* public pages - login and register */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* only role "user" may upload */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRole="user">
                <UploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRole="user">
                <UploadPage />
              </ProtectedRoute>
            }
          />

          {/* overview and details - any logged-in user (carrier sees only its own) */}
          <Route
            path="/overview"
            element={
              <ProtectedRoute>
                <OverviewPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/details/:id"
            element={
              <ProtectedRoute>
                <DetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
