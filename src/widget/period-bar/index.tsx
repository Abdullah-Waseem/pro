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

import {
  Component,
  Show,
  createSignal,
  onCleanup,
  createMemo,
  createResource,
  createEffect,
} from "solid-js";

import {
  SymbolInfo,
  Period,
  Datafeed,
  AccountToggleCallback,
} from "../../types";
import lodashSet from "lodash/set";

import i18n from "../../i18n";
import { Select, SelectDataSourceItem, Switch } from "../../component";
import { getCandleTypes } from "../setting-modal/data";
import { DeepPartial, Styles, utils } from "klinecharts";
import set from "lodash/set";
import { getSymbolFlags } from "../../utils/symbolIcons";
import SymbolFlag from "../../component/symbol-flag";

export interface PeriodBarProps {
  locale: string;
  spread: boolean;
  symbol: SymbolInfo;
  datafeed: Datafeed;
  lastKnownSymbolPrice?: number;
  period: Period;
  periods: Period[];
  currentStyles: DeepPartial<Styles>;
  onSymbolSelected: (symbol: SymbolInfo) => void;
  onChartStyleChange: (style: DeepPartial<Styles>) => void;
  onMenuClick: () => void;
  onSymbolClick: () => void;
  onPeriodChange: (period: Period) => void;
  onIndicatorClick: () => void;
  onTimezoneClick: () => void;
  onSettingClick: () => void;
  favoriteUpdateCount: number;
  loadingVisible: boolean;
  selectedAccount?: "real" | "demo";
  onAccountToggle?: AccountToggleCallback;
}

