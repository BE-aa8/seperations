import { createScale } from "./scale.js";

let svg;
let layer;
let scale;
let probeNodes;

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
    viewBox: "0 0 720 520",
    class: "columns-svg",
    role: "img",
    "aria-label": "Tray and packed absorption columns"
  });

  layer = element("g");
  svg.append(layer);
  root.append(svg);

  probeNodes = {
    rule: element("line", {
      class: "probe-rule",
      "pointer-events": "stroke"
    }),
    tab: element("rect", {
      class: "probe-tab",
      width: 30,
      height: 44,
      rx: 5,
      tabindex: "0",
      role: "slider",
      "aria-label": "Height probe, drag vertically",
      "aria-orientation": "vertical"
    }),
    label: element("text", { class: "probe-label" })
  };

  layer.append(
    probeNodes.rule,
    probeNodes.tab,
    probeNodes.label
  );

  return {
    svg,
    probe: probeNodes.tab
  };
}

export function getScale() {
  return scale;
}

export function update(derived) {
  layer.querySelectorAll(".column-static").forEach((node) => node.remove());

  const maxHeight = Math.max(derived.ZTray, derived.Z, 1);
  const baseY = 450;
  const topY = 55;
  const activePixels = baseY - topY;

  scale = createScale({
    xMax: 1,
    yMax: maxHeight,
    width: 720,
    height: 520,
    margin: {
      left: 0,
      right: 0,
      top: topY,
      bottom: 70
    }
  });

  // zToSvg uses the same bottom-origin convention as the generic scale.
  const zToSvg = (z) => baseY - (z / maxHeight) * activePixels;

  const drawColumn = ({
    cx,
    height,
    trays,
    title,
    packed
  }) => {
    const width = 116;
    const x = cx - width / 2;
    const top = zToSvg(height);

    const shell = element("rect", {
      x,
      y: top,
      width,
      height: Math.max(8, baseY - top),
      rx: 14,
      class: "column-shell column-static"
    });

    layer.insertBefore(shell, probeNodes.rule);

    if (packed) {
      const fill = element("rect", {
        x: x + 14,
        y: top + 12,
        width: width - 28,
        height: Math.max(12, baseY - top - 24),
        rx: 8,
        class: "packing-fill column-static"
      });
      layer.insertBefore(fill, probeNodes.rule);

      const text = element("text", {
        x: cx,
        y: top + (baseY - top) / 2,
        "text-anchor": "middle",
        class: "packing-label column-static"
      });
      text.textContent = "PACKING";
      layer.insertBefore(text, probeNodes.rule);
    } else if (trays <= 40) {
      for (let i = 1; i <= trays; i += 1) {
        const line = element("line", {
          x1: x + 9,
          y1: zToSvg(height * i / trays),
          x2: x + width - 9,
          y2: zToSvg(height * i / trays),
          class: "tray column-static"
        });
        layer.insertBefore(line, probeNodes.rule);

        const label = element("text", {
          x: x + width + 8,
          y: zToSvg(height * i / trays) + 4,
          class: "tray-number column-static"
        });
        label.textContent = String(trays - i + 1);
        layer.insertBefore(label, probeNodes.rule);
      }
    } else {
      for (let i = 1; i <= 8; i += 1) {
        const line = element("line", {
          x1: x + 9,
          y1: zToSvg(height * i / trays),
          x2: x + width - 9,
          y2: zToSvg(height * i / trays),
          class: "tray column-static"
        });
        layer.insertBefore(line, probeNodes.rule);
      }

      const breakText = element("text", {
        x: cx,
        y: top + (baseY - top) / 2,
        "text-anchor": "middle",
        class: "break-symbol column-static"
      });
      breakText.textContent = `⋮ ${trays - 16} trays ⋮`;
      layer.insertBefore(breakText, probeNodes.rule);

      for (let i = 0; i < 8; i += 1) {
        const line = element("line", {
          x1: x + 9,
          y1: top + (i + 1) * (baseY - top) / trays,
          x2: x + width - 9,
          y2: top + (i + 1) * (baseY - top) / trays,
          class: "tray column-static"
        });
        layer.insertBefore(line, probeNodes.rule);
      }
    }

    const titleNode = element("text", {
      x: cx,
      y: 494,
      "text-anchor": "middle",
      class: "column-title column-static"
    });
    titleNode.textContent = title;
    layer.insertBefore(titleNode, probeNodes.rule);
  };

  drawColumn({
    cx: 150,
    height: derived.ZTray,
    trays: derived.nActual,
    title: `Tray · ${derived.ZTray.toFixed(2)} m`,
    packed: false
  });

  drawColumn({
    cx: 520,
    height: derived.Z,
    trays: 0,
    title: `Packed · ${derived.Z.toFixed(2)} m`,
    packed: true
  });

  const probeZ = derived.probe?.z ?? 0;
  probeNodes.rule.setAttribute("x1", 40);
  probeNodes.rule.setAttribute("x2", 680);
  probeNodes.rule.setAttribute("y1", zToSvg(probeZ));
  probeNodes.rule.setAttribute("y2", zToSvg(probeZ));

  probeNodes.tab.setAttribute("x", 345);
  probeNodes.tab.setAttribute("y", zToSvg(probeZ) - 22);
  probeNodes.tab.setAttribute(
    "aria-valuetext",
    `height probe = ${probeZ.toFixed(3)} m`
  );

  probeNodes.label.textContent = `z = ${probeZ.toFixed(2)} m`;
  probeNodes.label.setAttribute("x", 378);
  probeNodes.label.setAttribute("y", zToSvg(probeZ) - 22);
}

export function getProbeScale() {
  return scale;
}
