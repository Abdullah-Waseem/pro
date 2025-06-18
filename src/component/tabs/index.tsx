import { Component, createSignal, For, JSX } from "solid-js";
import "./index.less";

export interface TabItem {
  key: string;
  label: string | JSX.Element;
}

export interface TabsProps {
  items: TabItem[];
  defaultActiveKey?: string;
  onChange?: (activeKey: string) => void;
  class?: string;
}

const Tabs: Component<TabsProps> = (props) => {
  const [activeKey, setActiveKey] = createSignal(
    props.defaultActiveKey || props.items[0]?.key || ""
  );

  const handleTabClick = (key: string) => {
    setActiveKey(key);
    props.onChange?.(key);
  };

  return (
    <div class={`klinecharts-pro-tabs ${props.class || ""}`}>
      <div class="klinecharts-pro-tabs-header">
        <For each={props.items}>
          {(item) => (
            <button
              class={`klinecharts-pro-tabs-tab ${
                activeKey() === item.key ? "active" : ""
              }`}
              onClick={() => handleTabClick(item.key)}
            >
              {item.label}
            </button>
          )}
        </For>
      </div>
    </div>
  );
};

export default Tabs;
