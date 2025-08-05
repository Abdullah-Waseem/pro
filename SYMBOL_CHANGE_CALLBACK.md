# Symbol Change Request Callback

This document describes the new `onSymbolChangeRequest` callback mechanism that provides centralized control over symbol changes and prevents rapid symbol switching conflicts.

## Problem Solved

Previously, when multiple symbols were selected rapidly from the symbol search modal or favorite symbols, the chart would continuously switch between symbols without settling on one. This created a poor user experience and potential performance issues.

## Solution Overview

The new `onSymbolChangeRequest` callback mechanism provides:

1. **Centralized Control**: All symbol changes go through your main app via a callback
2. **Debouncing**: Built-in 300ms debouncing prevents rapid symbol changes
3. **Source Tracking**: Know whether the change came from modal, favorites, or API
4. **Validation**: Implement custom validation logic before allowing changes
5. **Backward Compatibility**: Existing implementations continue to work

## API Reference

### Types

```typescript
type SymbolChangeSource = "modal" | "favorites" | "api";

type SymbolChangeRequestCallback = (
  symbol: SymbolInfo,
  source: SymbolChangeSource
) => Promise<boolean> | boolean;
```

### ChartProOptions

```typescript
interface ChartProOptions {
  // ... existing options
  onSymbolChangeRequest?: SymbolChangeRequestCallback;
}
```

### ChartPro Interface

```typescript
interface ChartPro {
  // ... existing methods
  handleSymbolChange(
    symbol: SymbolInfo,
    source: SymbolChangeSource
  ): Promise<void>;
}
```

## Usage Examples

### Basic Usage

```typescript
import KLineChartPro from "./src/KLineChartPro";

const chart = new KLineChartPro({
  container: "chart-container",
  symbol: { ticker: "BTCUSD" /* ... */ },
  period: { multiplier: 1, timespan: "minute", text: "1m" },
  datafeed: {
    /* your datafeed */
  },

  // Control symbol changes
  onSymbolChangeRequest: async (symbol, source) => {
    console.log(`Symbol change requested: ${symbol.ticker} from ${source}`);

    // Your validation logic here
    if (!symbol.ticker) {
      return false; // Reject the change
    }

    // Update your app state
    await updateAppState(symbol);

    return true; // Allow the change
  },
});
```

### Advanced Usage with Validation

```typescript
const chart = new KLineChartPro({
  // ... other options

  onSymbolChangeRequest: async (symbol, source) => {
    try {
      // Different validation based on source
      switch (source) {
        case "modal":
          if (!(await validateModalSymbol(symbol))) {
            return false;
          }
          break;

        case "favorites":
          if (!symbol.isFavorite) {
            console.warn("Non-favorite symbol selected from favorites");
            return false;
          }
          break;

        case "api":
          if (!(await validateApiSymbol(symbol))) {
            return false;
          }
          break;
      }

      // Update your app's symbol state
      await myApp.setCurrentSymbol(symbol);

      return true;
    } catch (error) {
      console.error("Symbol change validation failed:", error);
      return false;
    }
  },
});
```

### Programmatic Symbol Changes

```typescript
// Change symbol programmatically
await chart.handleSymbolChange(
  {
    ticker: "EURUSD",
    name: "Euro USD",
    shortName: "EUR/USD",
    pricePrecision: 5,
    payout: 80,
  },
  "api"
);
```

## Behavior Details

### Debouncing

- All symbol change requests are debounced with a 300ms delay
- Rapid successive requests cancel previous pending requests
- Only the final request in a sequence is processed

### Source Types

- **`'modal'`**: Symbol selected from the symbol search modal
- **`'favorites'`**: Symbol selected from favorite symbols in the period bar
- **`'api'`**: Symbol changed programmatically via `handleSymbolChange()`

### Fallback Behavior

- If no callback is provided, symbols change directly (backward compatibility)
- If the callback throws an error, the change falls back to direct mode
- If the callback returns `false`, the symbol change is rejected

### Error Handling

```typescript
onSymbolChangeRequest: async (symbol, source) => {
  try {
    // Your logic here
    return await processSymbolChange(symbol);
  } catch (error) {
    console.error("Symbol change error:", error);
    // Returning false rejects the change
    // Throwing an error triggers fallback to direct change
    return false;
  }
};
```

## Migration Guide

### For Existing Implementations

No changes required! The new callback is optional and existing code continues to work.

### To Enable Symbol Change Control

1. Add the `onSymbolChangeRequest` callback to your `ChartProOptions`
2. Implement your validation and state management logic
3. Return `true` to allow changes, `false` to reject them

### Example Migration

**Before:**

```typescript
const chart = new KLineChartPro({
  container: "chart-container",
  symbol: mySymbol,
  // ... other options
});

// Symbol changes happened automatically
```

**After:**

```typescript
const chart = new KLineChartPro({
  container: "chart-container",
  symbol: mySymbol,
  // ... other options

  // Now you control symbol changes
  onSymbolChangeRequest: async (symbol, source) => {
    // Your custom logic
    await myApp.handleSymbolChange(symbol, source);
    return true;
  },
});
```

## Best Practices

1. **Keep callbacks fast**: The 300ms debounce helps, but avoid long-running operations
2. **Handle errors gracefully**: Always wrap your logic in try-catch blocks
3. **Validate inputs**: Check symbol data before processing
4. **Log for debugging**: Include source information in your logs
5. **Update app state**: Coordinate with your main application's state management

## Troubleshooting

### Symbols not changing

- Check that your callback returns `true`
- Verify no errors are thrown in the callback
- Check browser console for error messages

### Rapid switching still occurring

- Ensure you're using the callback mechanism
- Check that your callback doesn't have race conditions
- Verify the debouncing is working (should see 300ms delays)

### TypeScript errors

- Import the new types: `SymbolChangeRequestCallback`, `SymbolChangeSource`
- Ensure your callback matches the expected signature
- Check that your `ChartProOptions` includes the optional callback

## Performance Considerations

- The debouncing mechanism prevents excessive API calls
- Callback execution is asynchronous and non-blocking
- Failed callbacks fall back gracefully without breaking the chart
- Memory cleanup is handled automatically on component unmount

## Browser Compatibility

This feature works in all modern browsers that support:

- Promises/async-await
- setTimeout/clearTimeout
- ES6+ features

The same compatibility as the base charting library.
