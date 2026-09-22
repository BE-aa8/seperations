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

function profileStepPath(points, xScale, yScale) {
  if (points.length === 0) {
    return "";
  }

  const first = points[0];
  let path = `M${xScale(first.y).toFixed(2)} ${yScale(first.zFromBottom).toFixed(2)}`;

  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const previous = points[i - 1];

    // Keep the tray profile visibly discrete: horizontal composition changes
    // occur at tray elevations, with vertical sections between trays.
    path +=
      `L${xScale(previous.y).toFixed(2)} ${yScale(point.zFromBottom).toFixed(2)}`;
    path +=
      `L${xScale(point.y).toFixed(2)} ${yScale(point.zFromBottom).toFixed(2)}`;
  }

  return path;
}

export function mount(root) {
  svg = element("svg", {
    viewBox: "0 0 700 360",
    class: "chart-svg",
    role: "img",
    "aria-label": "Gas composition versus physical height"
  });

  layer = element("g");
  svg.append(layer);
  root.append(svg);

  return { svg };
}

export function update(derived) {
  layer.replaceChildren();

  const left = 78;
  const right = 660;
  const top = 28;
  const bottom = 305;
  const maxZ = Math.max(derived.Z, derived.ZTray, 1);
  const maxY = derived.terminals.yIn * 1.12;

  const xScale = (y) => left + (y / maxY) * (right - left);
  const yScale = (z) =>
    bottom - (z / maxZ) * (bottom - top);

  layer.append(
    element("line", {
      x1: left,
      y1: bottom,
      x2: right,
      y2: bottom,
      class: "axis"
    }),
    element("line", {
      x1: left,
      y1: bottom,
      x2: left,
      y2: top,
      class: "axis"
    })
  );

  const packedPath = derived.profiles.packed
    .map((point, index) =>
      `${index === 0 ? "M" : "L"}${xScale(point.y).toFixed(2)} ${yScale(point.zFromBottom).toFixed(2)}`
    )
    .join(" ");

  const trayPath = profileStepPath(
    derived.profiles.tray,
    xScale,
    yScale
  );

  layer.append(
    element("path", {
      d: packedPath,
      class: "profile-packed"
    }),
    element("path", {
      d: trayPath,
      class: "profile-tray"
    })
  );

  const probe = derived.probe;
  const probeZ = probe?.z ?? 0;

  // Plot both probe readings when the corresponding column actually exists
  // at that elevation. Above the shorter column, do not extrapolate.
  layer.append(
    element("line", {
      x1: left,
      x2: right,
      y1: yScale(probeZ),
      y2: yScale(probeZ),
      class: "profile-probe"
    })
  );

  if (probe?.packedY !== null && probe?.packedY !== undefined) {
    layer.append(
      element("circle", {
        cx: xScale(probe.packedY),
        cy: yScale(probeZ),
        r: 6,
        class: "probe-marker probe-marker-packed",
        "aria-label": "Packed-column probe point"
      })
    );
  }

  if (probe?.trayY !== null && probe?.trayY !== undefined) {
    layer.append(
      element("circle", {
        cx: xScale(probe.trayY),
        cy: yScale(probeZ),
        r: 6,
        class: "probe-marker probe-marker-tray",
        "aria-label": "Tray-column probe point"
      })
    );
  }

  const title = element("text", {
    x: 350,
    y: 16,
    "text-anchor": "middle",
    class: "chart-title"
  });
  title.textContent = "Gas composition versus height";
  layer.append(title);

  const xLabel = element("text", {
    x: 360,
    y: 350,
    "text-anchor": "middle",
    class: "chart-label"
  });
  xLabel.textContent = "gas solute mole fraction";
  layer.append(xLabel);

  const yLabel = element("text", {
    x: 20,
    y: 170,
    transform: "rotate(-90 20 170)",
    "text-anchor": "middle",
    class: "chart-label"
  });
  yLabel.textContent = "height from bottom, z [m]";
  layer.append(yLabel);
}
