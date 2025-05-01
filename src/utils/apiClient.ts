// src/utils/apiClient.ts
import axios from "axios";
const SERVER_IP = "localhost:8081";
const HTTP_PROTOCOL = "http";

const API = axios.create({
  baseURL: `${HTTP_PROTOCOL}://${SERVER_IP}`, // Your API base URL
});

export default API;
