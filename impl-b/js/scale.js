export function createScale({
  xMax = 1,
  yMax = 1,
  width = 700,
  height = 480,
  margin = { left: 70, right: 28, top: 28, bottom: 58 }
} = {}) {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  return {
    width,
    height,
    margin,
    xMax,
    yMax,
    xToSvg: (x) => margin.left + (x / xMax) * innerWidth,
    yToSvg: (y) =>
      height - margin.bottom - (y / yMax) * innerHeight,
    svgToX: (x) => ((x - margin.left) / innerWidth) * xMax,
    svgToY: (y) =>
      ((height - margin.bottom - y) / innerHeight) * yMax
  };
}

export function screenToSvg(svg, clientX, clientY) {
  const point = new DOMPoint(clientX, clientY);
  const transformed = point.matrixTransform(
    svg.getScreenCTM().inverse()
  );

  return {
    x: transformed.x,
    y: transformed.y
  };
}