const PeriodBar: Component<PeriodBarProps> = (props) => {
  const candleOption = createMemo(() => getCandleTypes(props.locale));
  const [styles, setStyles] = createSignal(props.currentStyles);
  const [clickDisabled, setClickDisabled] = createSignal(false);

  const [symbolsList, { refetch }] = createResource(() =>
    props.datafeed.searchSymbols()
  );
  const [localFavoriteSymbols, setLocalFavoriteSymbols] = createSignal<
    SymbolInfo[]
  >([]);
  const [payout, setPayout] = createSignal(72);
  const [isFavorite, setIsFavorite] = createSignal<boolean>(
    props.symbol?.isFavorite ?? false
  );
  const [activeSymbolKey, setActiveSymbolKey] = createSignal<string>("");
  const [accountMode, setAccountMode] = createSignal<"real" | "demo">(
    props.selectedAccount ?? "demo"
  );

  const payoutText = createMemo(() => {
    const value = props.symbol?.payout;
    if (value == null || !Number.isFinite(value)) {
      return null;
    }
    const hasFraction = Math.abs(value - Math.trunc(value)) > Number.EPSILON;
    const digits = hasFraction ? 2 : 0;
    return `${value.toFixed(digits)}%`;
  });

  const update = (option: SelectDataSourceItem, newValue: any) => {
    const style: Record<string, unknown> = {};
    lodashSet(style, option.key, newValue);
    const ss = utils.clone(styles());
    lodashSet(ss, option.key, newValue);
    setStyles(ss);
    props.onChartStyleChange(style);
  };

  const mapCandleToIcon = (candleType: string) =>
    candleOption().dataSource.find((d) => d.key === candleType)?.icon;

  createEffect(() => {
    const list = symbolsList();
    if (!list) return;
    setLocalFavoriteSymbols(list.filter((symbol) => symbol.isFavorite));
    setPayout(
      list.find((symbol) => symbol.ticker === props.symbol?.ticker)?.payout ?? 0
    );
  });

  createEffect(() => {
    const symbol = props.symbol;
    const key = symbol?._id ?? symbol?.ticker ?? "";
    if (key !== activeSymbolKey()) {
      setActiveSymbolKey(key);
      setIsFavorite(symbol?.isFavorite ?? false);
    }
  });

  createEffect(() => {
    setStyles(props.currentStyles);
  });

  createEffect(() => {
    props.favoriteUpdateCount;
    refetch();
  });

  createEffect(() => {
    if (props.loadingVisible) {
      setClickDisabled(true);
      const timer = window.setTimeout(() => {
        setClickDisabled(false);
      }, 1700);
      onCleanup(() => window.clearTimeout(timer));
    } else {
      setClickDisabled(false);
    }
  });

  createEffect(() => {
    if (props.selectedAccount) {
      setAccountMode(props.selectedAccount);
    }
  }, []);

  const handleToggleFavorite = async () => {
    if (
      !props.symbol ||
      !props.datafeed.addOrRemoveFavorite ||
      clickDisabled()
    ) {
      return;
    }
    const ok = await props.datafeed.addOrRemoveFavorite(props.symbol);
    if (!ok) {
      return;
    }
    const next = !isFavorite();
    setIsFavorite(next);
    setLocalFavoriteSymbols((current) => {
      const list = current ?? [];
      const key = props.symbol?._id ?? props.symbol?.ticker ?? "";
      if (!key) {
        return list;
      }
      const filtered = list.filter((item) => (item._id ?? item.ticker) !== key);
      return next ? [props.symbol!, ...filtered] : filtered;
    });
    refetch();
  };

  const handleAccountToggle = () => {
    const next = accountMode() === "demo" ? "real" : "demo";
    const newAccountMode = props.onAccountToggle?.();
    setAccountMode(newAccountMode ?? next);
  };

  const removeFavorite = async (target: SymbolInfo) => {
    if (!props.datafeed.addOrRemoveFavorite) {
      return;
    }
    const ok = await props.datafeed.addOrRemoveFavorite(target);
    if (!ok) {
      return;
    }
    setLocalFavoriteSymbols((list) =>
      list.filter(
        (item) => (item._id ?? item.ticker) !== (target._id ?? target.ticker)
      )
    );
    const currentKey = props.symbol?._id ?? props.symbol?.ticker ?? "";
    if ((target._id ?? target.ticker) === currentKey) {
      setIsFavorite(false);
    }
    refetch();
  };

  const showSymbol = (symbol: string) => {
    return symbol.replace("-", "");
  };
  return (
    <div class="klinecharts-pro-period-bar">
      <div class="period-bar-shell">
        <div class="left-section">
          <button
            type="button"
            class="icon-button menu-toggle"
            aria-label="Toggle tools menu"
            disabled={clickDisabled() || !props.onMenuClick}
            onClick={() => {
              if (clickDisabled()) return;
              props.onMenuClick();
            }}
          >
            <svg
              viewBox="0 0 1024 1024"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
            >
              <path d="M880.3 184.3l-40.6-40.6c-24.9-24.9-65.3-24.9-90.2 0L322.7 570.5c-4.2 4.2-7.4 9.3-9.3 15L236.3 777c-4.4 13.4 8.1 25.9 21.5 21.5l191.5-77c5.6-1.9 10.7-5.1 15-9.3l426.8-426.8c24.8-24.9 24.8-65.3 0-90.2zM396.3 682.6L341.4 659l22.2-66.7 275.5-275.5 65.3 65.3-275.5 275.5zm308.6-308.6l-65.3-65.3 52.4-52.4 65.3 65.3-52.4 52.4z" />
            </svg>
          </button>
          {/* <button
            type="button"
            class={`icon-button favorite-toggle ${
              isFavorite() ? "active" : ""
            }`}
            aria-pressed={isFavorite()}
            aria-label="Toggle favorite"
            disabled={!props.symbol || clickDisabled()}
            onClick={handleToggleFavorite}
          >
            <StarIcon />
          </button> */}
          <Show when={props.symbol}>
            <button
              type="button"
              class={`pill symbol ${clickDisabled() ? "disabled" : ""}`}
              onClick={() => {
                if (clickDisabled()) return;
                props.onSymbolClick();
              }}
            >
              <SymbolFlag
                class="favorite-flag"
                ticker={
                  props.symbol?.shortName ??
                  props.symbol?.name ??
                  props.symbol?.ticker
                }
              />
              <span class="symbol-name">
                {showSymbol(
                  props.symbol?.shortName ??
                    props.symbol?.name ??
                    props.symbol?.ticker
                )}
                <span class="symbol-payout"> {payout()}%</span>
              </span>
            </button>
          </Show>
          <Select
            class={` period-select ${clickDisabled() ? "disabled" : ""}`}
            value={props.period.text}
            valueKey="key"
            dataSource={props.periods.map((p) => ({
              key: p.text,
              text: p.text,
            }))}
            onSelected={(data) => {
              const key = (data as SelectDataSourceItem).key;
              const selectedPeriod = props.periods.find((p) => p.text === key);
              if (selectedPeriod) {
                props.onPeriodChange(selectedPeriod);
              }
            }}
          />
          <Select
            class={` candle-select ${clickDisabled() ? "disabled" : ""}`}
            value={mapCandleToIcon(
              (styles() as Styles)?.candle?.type || "candle_solid"
            )}
            text="Unit"
            dataSource={candleOption().dataSource}
            onSelected={(data) => {
              const option = data as SelectDataSourceItem;
              localStorage.setItem("candleType", option.key);
              update(candleOption(), option.key);
            }}
          />
          <button
            type="button"
            class="pill nav-action"
            disabled={clickDisabled()}
            onClick={props.onIndicatorClick}
          >
            <IndicatorIcon />
            {/* <span>{i18n("indicator", props.locale)}</span> */}
          </button>
          <button
            type="button"
            class="pill nav-action"
            disabled={clickDisabled()}
            onClick={props.onTimezoneClick}
          >
            {/* <GlobeIcon /> */}
            {/* <span>{i18n("timezone", props.locale)}</span> */}
          </button>
          <Show when={(localFavoriteSymbols()?.length ?? 0) > 0}>
            <div class="favorite-symbols">
              <div class="symbol-list">
                {localFavoriteSymbols()?.map((symbol) => {
                  const key = symbol._id ?? symbol.ticker;
                  const isActive =
                    key === (props.symbol?._id ?? props.symbol?.ticker);
                  return (
                    <div
                      class={`pill symbol ${
                        clickDisabled() ? "disabled" : ""
                      } ${isActive ? "current" : ""}`}
                      title={symbol.shortName ?? symbol.name ?? symbol.ticker}
                      onClick={() => {
                        if (clickDisabled()) return;
                        props.onSymbolSelected(symbol);
                      }}
                    >
                      <SymbolFlag
                        class={`favorite-flag ${isActive ? "active" : ""}`}
                        ticker={
                          symbol.shortName ?? symbol.name ?? symbol.ticker
                        }
                      />
                      <div class="symbol-text">
                        <span class="symbol-name">
                          {(
                            symbol.shortName ??
                            symbol.name ??
                            symbol.ticker
                          ).replace("-", "")}
                        </span>
                        <span class="symbol-payout">{symbol.payout}%</span>
                      </div>
                      <button
                        type="button"
                        class="symbol-remove"
                        title="Remove favorite"
                        aria-label="Remove favorite"
                        disabled={clickDisabled()}
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (clickDisabled()) return;
                          await removeFavorite(symbol);
                        }}
                      >
                        <span aria-hidden="true">✖</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </Show>
        </div>

        {/* <div class="right-section"> */}
        {/* <Show when={payout() >= 0} keyed>
            {() => (
              <div class="pill payout">
                <span>{`Payout: ${payout()} %`}</span>
              </div>
            )}
          </Show> */}
        {/* <div class="demo-mode-control">
            <span>Demo Mode</span>
            <Switch
              class={`demo-switch ${accountMode()}`}
              open={accountMode() === "demo"}
              onChange={handleAccountToggle}
            />
          </div> */}
        {/* </div> */}
      </div>
    </div>
  );
};

export default PeriodBar;

const StarIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path
      d="M12 2l2.83 5.74 6.34.92-4.58 4.46 1.08 6.34L12 16.9 6.33 19.5l1.08-6.34L2.83 8.66l6.34-.92L12 2z"
      fill="currentColor"
    />
  </svg>
);

const IndicatorIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M11.3333 2.66671C11.1565 2.66671 10.987 2.59647 10.8619 2.47145C10.7369 2.34642 10.6667 2.17685 10.6667 2.00004C10.6667 1.82323 10.7369 1.65366 10.8619 1.52864C10.987 1.40361 11.1565 1.33337 11.3333 1.33337H14C14.1768 1.33337 14.3464 1.40361 14.4714 1.52864C14.5964 1.65366 14.6667 1.82323 14.6667 2.00004V4.66671C14.6667 4.84352 14.5964 5.01309 14.4714 5.13811C14.3464 5.26314 14.1768 5.33337 14 5.33337C13.8232 5.33337 13.6536 5.26314 13.5286 5.13811C13.4036 5.01309 13.3333 4.84352 13.3333 4.66671V3.60937L9.47133 7.47137C9.34631 7.59635 9.17678 7.66656 9 7.66656C8.82322 7.66656 8.65369 7.59635 8.52867 7.47137L6.66667 5.60937L3.138 9.13804C3.01227 9.25948 2.84386 9.32667 2.66907 9.32516C2.49427 9.32364 2.32706 9.25352 2.20345 9.12992C2.07985 9.00631 2.00974 8.83911 2.00822 8.66431C2.0067 8.48951 2.07389 8.32111 2.19533 8.19537L6.19533 4.19537C6.32035 4.07039 6.48989 4.00018 6.66667 4.00018C6.84344 4.00018 7.01298 4.07039 7.138 4.19537L9 6.05737L12.3907 2.66671H11.3333ZM3.33333 12V14C3.33333 14.1769 3.2631 14.3464 3.13807 14.4714C3.01305 14.5965 2.84348 14.6667 2.66667 14.6667C2.48986 14.6667 2.32029 14.5965 2.19526 14.4714C2.07024 14.3464 2 14.1769 2 14V12C2 11.8232 2.07024 11.6537 2.19526 11.5286C2.32029 11.4036 2.48986 11.3334 2.66667 11.3334C2.84348 11.3334 3.01305 11.4036 3.13807 11.5286C3.2631 11.6537 3.33333 11.8232 3.33333 12ZM6.66667 9.33337C6.66667 9.15656 6.59643 8.98699 6.4714 8.86197C6.34638 8.73695 6.17681 8.66671 6 8.66671C5.82319 8.66671 5.65362 8.73695 5.5286 8.86197C5.40357 8.98699 5.33333 9.15656 5.33333 9.33337V14C5.33333 14.1769 5.40357 14.3464 5.5286 14.4714C5.65362 14.5965 5.82319 14.6667 6 14.6667C6.17681 14.6667 6.34638 14.5965 6.4714 14.4714C6.59643 14.3464 6.66667 14.1769 6.66667 14V9.33337ZM9.33333 10C9.51014 10 9.67971 10.0703 9.80474 10.1953C9.92976 10.3203 10 10.4899 10 10.6667V14C10 14.1769 9.92976 14.3464 9.80474 14.4714C9.67971 14.5965 9.51014 14.6667 9.33333 14.6667C9.15652 14.6667 8.98695 14.5965 8.86193 14.4714C8.73691 14.3464 8.66667 14.1769 8.66667 14V10.6667C8.66667 10.4899 8.73691 10.3203 8.86193 10.1953C8.98695 10.0703 9.15652 10 9.33333 10ZM13.3333 7.33337C13.3333 7.15656 13.2631 6.98699 13.1381 6.86197C13.013 6.73695 12.8435 6.66671 12.6667 6.66671C12.4899 6.66671 12.3203 6.73695 12.1953 6.86197C12.0702 6.98699 12 7.15656 12 7.33337V14C12 14.1769 12.0702 14.3464 12.1953 14.4714C12.3203 14.5965 12.4899 14.6667 12.6667 14.6667C12.8435 14.6667 13.013 14.5965 13.1381 14.4714C13.2631 14.3464 13.3333 14.1769 13.3333 14V7.33337Z"
      fill="white"
    />
  </svg>
);

const GlobeIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M1.6 7.00012H18.4M1.6 13.0001H18.4M1 10.0001C1 11.182 1.23279 12.3523 1.68508 13.4443C2.13738 14.5362 2.80031 15.5284 3.63604 16.3641C4.47177 17.1998 5.46392 17.8627 6.55585 18.315C7.64778 18.7673 8.8181 19.0001 10 19.0001C11.1819 19.0001 12.3522 18.7673 13.4442 18.315C14.5361 17.8627 15.5282 17.1998 16.364 16.3641C17.1997 15.5284 17.8626 14.5362 18.3149 13.4443C18.7672 12.3523 19 11.182 19 10.0001C19 7.61317 18.0518 5.32399 16.364 3.63616C14.6761 1.94833 12.3869 1.00012 10 1.00012C7.61305 1.00012 5.32387 1.94833 3.63604 3.63616C1.94821 5.32399 1 7.61317 1 10.0001Z"
      stroke="#C2C2C2"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <path
      d="M9.50016 1.00012C7.8155 3.69973 6.92236 6.81799 6.92236 10.0001C6.92236 13.1823 7.8155 16.3005 9.50016 19.0001M10.5002 1.00012C12.1848 3.69973 13.078 6.81799 13.078 10.0001C13.078 13.1823 12.1848 16.3005 10.5002 19.0001"
      stroke="#C2C2C2"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
);

const MenuIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path
      d="M4 6h16M4 12h16M4 18h10"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    />
  </svg>
);
