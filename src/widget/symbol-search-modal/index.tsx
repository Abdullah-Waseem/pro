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
  createSignal,
  createResource,
  Show,
  createEffect,
} from "solid-js";

import { Modal, List, Input, Tabs } from "../../component";
import { TabItem } from "../../component/tabs";

import i18n from "../../i18n";

import { SymbolInfo, Datafeed, SymbolChangeSource } from "../../types";

export interface SymbolSearchModalProps {
  locale: string;
  datafeed: Datafeed;
  onSymbolSelected: (symbol: SymbolInfo) => void;
  onClose: () => void;
  onFavoriteChange: () => void;
  onSymbolChangeRequest?: (
    symbol: SymbolInfo,
    source: SymbolChangeSource
  ) => Promise<void>;
}

const SymbolSearchModal: Component<SymbolSearchModalProps> = (props) => {
  const [value, setValue] = createSignal("");
  const [category, setCategory] = createSignal("all");
  const [symbolList, { refetch }] = createResource(
    value,
    props.datafeed.searchSymbols.bind(props.datafeed)
  );
  const [localSymbols, setLocalSymbols] = createSignal<SymbolInfo[]>([]);

  // Category tabs configuration
  const categoryTabs: TabItem[] = [
    {
      key: "all",
      label: "All",
    },
    {
      key: "forex",
      label: "Forex",
    },
    {
      key: "crypto",
      label: "Crypto",
    },
  ];

  // whenever the resource loads, sync it into the store
  createEffect(() => {
    const data = symbolList();
    if (data) {
      if (category() === "all") {
        setLocalSymbols(data);
        return;
      }
      setLocalSymbols(data.filter((s) => s.market === category()));
    }
  });

  const handleCategoryChange = (activeKey: string) => {
    setCategory(activeKey);
    refetch();
  };

  return (
    <Modal
      title={i18n("symbol_search", props.locale)}
      width={460}
      onClose={props.onClose}
    >
      <Input
        class="klinecharts-pro-symbol-search-modal-input"
        placeholder={i18n("symbol_code", props.locale)}
        suffix={
          <svg viewBox="0 0 1024 1024">
            <path d="M945.066667 898.133333l-189.866667-189.866666c55.466667-64 87.466667-149.333333 87.466667-241.066667 0-204.8-168.533333-373.333333-373.333334-373.333333S96 264.533333 96 469.333333 264.533333 842.666667 469.333333 842.666667c91.733333 0 174.933333-34.133333 241.066667-87.466667l189.866667 189.866667c6.4 6.4 14.933333 8.533333 23.466666 8.533333s17.066667-2.133333 23.466667-8.533333c8.533333-12.8 8.533333-34.133333-2.133333-46.933334zM469.333333 778.666667C298.666667 778.666667 160 640 160 469.333333S298.666667 160 469.333333 160 778.666667 298.666667 778.666667 469.333333 640 778.666667 469.333333 778.666667z" />
          </svg>
        }
        value={value()}
        onChange={(v) => {
          const va = `${v}`;
          setValue(va);
        }}
      />

      <Tabs
        class="klinecharts-pro-symbol-search-modal-tabs"
        items={categoryTabs}
        defaultActiveKey="all"
        onChange={handleCategoryChange}
      />

      <List
        class="klinecharts-pro-symbol-search-modal-list"
        loading={symbolList.loading}
        dataSource={localSymbols() ?? []}
        renderItem={(symbol: SymbolInfo) => (
          <li
            class="symbol-item"
            onClick={async () => {
              if (props.onSymbolChangeRequest) {
                await props.onSymbolChangeRequest(symbol, "modal");
              } else {
                // Fallback to direct symbol selection for backward compatibility
                props.onSymbolSelected(symbol);
              }
              props.onClose();
            }}
          >
            <div class="symbol-info">
              {/* Left: star + ticker */}
              <div class="symbol-left">
                <div
                  class="star"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (props.datafeed.addOrRemoveFavorite) {
                      const ok = await props.datafeed.addOrRemoveFavorite(
                        symbol
                      );
                      if (!ok) return;
                      // flip locally
                      setLocalSymbols(
                        localSymbols()
                          .map((s) =>
                            s._id === symbol._id
                              ? { ...s, isFavorite: !s.isFavorite }
                              : s
                          )
                          .sort(
                            (a, b) =>
                              (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0)
                          )
                      );
                      props.onFavoriteChange();
                      console.log("Props onFavoriteChange");
                    }
                  }}
                >
                  <svg
                    viewBox="0 0 1024 1024"
                    width="16"
                    height="16"
                    fill={symbol.isFavorite ? "#f5c518" : "none"}
                    stroke="#f5c518"
                    stroke-width="48"
                  >
                    <path d="M908.1 353.1l-267-38.8L512 64 382.9 314.3l-267 38.8L234 602.5l-45.6 266.1L512 728.4l239.6 140.2L706 602.5l169.6-249.4z" />
                  </svg>
                </div>
                <span class="symbol-shortname" title={symbol.name ?? ""}>
                  {symbol.shortName ?? symbol.ticker}
                </span>
              </div>

              {/* Center: payout */}
              <div class="symbol-payout">
                {symbol.payout != null ? `${symbol.payout}%` : ""}
              </div>

              {/* Right: full name */}
              <div class="symbol-name">
                {symbol.name ? `(${symbol.name})` : ""}
              </div>
            </div>
          </li>
        )}
      ></List>
    </Modal>
  );
};

export default SymbolSearchModal;
