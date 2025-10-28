/**
 * Reusable SymbolFlag component
 */
import { Component } from "solid-js";
import "./index.less";
import { getSymbolFlags } from "../../utils/symbolIcons";

export interface SymbolFlagProps {
  /** ticker string like "EUR-USD" or full symbol; used to derive flags if base/quote not provided */
  ticker?: string;
  baseFlag?: string;
  quoteFlag?: string;
  class?: string;
  alt?: string;
  baseFlagClass?: string;
  quoteFlagClass?: string;
}

const SymbolFlag: Component<SymbolFlagProps> = (props) => {
  let base = props.baseFlag;
  let quote = props.quoteFlag;
  if ((!base || !quote) && props.ticker) {
    try {
      const flags = getSymbolFlags(props.ticker);
      base = base ?? flags.baseFlag;
      quote = quote ?? flags.quoteFlag;
    } catch (e) {
      // keep undefined if symbol parsing fails
    }
  }

  return (
    <span class={`klinecharts-pro-symbol-flag ${props.class ?? ""}`}>
      <div class="flag-stack" aria-hidden="true">
        <img
          src={base}
          class={`flag-base ${props.baseFlagClass ?? ""}`}
          alt={props.alt ?? ""}
        />
        <img
          src={quote}
          class={`flag-quote ${props.quoteFlagClass ?? ""}`}
          alt={props.alt ?? ""}
        />
      </div>
    </span>
  );
};

export default SymbolFlag;
