import * as SecureStore from "expo-secure-store";

// Android emulator fallback is 10.0.2.2. Set EXPO_PUBLIC_API_URL for real devices and production builds.
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5000/api";
const REQUEST_TIMEOUT_MS = 10000;

const request = async (url, method, body, customHeaders = {}) => {
  const token = await SecureStore.getItemAsync("token");
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...customHeaders,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const config = { method, headers, signal: controller.signal };
  if (body) config.body = isFormData ? body : JSON.stringify(body);

  let response;
  try {
    response = await fetch(`${API_URL}${url}`, config);
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error("Request timed out. Check that the backend is running.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401) {
    await SecureStore.deleteItemAsync("token");
  }

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || "Request failed");
    error.response = { status: response.status, data };
    throw error;
  }
  return { data };
};

const api = {
  get: (url, headers) => request(url, "GET", null, headers),
  post: (url, body, headers) => request(url, "POST", body, headers),
  patch: (url, body, headers) => request(url, "PATCH", body, headers),
  delete: (url, headers) => request(url, "DELETE", null, headers),
};

export default api;
