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

import { Modal, Input, Tabs } from "../../component";
import { TabItem } from "../../component/tabs";
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
    figures: Array<{ title: string; key: string }>;
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
  const [activeTab, setActiveTab] = createSignal("parameters");

  const getConfig: (name: string) => any[] = (name: string) => {
    // @ts-expect-error
    return data[name];
  };

  console.log("Indicator settings", props.params.styles);

  const tabItems: TabItem[] = [
    {
      key: "parameters",
      label: i18n("parameters", props.locale),
    },
    {
      key: "styles",
      label: i18n("styles", props.locale),
    },
  ];

  return (
    <Modal
      title={props.params.indicatorName + "  -  " + activeTab().toUpperCase()}
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
      <Tabs
        items={tabItems}
        defaultActiveKey="parameters"
        onChange={setActiveTab}
      />

      {activeTab() === "parameters" && (
        <div class="klinecharts-pro-indicator-setting-modal-content">
          {getConfig(props.params.indicatorName).map((d, i) => {
            return (
              <>
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
      )}

      {activeTab() === "styles" && (
        <div class="klinecharts-pro-indicator-setting-modal-content">
          {props.params.figures.map((figure, i) => {
            return (
              <>
                <span>{figure.title}</span>
                <input
                  type="color"
                  class="klinecharts-pro-indicator-setting-modal-color"
                  value={styles().lines[i].color}
                  onChange={(e: any) => {
                    const newStyles = utils.clone(styles());
                    newStyles.lines[i].color = String(e.target.value);
                    setStyles(newStyles);
                  }}
                />
              </>
            );
          })}
        </div>
      )}
    </Modal>
  );
};

export default IndicatorSettingModal;
