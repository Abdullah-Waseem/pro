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
  calcParams?: number[];
  styles?: object;
}) => void;

export interface IndicatorModalProps {
  locale: string;
  mainIndicators: string[];
  subIndicators: object;
  onMainIndicatorChange: OnIndicatorChange;
  onSubIndicatorChange: OnIndicatorChange;
  onClose: () => void;
}
// Sub Indicators with Calc Params
const subIndicators = [
  {
    name: "VOL",
    calcParams: [],
  },
  {
    name: "MACD",
    calcParams: [12, 26, 9],
  },
  {
    name: "KDJ",
    calcParams: [9, 3, 3],
  },
  {
    name: "RSI",
    calcParams: [14, 6, 12, 24, 30],
  },
  {
    name: "BIAS",
    calcParams: [6, 12, 24],
  },
  {
    name: "BRAR",
    calcParams: [26],
  },
  {
    name: "CCI",
    calcParams: [14],
  },
  {
    name: "DMI",
    calcParams: [14, 6],
  },
  {
    name: "CR",
    calcParams: [26, 10, 20, 40, 60],
  },
  {
    name: "PSY",
    calcParams: [12, 6],
  },
  {
    name: "DMA",
    calcParams: [10, 50, 10],
  },
  {
    name: "TRIX",
    calcParams: [12, 7],
  },
  {
    name: "OBV",
    calcParams: [30],
  },
  {
    name: "VR",
    calcParams: [26, 6],
  },
  {
    name: "WR",
    calcParams: [10, 6, 12, 24, 30],
  },
  {
    name: "MTM",
    calcParams: [12, 6],
  },
  {
    name: "EMV",
    calcParams: [14, 9],
  },
  {
    name: "ROC",
    calcParams: [12, 6],
  },
  {
    name: "PVT",
    calcParams: [],
  },
  {
    name: "AO",
    calcParams: [5, 34],
  },
];

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
        {subIndicators.map((subInd) => {
          const alreadyAdded = subInd.name in props.subIndicators;
          return (
            <li
              class={`row ${alreadyAdded ? "added" : ""}`}
              onClick={() => {
                props.onSubIndicatorChange({
                  name: subInd.name,
                  paneId: "", // Let onSubIndicatorChange handle paneId assignment
                  added: true, // Always add
                  calcParams: subInd.calcParams,
                });
              }}
            >
              <span class="indicator-button">
                {i18n(subInd.name.toLowerCase(), props.locale)}
              </span>
            </li>
          );
        })}
      </List>
    </Modal>
  );
};

export default IndicatorModal;
