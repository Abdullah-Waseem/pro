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

import { Component, createSignal } from "solid-js";

import { utils } from "klinecharts";

import { Modal, Input } from "../../component";

import i18n from "../../i18n";

import data from "./data";
type onConfirmParams = {
  calcParams: any;
  styles: object;
};
export interface IndicatorSettingModalProps {
  locale: string;
  params: {
    indicatorName: string;
    paneId: string;
    calcParams: any[];
    styles: { lines: { color: string }[] };
  };
  onClose: () => void;
  onConfirm: (params: onConfirmParams) => void;
}

const IndicatorSettingModal: Component<IndicatorSettingModalProps> = (
  props
) => {
  const [calcParams, setCalcParams] = createSignal(
    utils.clone(props.params.calcParams)
  );
  const [styles, setStyles] = createSignal(props.params.styles);

  const getConfig: (name: string) => any[] = (name: string) => {
    // @ts-expect-error
    return data[name];
  };

  return (
    <Modal
      title={props.params.indicatorName}
      width={360}
      buttons={[
        {
          type: "confirm",
          children: i18n("confirm", props.locale),
          onClick: () => {
            const config = getConfig(props.params.indicatorName);
            const params: onConfirmParams = {
              calcParams: [],
              styles: {},
            };
            utils.clone(calcParams()).forEach((param: any, i: number) => {
              if (!utils.isValid(param) || param === "") {
                if ("default" in config[i]) {
                  params.calcParams.push(config[i]["default"]);
                }
              } else {
                params.calcParams.push(param);
              }
            });
            params.styles = styles();
            props.onConfirm(params);
            props.onClose();
          },
        },
      ]}
      onClose={props.onClose}
    >
      <div class="klinecharts-pro-indicator-setting-modal-content">
        {getConfig(props.params.indicatorName).map((d, i) => {
          console.log("Indicator settings", d, i);
          console.log("Indicator settings", styles().lines[i]);
          return (
            <>
              <input
                type="color"
                value={styles().lines[i].color}
                onChange={(e: any) => {
                  console.log("Indicator settings", e.target.value);
                  const newStyles = utils.clone(styles());
                  newStyles.lines[i].color = String(e.target.value);
                  setStyles(newStyles);
                }}
              />
              <span>{i18n(d.paramNameKey, props.locale)}</span>
              <Input
                style={{ width: "100px" }}
                value={calcParams()[i] ?? ""}
                precision={d.precision}
                min={d.min}
                onChange={(value) => {
                  const params = utils.clone(calcParams());
                  params[i] = value;
                  setCalcParams(params);
                }}
              />
            </>
          );
        })}
      </div>
    </Modal>
  );
};

export default IndicatorSettingModal;
