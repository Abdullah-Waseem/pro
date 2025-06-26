import { Component, For, JSX } from "solid-js";
import "./index.less";

export interface ContextMenuItem {
  label: string;
  onClick: () => void;
  icon?: JSX.Element;
}

export interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

const ContextMenu: Component<ContextMenuProps> = (props) => {
  return (
    <div
      class="klinecharts-pro-context-menu"
      style={{
        position: "fixed",
        left: `${props.x}px`,
        top: `${props.y}px`,
        "z-index": 1000,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }}
    >
      <ul>
        <For each={props.items}>
          {(item) => (
            <li
              onClick={() => {
                item.onClick();
                props.onClose();
              }}
            >
              {item.icon && <span class="icon">{item.icon}</span>}
              <span class="label">{item.label}</span>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
};

export default ContextMenu;
