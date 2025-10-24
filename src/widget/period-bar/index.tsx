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
    setLocalFavoriteSymbols(
      list.filter((symbol) => symbol.isFavorite).splice(0, 2)
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
              <span class="symbol-name">
                {props.symbol?.shortName ??
                  props.symbol?.name ??
                  props.symbol?.ticker}
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
            <span>{i18n("indicator", props.locale)}</span>
          </button>
          <button
            type="button"
            class="pill nav-action"
            disabled={clickDisabled()}
            onClick={props.onTimezoneClick}
          >
            <GlobeIcon />
            <span>{i18n("timezone", props.locale)}</span>
          </button>
        </div>
        <Show when={(localFavoriteSymbols()?.length ?? 0) > 0}>
          <div class="favorite-symbols">
            <div class="symbol-list">
              {localFavoriteSymbols()?.map((symbol) => {
                const key = symbol._id ?? symbol.ticker;
                const isActive =
                  key === (props.symbol?._id ?? props.symbol?.ticker);
                return (
                  <div
                    class={`symbol-item ${clickDisabled() ? "disabled" : ""} ${
                      isActive ? "current" : ""
                    }`}
                    title={symbol.shortName ?? symbol.name ?? symbol.ticker}
                    onClick={() => {
                      if (clickDisabled()) return;
                      props.onSymbolSelected(symbol);
                    }}
                  >
                    <span class={`favorite-flag ${isActive ? "active" : ""}`}>
                      <StarIcon />
                    </span>
                    <span class="symbol-text">
                      {symbol.shortName ?? symbol.name ?? symbol.ticker}
                    </span>
                    <button
                      type="button"
                      class="remove"
                      disabled={clickDisabled()}
                      onClick={async (e) => {
                        e.stopPropagation();
                        await removeFavorite(symbol);
                      }}
                    >
                      x
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </Show>
        <div class="right-section">
          <Show when={payoutText()} keyed>
            {(text: string) => (
              <div class="pill payout">
                <span>{`Payout: ${text}`}</span>
              </div>
            )}
          </Show>
          <div class="demo-mode-control">
            <span>Demo Mode</span>
            <Switch
              class={`demo-switch ${accountMode()}`}
              open={accountMode() === "demo"}
              onChange={handleAccountToggle}
            />
          </div>
        </div>
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
  <svg class="icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
    <path
      d="M4 16l5-5 4 4 7-7"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <circle cx="4" cy="16" r="1.5" fill="currentColor" />
    <circle cx="9" cy="11" r="1.5" fill="currentColor" />
    <circle cx="13" cy="15" r="1.5" fill="currentColor" />
    <circle cx="20" cy="8" r="1.5" fill="currentColor" />
  </svg>
);

const GlobeIcon = () => (
  <svg class="icon" viewBox="0 0 24 24" role="img" aria-hidden="true">
    <circle
      cx="12"
      cy="12"
      r="8.5"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
    />
    <path
      d="M3.5 12h17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M12 3.5c3.2 3.3 3.2 13.7 0 17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <path
      d="M12 3.5c-3.2 3.3-3.2 13.7 0 17"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
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
