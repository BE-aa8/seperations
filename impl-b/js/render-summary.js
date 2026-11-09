let root;

function row(label, left, right, note = "") {
  return `
    <div class="summary-row">
      <div>
        <strong>${label}</strong>
        ${note ? `<small>${note}</small>` : ""}
      </div>
      <div>${left}</div>
      <div>${right}</div>
    </div>
  `;
}

export function mount(elementRoot) {
  root = elementRoot;
}

export function update(derived) {
  const consistency = Math.abs(
    derived.N * derived.HETP - derived.Z
  ) / Math.max(Math.abs(derived.Z), 1e-30);

  root.innerHTML = `
    <div class="summary-head">
      <span>Tray column</span>
      <span>Packed column</span>
    </div>
    <div class="summary-grid">
      ${row(
        "Theoretical stages / transfer units",
        derived.N.toFixed(3),
        derived.NOG.toFixed(3),
        "Different contacting descriptions for the same duty"
      )}
      ${row(
        "HETP / H_OG",
        `${derived.HETP.toFixed(3)} m`,
        `${derived.HOG.toFixed(3)} m`,
        "HETP links staged and continuous descriptions"
      )}
      ${row(
        "Actual trays / packed height",
        `${derived.nActual}`,
        `${derived.Z.toFixed(3)} m`,
        "Discrete tray count versus continuous bed height"
      )}
      ${row(
        "Total column height",
        `${derived.ZTray.toFixed(3)} m`,
        `${derived.Z.toFixed(3)} m`,
        "Including the specified top and bottom allowances"
      )}
      ${row(
        "L / V",
        derived.LoV.toFixed(3),
        `minimum ${derived.LoVmin.toFixed(3)}`,
        "L/V is derived from the two dragged terminal compositions"
      )}
      ${row(
        "L / V ÷ (L / V)_min",
        derived.LoVratio.toFixed(3),
        "",
        "How many times the minimum liquid rate"
      )}
      ${row(
        "Liquid flow L",
        `${derived.L.toFixed(3)} kmol/h`,
        `V = ${derived.inputs.V.toFixed(3)} kmol/h`,
        "L is derived, not an input"
      )}
      ${row(
        "Absorption factor A",
        derived.A.toFixed(4),
        `A_min = ${derived.Amin.toFixed(4)}`,
        "A < 1 can still be feasible"
      )}
      ${row(
        "Consistency check",
        `${(derived.N * derived.HETP).toFixed(6)} m`,
        `${derived.Z.toFixed(6)} m`,
        `N × HETP = Z by definition; raw relative difference ${consistency.toExponential(2)}`
      )}
    </div>
  `;
}
