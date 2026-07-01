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
    // AuthProvider omotava celu aplikaciju da svuda znamo ko je prijavljen
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* javne stranice - prijava i registracija */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* upload sme samo rola "user" */}
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

          {/* pregled i detalji - svaki prijavljen korisnik (carrier vidi samo svoje) */}
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
