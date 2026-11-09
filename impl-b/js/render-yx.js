import { createScale } from "./scale.js";

let svg;
let dynamicLayer;
let scale;
let nodes;

const NS = "http://www.w3.org/2000/svg";
const WIDTH = 700;
const HEIGHT = 480;

function element(name, attributes = {}) {
  const node = document.createElementNS(NS, name);

  Object.entries(attributes).forEach(([key, value]) => {
    node.setAttribute(key, value);
  });

  return node;
}

function pathFor(points) {
  return points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`
    )
    .join(" ");
}

function formatTick(value) {
  if (value === 0) return "0";
  if (Math.abs(value) < 1e-3) return value.toExponential(1);
  return value.toFixed(value < 0.01 ? 4 : 3);
}

export function mount(root) {
  svg = element("svg", {
    viewBox: "0 0 700 480",
    class: "yx-svg",
    role: "img",
    "aria-label": "Interactive gas-liquid y-x absorption diagram"
  });

  dynamicLayer = element("g", { class: "yx-dynamic" });
  svg.append(dynamicLayer);
  root.append(svg);

  nodes = {
    equilibrium: element("path", { class: "equilibrium" }),
    operating: element("path", { class: "operating" }),
    staircase: element("path", { class: "staircase" }),
    pinchLine: element("path", { class: "pinch-line", hidden: true }),
    topHit: element("circle", {
      class: "hit-area",
      r: 22,
      tabindex: "0",
      role: "slider",
      "aria-label": "Treated gas composition, drag vertically",
      "aria-orientation": "vertical"
    }),
    bottomHit: element("circle", {
      class: "hit-area",
      r: 22,
      tabindex: "0",
      role: "slider",
      "aria-label": "Liquid rate, drag horizontally",
      "aria-orientation": "horizontal"
    }),
    topHandle: element("circle", {
      class: "handle handle-y",
      r: 7,
      "pointer-events": "none"
    }),
    bottomHandle: element("circle", {
      class: "handle handle-x",
      r: 7,
      "pointer-events": "none"
    }),
    topLabel: element("text", { class: "handle-label" }),
    bottomLabel: element("text", { class: "handle-label" })
  };

  dynamicLayer.append(
    nodes.equilibrium,
    nodes.operating,
    nodes.staircase,
    nodes.pinchLine,
    nodes.topHit,
    nodes.bottomHit,
    nodes.topHandle,
    nodes.bottomHandle,
    nodes.topLabel,
    nodes.bottomLabel
  );

  return {
    svg,
    top: nodes.topHit,
    bottom: nodes.bottomHit
  };
}

export function getSvg() {
  return svg;
}

export function getScale() {
  return scale;
}

export function update(derived) {
  const terminal = derived.terminals;

  // Axes are state-derived. drag.js captures this scale on pointerdown so
  // the autoscale stays visually frozen until the gesture ends.
  scale = createScale({
    xMax: derived.axes.xMax,
    yMax: derived.axes.yMax,
    width: WIDTH,
    height: HEIGHT
  });

  // The static grid and labels are redrawn because only the coordinate range changes.
  dynamicLayer.querySelectorAll(".axis-decoration").forEach((node) => node.remove());

  for (let i = 0; i <= 5; i += 1) {
    const x = derived.axes.xMax * i / 5;
    const y = derived.axes.yMax * i / 5;

    dynamicLayer.insertBefore(
      element("line", {
        x1: scale.xToSvg(x),
        y1: scale.yToSvg(0),
        x2: scale.xToSvg(x),
        y2: scale.yToSvg(derived.axes.yMax),
        class: "grid axis-decoration"
      }),
      dynamicLayer.firstChild
    );

    dynamicLayer.insertBefore(
      element("line", {
        x1: scale.xToSvg(0),
        y1: scale.yToSvg(y),
        x2: scale.xToSvg(derived.axes.xMax),
        y2: scale.yToSvg(y),
        class: "grid axis-decoration"
      }),
      dynamicLayer.firstChild
    );

    const xTick = element("text", {
      x: scale.xToSvg(x),
      y: 454,
      "text-anchor": "middle",
      class: "tick axis-decoration"
    });
    xTick.textContent = formatTick(x);
    dynamicLayer.insertBefore(xTick, dynamicLayer.firstChild);

    const yTick = element("text", {
      x: 60,
      y: scale.yToSvg(y) + 4,
      "text-anchor": "end",
      class: "tick axis-decoration"
    });
    yTick.textContent = formatTick(y);
    dynamicLayer.insertBefore(yTick, dynamicLayer.firstChild);
  }

  dynamicLayer.insertBefore(
    element("line", {
      x1: scale.xToSvg(0),
      y1: scale.yToSvg(0),
      x2: scale.xToSvg(derived.axes.xMax),
      y2: scale.yToSvg(0),
      class: "axis axis-decoration"
    }),
    dynamicLayer.firstChild
  );

  dynamicLayer.insertBefore(
    element("line", {
      x1: scale.xToSvg(0),
      y1: scale.yToSvg(0),
      x2: scale.xToSvg(0),
      y2: scale.yToSvg(derived.axes.yMax),
      class: "axis axis-decoration"
    }),
    dynamicLayer.firstChild
  );

  const xTitle = element("text", {
    x: 370,
    y: 478,
    "text-anchor": "middle",
    class: "axis-title axis-decoration"
  });
  xTitle.textContent = "Liquid solute mole fraction, x";
  dynamicLayer.append(xTitle);

  const yTitle = element("text", {
    x: 18,
    y: 240,
    transform: "rotate(-90 18 240)",
    "text-anchor": "middle",
    class: "axis-title axis-decoration"
  });
  yTitle.textContent = "Gas solute mole fraction, y";
  dynamicLayer.append(yTitle);

  const equilibriumPoints = [
    [scale.xToSvg(0), scale.yToSvg(0)],
    [
      scale.xToSvg(derived.axes.xMax),
      scale.yToSvg(terminal.m * derived.axes.xMax)
    ]
  ];

  nodes.equilibrium.setAttribute("d", pathFor(equilibriumPoints));

  nodes.operating.setAttribute(
    "d",
    pathFor([
      [scale.xToSvg(terminal.xIn), scale.yToSvg(terminal.yOut)],
      [scale.xToSvg(terminal.xOut), scale.yToSvg(terminal.yIn)]
    ])
  );

  nodes.staircase.setAttribute(
    "d",
    pathFor(
      derived.staircase.vertices.map((point) => [
        scale.xToSvg(point.x),
        scale.yToSvg(point.y)
      ])
    )
  );

  nodes.topHit.setAttribute("cx", scale.xToSvg(terminal.xIn));
  nodes.topHit.setAttribute("cy", scale.yToSvg(terminal.yOut));
  nodes.bottomHit.setAttribute("cx", scale.xToSvg(terminal.xOut));
  nodes.bottomHit.setAttribute("cy", scale.yToSvg(terminal.yIn));

  nodes.topHandle.setAttribute("cx", scale.xToSvg(terminal.xIn));
  nodes.topHandle.setAttribute("cy", scale.yToSvg(terminal.yOut));
  nodes.bottomHandle.setAttribute("cx", scale.xToSvg(terminal.xOut));
  nodes.bottomHandle.setAttribute("cy", scale.yToSvg(terminal.yIn));

  nodes.topHit.setAttribute(
    "aria-valuetext",
    `y_out = ${terminal.yOut.toExponential(3)} mole fraction`
  );
  nodes.bottomHit.setAttribute(
    "aria-valuetext",
    `x_out = ${terminal.xOut.toExponential(3)} mole fraction; L/V = ${derived.LoV.toFixed(3)}`
  );

  nodes.topLabel.textContent = "y_out";
  nodes.topLabel.setAttribute("x", scale.xToSvg(terminal.xIn) + 12);
  nodes.topLabel.setAttribute("y", scale.yToSvg(terminal.yOut) - 12);

  nodes.bottomLabel.textContent = "x_out";
  nodes.bottomLabel.setAttribute("x", scale.xToSvg(terminal.xOut) + 12);
  nodes.bottomLabel.setAttribute("y", scale.yToSvg(terminal.yIn) - 12);

  const pinch = derived.pinch;

  if (pinch === "bottom") {
    nodes.pinchLine.hidden = false;
    nodes.pinchLine.setAttribute(
      "d",
      pathFor([
        [scale.xToSvg(terminal.xOutPinch ?? derived.xOutPinch), scale.yToSvg(terminal.yIn)],
        [scale.xToSvg(terminal.xOutPinch ?? derived.xOutPinch), scale.yToSvg(0)]
      ])
    );
  } else if (pinch === "top") {
    nodes.pinchLine.hidden = false;
    nodes.pinchLine.setAttribute(
      "d",
      pathFor([
        [scale.xToSvg(terminal.xIn), scale.yToSvg(terminal.m * terminal.xIn)],
        [scale.xToSvg(terminal.xIn), scale.yToSvg(terminal.yOut)]
      ])
    );
  } else {
    nodes.pinchLine.hidden = true;
  }
}
