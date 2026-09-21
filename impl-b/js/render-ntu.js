let svg;
let layer;

const NS = "http://www.w3.org/2000/svg";

function element(name, attributes = {}) {
  const node = document.createElementNS(NS, name);

  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });

  return node;
}

export function mount(root) {
  svg = element("svg", {
    viewBox: "0 0 700 300",
    class: "chart-svg",
    role: "img",
    "aria-label": "Overall gas transfer unit plot"
  });

  layer = element("g");
  svg.append(layer);
  root.append(svg);

  return { svg };
}

export function update(derived) {
  layer.replaceChildren();

  const terminal = derived.terminals;
  const left = 72;
  const right = 660;
  const bottom = 248;
  const top = 44;
  const samples = 100;
  const values = [];

  for (let i = 0; i <= samples; i += 1) {
    const y =
      terminal.yOut +
      (terminal.yIn - terminal.yOut) * i / samples;
    const x =
      terminal.xIn +
      (y - terminal.yOut) / derived.LoV;
    values.push({
      y,
      value: 1 / (y - terminal.m * x)
    });
  }

  const maxValue = Math.max(...values.map((point) => point.value));
  const xScale = (y) =>
    left + (y - terminal.yOut) / (terminal.yIn - terminal.yOut) * (right - left);
  const yScale = (value) =>
    bottom - value / (maxValue * 1.12) * (bottom - top);

  const path = values
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${xScale(point.y).toFixed(2)} ${yScale(point.value).toFixed(2)}`
    )
    .join(" ");

  const areaPath = [
    `M${xScale(terminal.yOut).toFixed(2)} ${bottom}`,
    ...values.map((point) =>
      `L${xScale(point.y).toFixed(2)} ${yScale(point.value).toFixed(2)}`
    ),
    `L${xScale(terminal.yIn).toFixed(2)} ${bottom} Z`
  ].join(" ");

  layer.append(
    element("line", {
      x1: left, y1: bottom, x2: right, y2: bottom, class: "axis"
    }),
    element("line", {
      x1: left, y1: bottom, x2: left, y2: top, class: "axis"
    }),
    element("path", { d: areaPath, class: "area" }),
    element("path", { d: path, class: "ntu-curve" })
  );

  const title = element("text", {
    x: 350,
    y: 24,
    "text-anchor": "middle",
    class: "chart-title"
  });
  title.textContent = `N_OG = ${derived.NOG.toFixed(3)} · shaded area`;
  layer.append(title);

  const xLabel = element("text", {
    x: 365,
    y: 291,
    "text-anchor": "middle",
    class: "chart-label"
  });
  xLabel.textContent = "gas mole fraction, y";
  layer.append(xLabel);

  const yLabel = element("text", {
    x: 18,
    y: 150,
    transform: "rotate(-90 18 150)",
    "text-anchor": "middle",
    class: "chart-label"
  });
  yLabel.textContent = "1 / (y − y*)";
  layer.append(yLabel);
}
