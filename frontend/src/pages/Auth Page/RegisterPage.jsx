import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "../../api";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user"); // default: regular user
  const [carrier, setCarrier] = useState(""); // only used if the role is carrier
  const [carrierOptions, setCarrierOptions] = useState([]); // list of carriers from the backend
  const [error, setError] = useState("");

  // load the list of supported carriers from the backend (comes from the configuration)
  useEffect(() => {
    const loadCarriers = async () => {
      try {
        const response = await axios.get(API_URL + "/carriers");
        setCarrierOptions(response.data.carriers);
        // preselect the first carrier so the dropdown is never empty
        if (response.data.carriers.length > 0) {
          setCarrier(response.data.carriers[0]);
        }
      } catch (err) {
        setError("Failed to load the carrier list.");
      }
    };
    loadCarriers();
  }, []);

  const { loginUser } = useAuth();
  const navigate = useNavigate();

  // send registration data to the backend
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const response = await axios.post(API_URL + "/auth/register", {
        username,
        password,
        role,
        // only send carrier if the "carrier" role is selected
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

          {/* role selection */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
          >
            <option value="user">User (uploads and sees all)</option>
            <option value="carrier">Carrier (sees only own)</option>
          </select>

          {/* carrier selection - shown only if the carrier role is selected */}
          {role === "carrier" && (
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="border border-gray-300 rounded-lg p-3 focus:outline-none focus:border-green-500"
            >
              {carrierOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
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
