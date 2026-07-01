// base URL of the backend - all API routes start from here
export const API_URL = "http://localhost:5000/api";

// returns the auth header with the token if the user is logged in
// (this header is sent with every request that requires login)
export function authHeader() {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: "Bearer " + token };
  } else {
    return {};
  }
}
