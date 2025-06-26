import { Component, createSignal } from "solid-js";
import "./index.less";

interface DrawingSettingsModalProps {
  visible: boolean;
  styles: { color: string; size: number };
  onClose: () => void;
  onSave: (styles: { color: string; size: number }) => void;
}

const DrawingSettingsModal: Component<DrawingSettingsModalProps> = (props) => {
  const [color, setColor] = createSignal(props.styles.color);
  const [size, setSize] = createSignal(props.styles.size);

  if (!props.visible) return null;

  return (
    <div class="modal-backdrop">
      <div class="modal">
        <h3>Drawing Settings</h3>
        <label>
          Color:
          <input
            type="color"
            value={color()}
            onInput={(e) => setColor(e.currentTarget.value)}
          />
        </label>
        <label>
          Stroke Width:
          <input
            type="number"
            min="1"
            max="10"
            value={size()}
            onInput={(e) => setSize(Number(e.currentTarget.value))}
          />
        </label>
        <button onClick={() => props.onSave({ color: color(), size: size() })}>
          Save
        </button>
        <button onClick={props.onClose}>Cancel</button>
      </div>
    </div>
  );
};

export default DrawingSettingsModal;
