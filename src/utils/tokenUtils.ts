// src/utils/tokenUtils.ts

import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  exp: number;
}

const isTokenExpired = (token: string | null): boolean => {
  if (!token) {
    sessionStorage.removeItem("token");
    return true;
  }

  try {
    const decodedToken: DecodedToken = jwtDecode(token);
    const currentTime = Date.now() / 1000; // Current time in seconds
    const expired = decodedToken.exp < currentTime + 20;
    if (expired) {
      sessionStorage.removeItem("token");
    }
    return expired;
  } catch (e) {
    sessionStorage.removeItem("token");
    return true;
  }
};

export default isTokenExpired;
