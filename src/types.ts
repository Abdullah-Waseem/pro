/**
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at

 * http://www.apache.org/licenses/LICENSE-2.0

 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { KLineData, Styles, DeepPartial } from "klinecharts";

export interface SymbolInfo {
  _id?: string;
  ticker: string;
  name?: string;
  shortName?: string;
  exchange?: string;
  market?: string;
  pricePrecision?: number;
  volumePrecision?: number;
  priceCurrency?: string;
  type?: string;
  logo?: string;
  isFavorite?: boolean;
  payout: number;
}

export interface Period {
  multiplier: number;
  timespan: string;
  text: string;
}

export interface TradesData {
  ticketNo: string;
  symbol: string;
  currency: string;
  tradeDirection: string;
  amountInvested: number;
  openingPrice: number | null;
  closingPrice: number | null;
  openingTime: string;
  payout: number;
  closingTime: string;
  isComplete: boolean;
  pnlValue: number | null;
  accountNo: string;
}

export type DatafeedSubscribeCallback = (data: KLineData) => void;

export interface Datafeed {
  searchSymbols(search?: string): Promise<SymbolInfo[]>;
  getHistoryKLineData(
    symbol: SymbolInfo,
    period: Period,
    from: number,
    to: number
  ): Promise<KLineData[]>;
  subscribe(
    symbol: SymbolInfo,
    period: Period,
    callback: DatafeedSubscribeCallback
  ): void;
  addOrRemoveFavorite?(symbol: SymbolInfo): Promise<boolean>;
  unsubscribe(symbol: SymbolInfo, period: Period): void;
}

export interface ChartProOptions {
  container: string | HTMLElement;
  styles?: DeepPartial<Styles>;
  watermark?: string | Node;
  theme?: string;
  locale?: string;
  drawingBarVisible?: boolean;
  symbol: SymbolInfo;
  period: Period;
  periods?: Period[];
  timezone?: string;
  mainIndicators?: string[];
  subIndicators?: string[];
  datafeed: Datafeed;
}

export interface ChartPro {
  setTheme(theme: string): void;
  getTheme(): string;
  setStyles(styles: DeepPartial<Styles>): void;
  getStyles(): Styles;
  setLocale(locale: string): void;
  getLocale(): string;
  setTimezone(timezone: string): void;
  getTimezone(): string;
  setSymbol(symbol: SymbolInfo): void;
  getSymbol(): SymbolInfo;
  setPeriod(period: Period): void;
  getPeriod(): Period;
  createTrade(trade: TradesData): void;
  toggleSearchSymbolModal?(): void;
}
