// Import directly from your source files
import { KLineChartPro } from "./index";
import "./main.less"; // Adjust path as needed
import CustomDatafeed from "./CustomDataFeed";
// Function to get local timezone
function getLocalTimezone(): string {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timezone;
  } catch (error) {
    console.error("Failed to get timezone:", error);
    return "UTC";
  }
}

// Initialize chart when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("chart-container");

  if (container) {
    const chart = new KLineChartPro({
      container: container,
      locale: "en-US",
      theme: "dark",
      styles: {
        grid: { horizontal: { color: "#333" }, vertical: { color: "#333" } },
      },
      timezone: getLocalTimezone(),
      watermark: "",
      symbol: {
        exchange: "XNYS",
        market: "forex",
        name: "Sample Currency Pair",
        shortName: "USD-JPY",
        ticker: "C:USD-JPY",
        priceCurrency: "usd",
        type: "ADRC",
        pricePrecision: 4,
        payout: 0,
      },
      mainIndicators: [],
      subIndicators: [],
      period: {
        multiplier: 5,
        timespan: "second",
        text: "5s",
      },
      datafeed: new CustomDatafeed(),
    });

    // Make chart available globally for debugging
    (window as any).chart = chart;
  }
});
