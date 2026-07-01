import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // podrazumevano obican korisnik
  const [carrier, setCarrier] = useState("DHL"); // bira se samo ako je rola carrier
  const [error, setError] = useState("");

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // salje podatke za registraciju na backend
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await axios.post(API_URL + "/auth/register", {
        username,
        password,
        role,
        // dostavljaca saljemo samo ako je izabrana rola "carrier"
        carrier: role === "carrier" ? carrier : null,
      });
      loginUser(response.data);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="flex justify-center mb-6">
          <img src="/images/logo.png" alt="Logo" className="h-10 w-auto" />
        </div>
        <h1 className="text-2xl font-bold text-gray-700 text-center mb-6">
          Register
        </h1>

        {error && (
          <div className="bg-red-100 text-red-700 font-semibold p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
            required
          />

          {/* izbor role */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
          >
            <option value="user">User (uploads and sees all)</option>
            <option value="carrier">Carrier (sees only own)</option>
          </select>

          {/* izbor dostavljaca - prikazuje se samo ako je izabrana rola carrier */}
          {role === "carrier" && (
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
            >
              <option value="DHL">DHL</option>
              <option value="Hellman">Hellman</option>
              <option value="Logwin">Logwin</option>
            </select>
          )}

          <button
            type="submit"
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 rounded-lg"
          >
            Sign Up
          </button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-green-600 font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
