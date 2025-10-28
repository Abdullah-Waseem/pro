export const currencyToCountry: Record<string, string> = {
  USD: "US",
  EUR: "EU",
  GBP: "GB",
  JPY: "JP",
  CAD: "CA",
  AUD: "AU",
  NZD: "NZ",
  CHF: "CH",
  CNY: "CN",
  HKD: "HK",
  SGD: "SG",
  SEK: "SE",
  NOK: "NO",
  DKK: "DK",
  INR: "IN",
  PKR: "PK",
  RUB: "RU",
  ZAR: "ZA",
  ARS: "AR",
  BRL: "BR",
  MXN: "MX",
  TRY: "TR",
  SAR: "SA",
  AED: "AE",
  // Crypto
  BTC: "BTC",
  ETH: "ETH",
  LTC: "LTC",
  XRP: "XRP",
};

export const cryptoSymbolList = [
  "XAU",
  "XAG",
  "BTC",
  "ETH",
  "LTC",
  "XRP",
  "BCH",
  "BNB",
  "USDT",
  "USDC",
  "DOGE",
  "DOT",
  "ADA",
  "XLM",
  "XMR",
  "EOS",
  "TRX",
  "LINK",
  "UNI",
  "AAVE",
  "COMP",
  "MKR",
  "BAT",
  "ZEC",
  "XTZ",
  "ALGO",
  "ATOM",
  "NEO",
  "VET",
  "THETA",
  "KSM",
  "DOT",
];
export const getSymbolFlags = (symbol: string) => {
  const [base, quote] = symbol.split("-");
  const baseCountry = currencyToCountry[base];
  const quoteCountry = currencyToCountry[quote];
  const baseFlag =
    baseCountry && !cryptoSymbolList.includes(baseCountry)
      ? `https://flagcdn.com/h24/${baseCountry?.toLowerCase()}.png`
      : `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${baseCountry?.toLowerCase()}.png`;

  const quoteFlag =
    quoteCountry && !cryptoSymbolList.includes(quoteCountry)
      ? `https://flagcdn.com/h24/${quoteCountry?.toLowerCase()}.png`
      : `https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/${quoteCountry?.toLowerCase()}.png`;
  console.log(
    "baseCountry",
    baseCountry,
    "quoteCountry",
    quoteCountry,
    "baseFlag",
    baseFlag,
    "quoteFlag",
    quoteFlag
  );
  return { baseFlag, quoteFlag };
};
