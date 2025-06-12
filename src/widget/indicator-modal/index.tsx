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

import { Component, createMemo } from "solid-js";

import { Modal, List, Checkbox } from "../../component";

import i18n from "../../i18n";

type OnIndicatorChange = (params: {
  name: string;
  paneId: string;
  added: boolean;
}) => void;

export interface IndicatorModalProps {
  locale: string;
  mainIndicators: string[];
  subIndicators: object;
  onMainIndicatorChange: OnIndicatorChange;
  onSubIndicatorChange: OnIndicatorChange;
  onClose: () => void;
}

const IndicatorModal: Component<IndicatorModalProps> = (props) => {
  return (
    <Modal
      title={i18n("indicator", props.locale)}
      width={400}
      onClose={props.onClose}
    >
      <List class="klinecharts-pro-indicator-modal-list">
        <li class="title">Main Indicators</li>
        {["MA", "EMA", "BOLL", "SAR", "BBI"].map((name) => {
          const alreadyAdded = props.mainIndicators.includes(name);
          return (
            <li
              class={`row ${alreadyAdded ? "added" : ""}`}
              onClick={() => {
                props.onMainIndicatorChange({
                  name,
                  paneId: "candle_pane",
                  added: true, // Always add
                });
              }}
            >
              <span class="indicator-button">
                {i18n(name.toLowerCase(), props.locale)}
              </span>
            </li>
          );
        })}
        <li class="title">Sub Indicators</li>
        {[
          "VOL",
          "MACD",
          "KDJ",
          "RSI",
          "BIAS",
          "BRAR",
          "CCI",
          "DMI",
          "CR",
          "PSY",
          "DMA",
          "TRIX",
          "OBV",
          "VR",
          "WR",
          "MTM",
          "EMV",
          "ROC",
          "PVT",
          "AO",
        ].map((name) => {
          const alreadyAdded = name in props.subIndicators;
          return (
            <li
              class={`row ${alreadyAdded ? "added" : ""}`}
              onClick={() => {
                props.onSubIndicatorChange({
                  name,
                  paneId: "", // Let onSubIndicatorChange handle paneId assignment
                  added: true, // Always add
                });
              }}
            >
              <span class="indicator-button">
                {i18n(name.toLowerCase(), props.locale)}
              </span>
            </li>
          );
        })}
      </List>
    </Modal>
  );
};

export default IndicatorModal;
