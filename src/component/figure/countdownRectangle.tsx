import { getFigureClass, registerFigure, registerOverlay } from "klinecharts";

// 1️⃣ Create a CountdownRectangle by extending the built‑in rect
const RectFigure = getFigureClass("rect");

export class CountdownRectangle extends RectFigure {
  constructor(options) {
    // ensure name is set so registerFigure picks it up
    super({ ...options, name: "countdownRectangle" });
  }

  draw(ctx) {
    const { x, y, width, height, remainingSeconds, offsetX } = this.attrs;
    const {
      baseColor,
      warningColor,
      textColor = "#ffffff",
      borderRadius = 0,
    } = this.styles;

    const color = remainingSeconds <= 10 ? warningColor : baseColor;

    const adjustedX = x + offsetX;
    const left = adjustedX - width / 2;
    const top = y - height / 2;
    const r = borderRadius;

    // rounded rect path
    ctx.beginPath();
    ctx.moveTo(left + r, top);
    ctx.lineTo(left + width - r, top);
    ctx.quadraticCurveTo(left + width, top, left + width, top + r);
    ctx.lineTo(left + width, top + height - r);
    ctx.quadraticCurveTo(
      left + width,
      top + height,
      left + width - r,
      top + height
    );
    ctx.lineTo(left + r, top + height);
    ctx.quadraticCurveTo(left, top + height, left, top + height - r);
    ctx.lineTo(left, top + r);
    ctx.quadraticCurveTo(left, top, left + r, top);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // countdown text
    ctx.fillStyle = textColor;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(remainingSeconds.toString(), adjustedX, y);
  }

  checkEventOn(coordinate: { x: number; y: number }) {
    const { x, y, width, height, offsetX } = this.attrs;
    const adjustedX = x + offsetX;
    const left = adjustedX - width / 2;
    const top = y - height / 2;
    const { x: mx, y: my } = coordinate;
    return mx >= left && mx <= left + width && my >= top && my <= top + height;
  }
}
