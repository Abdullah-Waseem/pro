// src/utils/API.ts
import { AxiosResponse } from "axios";

import apiClient from "../utils/apiClient";

// Define the API service with TypeScript
export default {
  //API for trading data module
  getTradingDataWithParams(
    symbol: string,
    unit: string,
    min: number,
    max: number
  ): Promise<AxiosResponse<any[]>> {
    return apiClient.get("/tradingData", {
      params: {
        symbol,
        unit,
        min,
        max,
      },
      headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
    });
  },

  //API for symbols module
  getSymbols(token: string): Promise<AxiosResponse<any[]>> {
    return apiClient.get("/symbols", {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  getTradingDataforSymbol(symbol: string): Promise<AxiosResponse<any[]>> {
    return apiClient.post(
      "/tradingData/",
      { symbol },
      {
        headers: { Authorization: `Bearer ${sessionStorage.getItem("token")}` },
      }
    );
  },
};
