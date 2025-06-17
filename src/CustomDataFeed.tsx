import { KLineData } from "klinecharts";
import {
  Datafeed,
  DatafeedSubscribeCallback,
  Period,
  SymbolInfo,
} from "./types";
import API from "./utils/API";
import { aggregateData, NATIVE_MULTIPLIERS, Timespan, UNIT_MS } from "./helper";
const SERVER_IP = "binary-trading-app-be.onrender.com";
const WEBSOCKET_PROTOCOL = "wss";
const socketUrl = `${WEBSOCKET_PROTOCOL}://${SERVER_IP}`;
const formatToSymbolFormat = (str: string): string => {
  const cleaned = str.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (cleaned.length > 3) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  return cleaned;
};

export default class CustomDatafeed implements Datafeed {
  private dispatch: any;
  constructor() {}

  private _ws?: WebSocket;

  private _currentPeriod?: Period;

  async searchSymbols(query?: string): Promise<SymbolInfo[]> {
    const all = (await API.getSymbols(sessionStorage.getItem("token") || ""))
      .data;

    // 2) (Optional) filter by query
    const ticker = query ? formatToSymbolFormat(query) : "";
    const q = query ? query.toLowerCase() : "";
    const filtered =
      q === ""
        ? all
        : all.filter(
            (s) =>
              s.ticker.toLowerCase().includes(ticker) ||
              s.name.toLowerCase().includes(ticker) ||
              (s.description || "").toLowerCase().includes(q)
          );

    // 3) Map to SymbolInfo (and drop isFavorite if you don’t need it downstream)
    return filtered.map<SymbolInfo>((s) => ({
      _id: s._id,
      payout: s.payout || 0,
      ticker: s.ticker,
      shortName: s.name,
      name: s.description,
      market: s.type,
      type: s.type,
      priceCurrency: "USD",
      pricePrecision: 5,
      logo: "",
      // carry the flag forward so your UI can read it
      isFavorite: s.isFavorite,
    }));
  }

  async getHistoryKLineData(
    symbol: SymbolInfo,
    period: Period,
    from: number,
    to: number
  ): Promise<KLineData[]> {
    const ts = period.timespan as Timespan;
    const nativeMult = NATIVE_MULTIPLIERS[ts];
    try {
      // fetch the finest-grained bars from the backend
      const rawData: any[] = (
        await API.getTradingDataWithParams(
          symbol.shortName as string,
          ts,
          from,
          to
        )
      ).data;

      // if backend already gives your requested period, just pass through
      if (period.multiplier === nativeMult) {
        return rawData.map((d) => ({
          timestamp: d.date,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
        }));
      }

      const data = aggregateData(rawData, period, from, ts);

      // otherwise aggregate
      return data;
    } catch (error) {
      console.error("Error fetching historical data:", error);
      return [];
    }
  }

  subscribe(
    symbol: SymbolInfo,
    period: Period,
    callback: DatafeedSubscribeCallback
  ): void {
    this._currentPeriod = period;

    // Close existing WebSocket connection if any
    this._ws?.close();
    try {
      // Create new WebSocket connection
      this._ws = new WebSocket(socketUrl);

      this._ws.onopen = () => {
        this._ws?.send(
          JSON.stringify({
            action: "subscribe",
            symbol: symbol.shortName || "USD-JPY",
            userId: sessionStorage.getItem("id") || "681252f8b04287fdfbe9890d",
            token: "2903alksdjf",
          })
        );
      };

      this._ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.symbol && data.price) {
          // Create a KLineData object from the received price data
          const timestamp = data.time;

          // Align the timestamp to the current period boundary
          const alignedTimestamp = this.alignTimestampToPeriodBoundary(
            timestamp,
            this._currentPeriod!
          );

          // Call the callback with the new data
          callback({
            timestamp: alignedTimestamp,
            open: data.price,
            high: data.price,
            low: data.price,
            close: data.price,
            volume: data.volume,
          });
        }
        if (data.type == "TRADE_COMPLETED") {
        }
      };

      this._ws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };

      this._ws.onclose = () => {
        console.log("WebSocket connection closed.");
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
    }
  }

  // Add this helper method to align timestamps to period boundaries
  private alignTimestampToPeriodBoundary(
    timestamp: number,
    period: Period
  ): number {
    const windowMs = period.multiplier * UNIT_MS[period.timespan as Timespan];
    // Align to fixed time boundaries by flooring to the nearest period boundary
    return Math.floor(timestamp / windowMs) * windowMs;
  }
  unsubscribe(symbol: SymbolInfo, period: Period): void {
    console.log(symbol, period);
  }
}
