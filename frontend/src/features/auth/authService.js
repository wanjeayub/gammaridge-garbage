import axios from "axios";

const API_URL = "https://tester-server.vercel.app/api/auth";

// Register user
const register = async (userData) => {
  const response = await axios.post(`${API_URL}/register`, userData);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

// Login user
const login = async (userData) => {
  const response = await axios.post(`${API_URL}/login`, userData);
  if (response.data) {
    localStorage.setItem("user", JSON.stringify(response.data));
  }
  return response.data;
};

// Get user profile
const getProfile = async (token) => {
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
  const response = await axios.get(`${API_URL}/profile`, config);
  return response.data;
};

// Logout user
const logout = () => {
  localStorage.removeItem("user");
};

// Check token validity
const checkTokenExpiry = async () => {
  try {
    const response = await api.get("/validate-token");
    return response.data;
  } catch (error) {
    // If 401, token is invalid/expired
    if (error.response?.status === 401) {
      throw new Error("Token expired or invalid");
    }
    throw error;
  }
};

const authService = {
  register,
  login,
  getProfile,
  logout,
  checkTokenExpiry,
};

export default authService;
