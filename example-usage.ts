/**
 * Example usage of the onSymbolChangeRequest callback mechanism
 * This demonstrates how to use the new callback to control symbol changes
 * and prevent rapid symbol switching conflicts.
 */

import KLineChartPro from "./src/KLineChartPro";
import { SymbolInfo, ChartProOptions, SymbolChangeSource } from "./src/types";

// Example: Basic usage with symbol change control
const basicExample = () => {
  const chartOptions: ChartProOptions = {
    container: "chart-container",
    symbol: {
      ticker: "BTCUSD",
      name: "Bitcoin USD",
      shortName: "BTC/USD",
      pricePrecision: 2,
      payout: 85,
    },
    period: { multiplier: 1, timespan: "minute", text: "1m" },
    datafeed: {
      // Your datafeed implementation
      searchSymbols: async () => [],
      getHistoryKLineData: async () => [],
      subscribe: () => {},
      unsubscribe: () => {},
    },

    // NEW: Symbol change request callback
    onSymbolChangeRequest: async (
      symbol: SymbolInfo,
      source: SymbolChangeSource
    ) => {
      console.log(`Symbol change requested: ${symbol.ticker} from ${source}`);

      // Your custom logic here - examples:

      // 1. Simple validation
      if (!symbol.ticker) {
        console.warn("Invalid symbol - no ticker");
        return false;
      }

      // 2. Allow the change
      return true;
    },
  };

  const chart = new KLineChartPro(chartOptions);
};

// Example: Advanced usage with debouncing and validation
const advancedExample = () => {
  let pendingSymbolChange: string | null = null;

  const chartOptions: ChartProOptions = {
    container: "chart-container",
    symbol: {
      ticker: "EURUSD",
      name: "Euro USD",
      shortName: "EUR/USD",
      pricePrecision: 5,
      payout: 80,
    },
    period: { multiplier: 5, timespan: "minute", text: "5m" },
    datafeed: {
      // Your datafeed implementation
      searchSymbols: async () => [],
      getHistoryKLineData: async () => [],
      subscribe: () => {},
      unsubscribe: () => {},
    },

    // Advanced symbol change control
    onSymbolChangeRequest: async (
      symbol: SymbolInfo,
      source: SymbolChangeSource
    ) => {
      console.log(`Symbol change requested: ${symbol.ticker} from ${source}`);

      // Prevent rapid switching to the same symbol
      if (pendingSymbolChange === symbol.ticker) {
        console.log(
          "Symbol change already pending, ignoring duplicate request"
        );
        return false;
      }

      // Track pending change
      pendingSymbolChange = symbol.ticker;

      try {
        // Custom validation logic
        if (source === "modal" && !(await validateSymbolFromModal(symbol))) {
          return false;
        }

        if (source === "favorites" && !(await validateFavoriteSymbol(symbol))) {
          return false;
        }

        // Simulate async operation (e.g., checking permissions, loading data)
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Update your app state
        await updateAppSymbolState(symbol);

        console.log(`Symbol change approved: ${symbol.ticker}`);
        return true;
      } catch (error) {
        console.error("Error in symbol change callback:", error);
        return false;
      } finally {
        // Clear pending change
        pendingSymbolChange = null;
      }
    },
  };

  const chart = new KLineChartPro(chartOptions);

  // Helper functions
  async function validateSymbolFromModal(symbol: SymbolInfo): Promise<boolean> {
    // Your modal-specific validation logic
    return symbol.payout > 0;
  }

  async function validateFavoriteSymbol(symbol: SymbolInfo): Promise<boolean> {
    // Your favorites-specific validation logic
    return symbol.isFavorite === true;
  }

  async function updateAppSymbolState(symbol: SymbolInfo): Promise<void> {
    // Update your main app's state
    // This is where you would coordinate with your app's symbol management
    console.log("Updating app state for symbol:", symbol.ticker);
  }
};

// Example: Programmatic symbol changes
const programmaticExample = () => {
  let chart: KLineChartPro;

  const chartOptions: ChartProOptions = {
    container: "chart-container",
    symbol: {
      ticker: "GBPUSD",
      name: "British Pound USD",
      shortName: "GBP/USD",
      pricePrecision: 5,
      payout: 82,
    },
    period: { multiplier: 15, timespan: "minute", text: "15m" },
    datafeed: {
      // Your datafeed implementation
      searchSymbols: async () => [],
      getHistoryKLineData: async () => [],
      subscribe: () => {},
      unsubscribe: () => {},
    },

    onSymbolChangeRequest: async (
      symbol: SymbolInfo,
      source: SymbolChangeSource
    ) => {
      console.log(`Symbol change from ${source}: ${symbol.ticker}`);

      // Log the source for debugging
      if (source === "api") {
        console.log("Programmatic symbol change detected");
      }

      return true;
    },
  };

  chart = new KLineChartPro(chartOptions);

  // Programmatically change symbol using the new method
  const changeSymbolProgrammatically = async (newSymbol: SymbolInfo) => {
    try {
      await chart.handleSymbolChange(newSymbol, "api");
      console.log("Symbol changed programmatically");
    } catch (error) {
      console.error("Failed to change symbol:", error);
    }
  };

  // Example usage
  setTimeout(() => {
    changeSymbolProgrammatically({
      ticker: "USDJPY",
      name: "US Dollar Japanese Yen",
      shortName: "USD/JPY",
      pricePrecision: 3,
      payout: 78,
    });
  }, 5000);
};

// Export examples for use
export { basicExample, advancedExample, programmaticExample };
