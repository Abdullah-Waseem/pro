// File: ohlcStroke.jsx
export default () => (
  <svg
    class="icon-ohlc-stroke"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 28 52.325"
    width="14"
    height="52.325"
  >
    {/* Up-day OHLC bar (green) */}
    <line
      x1="7"
      y1="5"
      x2="7"
      y2="47"
      stroke="#4ae351"
      stroke-width="5"
      stroke-linecap="round"
    />
    {/* Open tick (left) */}
    <line
      x1="7"
      y1="18"
      x2="0"
      y2="18"
      stroke="#4ae351"
      stroke-width="5"
      stroke-linecap="round"
    />
    {/* Close tick (right) */}
    <line
      x1="7"
      y1="34"
      x2="13"
      y2="34"
      stroke="#4ae351"
      stroke-width="5"
      stroke-linecap="round"
    />

    {/* Down-day OHLC bar (red) */}
    <line
      x1="21"
      y1="5"
      x2="21"
      y2="47"
      stroke="#ff2a2a"
      stroke-width="5"
      stroke-linecap="round"
    />
    {/* Open tick (left) */}
    <line
      x1="21"
      y1="18"
      x2="14"
      y2="18"
      stroke="#ff2a2a"
      stroke-width="5"
      stroke-linecap="round"
    />
    {/* Close tick (right) */}
    <line
      x1="21"
      y1="34"
      x2="28"
      y2="34"
      stroke="#ff2a2a"
      stroke-width="5"
      stroke-linecap="round"
    />
  </svg>
);
