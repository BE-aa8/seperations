/**
 * presets.js — pure data. No computation lives here (PLAN §2.2).
 *
 * ⚠️ EVERY numeric value in this file is flagged `verify: true` and is
 * ILLUSTRATIVE until checked against Seader, *Separation Process Principles*,
 * Ch. 6. See PLAN §4 and the verification ledger in DECISIONS.md §4.
 */

/** The date the defaults were chosen, shown in the standing caveat (D-32). */
export const DEFAULTS_CHOSEN = '2026-09-21';

export const UNVERIFIED_NOTE =
  `Default parameter values are illustrative, chosen ${DEFAULTS_CHOSEN}, ` +
  'and pending verification against Seader Ch. 6.';

// ---------------------------------------------------------------------------
// Tray defaults (PLAN §4.1)
// ---------------------------------------------------------------------------

export const TRAY_DEFAULTS = {
  Eo: 0.7, // VERIFY — absorber efficiencies often run 0.3–0.7, lower than distillation
  traySpacing: 0.6, // VERIFY — 24 in, standard but diameter-dependent
  hTop: 1.0, // VERIFY — top disengaging allowance
  hBot: 1.0, // VERIFY — bottom sump allowance
  verify: true,
};

// ---------------------------------------------------------------------------
// Packing (PLAN §4.1, D-16: H_OG constant per packing, not flow-correlated)
// ---------------------------------------------------------------------------

export const PACKINGS = [
  {
    id: 'raschig',
    label: 'Ceramic Raschig rings, 25 mm',
    HOG: 0.9, // VERIFY
    note: 'First-generation random packing. Low capacity, high HETP.',
    verify: true,
  },
  {
    id: 'pall',
    label: 'Metal Pall rings, 38 mm',
    HOG: 0.6, // VERIFY
    note: 'Third-generation random packing. The usual default choice.',
    verify: true,
  },
  {
    id: 'structured',
    label: 'Structured, 250 m²/m³',
    HOG: 0.4, // VERIFY
    note: 'Ordered corrugated sheets. Lowest HETP and pressure drop, highest cost.',
    verify: true,
  },
];

export const DEFAULT_PACKING_ID = 'pall';

// ---------------------------------------------------------------------------
// Chemical systems (PLAN §4.2)
// ---------------------------------------------------------------------------

export const SYSTEMS = [
  {
    id: 'generic',
    label: 'Generic solute A in air → water',
    m: 1.0, // VERIFY
    V: 100, // kmol/h
    yIn: 0.02,
    xIn: 0.0,
    yOut: 0.002,
    LoV0: 2.0, // initial liquid-to-gas ratio -> A = 2.0, L = 200 kmol/h
    conditions: '—',
    note:
      'Deliberately round-numbered so the arithmetic can be checked by hand. ' +
      'This is Worked Example A in the project plan: N = 2.459, N_OG = 3.409, ' +
      'A = 2 exactly.',
    warning: null,
    verify: true,
  },
  {
    id: 'ammonia',
    label: 'Ammonia in air → water',
    m: 0.85, // VERIFY — strongly temperature-dependent
    V: 100,
    yIn: 0.02,
    xIn: 0.0005,
    yOut: 0.002,
    LoV0: 1.275, // -> A = 1.500, L = 127.5 kmol/h
    conditions: '20 °C, 1 atm',
    note:
      'The classic textbook absorption system. Ammonia is very soluble in ' +
      'water, so a modest liquid rate does the job.',
    warning:
      'm for ammonia–water is strongly temperature-dependent and moves ' +
      'substantially over a 10 °C swing. The value here is for 20 °C.',
    verify: true,
  },
  {
    id: 'acetone',
    label: 'Acetone in air → water',
    m: 1.8, // VERIFY
    V: 120,
    yIn: 0.015,
    xIn: 0.0,
    yOut: 0.0015,
    LoV0: 2.5, // -> A = 1.389, L = 300 kmol/h
    conditions: '25 °C, 1 atm',
    note:
      'Genuinely dilute at these compositions — the most defensible ' +
      'straight-line case of the four. Typical of solvent-vapour recovery.',
    warning: null,
    verify: true,
  },
  {
    id: 'so2',
    label: 'Sulphur dioxide in air → water',
    m: 40, // VERIFY — and see the warning: the real curve is markedly non-linear
    V: 100,
    yIn: 0.005,
    xIn: 0.0,
    yOut: 0.0005,
    LoV0: 60.0, // -> A = 1.500, L = 6000 kmol/h (note the enormous liquid rate)
    conditions: '25 °C, 1 atm',
    note:
      'Included deliberately as the case where this model strains. Note the ' +
      'enormous L/V it demands — that is precisely why SO₂ scrubbing is done ' +
      'with alkaline solution rather than plain water.',
    // Shown on screen whenever this preset is active (D-33, critique C-13).
    warning:
      'Straight-line model strained here. Real SO₂–water equilibrium is ' +
      'distinctly curved even at these low compositions, so the single slope ' +
      'm = 40 is a fit over a narrow range, not a law. Treat the stage and ' +
      'height numbers on this preset as illustrative of the method, not as a ' +
      'design. This is the case that motivates curved-equilibrium support.',
    verify: true,
  },
];

export const DEFAULT_SYSTEM_ID = 'generic';

// ---------------------------------------------------------------------------
// A ≈ 1 demonstration presets (PLAN §4.3, D-23 and D-31)
// ---------------------------------------------------------------------------

/**
 * The A = 1 removable singularity is the most error-prone part of the physics,
 * so it gets dedicated buttons.
 *
 * The two entries test DIFFERENT things:
 *   - `balanced`     exercises the special case itself (naive form -> NaN here)
 *   - `nearBalanced` exercises the BRANCH SELECTION in physics.js §3.8
 *
 * The near-balanced value matters: L = 99.9999 would give |A - 1| = 1e-6
 * EXACTLY, which fails the strict `< TOL_N` test and takes the log1p branch —
 * i.e. it would not exercise what the button exists for. L = 99.99995 gives
 * |A - 1| = 5e-7, comfortably inside the series band.
 */
export const DEMO_PRESETS = [
  {
    id: 'balanced',
    label: 'Balanced (A = 1)',
    m: 1.0,
    V: 100,
    yIn: 0.02,
    xIn: 0.0,
    yOut: 0.004,
    LoV0: 1.0, // A = 1 exactly
    note:
      'Worked Example B: N = N_OG = 4 exactly, HETP = H_OG exactly, the NTU ' +
      'shaded area is a perfect rectangle, and the packed composition profile ' +
      'is a straight line. Hand-checkable in a minute.',
    expect: { N: 4, NOG: 4 },
  },
  {
    id: 'near-balanced',
    label: 'Near-balanced (A = 1 − 5×10⁻⁷)',
    m: 1.0,
    V: 100,
    yIn: 0.02,
    xIn: 0.0,
    yOut: 0.004,
    LoV0: 0.9999995, // A = 1 - 5e-7: inside the series band, unlike 1 - 1e-6
    note:
      'Same job, but A sits just inside the series-expansion band. Should read ' +
      'identically to the balanced case to displayed precision, with no jump ' +
      'between them. A visible discontinuity means a misplaced branch threshold.',
    expect: { N: 4.000005, NOG: 4.000005 },
  },
];

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

/** Build a complete AbsorptionInput from a system id and a packing id. */
export function buildInput(systemId, packingId, overrides = {}) {
  const sys = SYSTEMS.find((s) => s.id === systemId) ?? SYSTEMS[0];
  const pack = PACKINGS.find((p) => p.id === packingId) ?? PACKINGS[1];
  return {
    m: sys.m,
    V: sys.V,
    xIn: sys.xIn,
    yIn: sys.yIn,
    yOut: sys.yOut,
    // x_out is DERIVED from the preset's initial L/V via the mass balance,
    // eq. (1) rearranged. Presets specify L/V rather than x_out because L/V is
    // the physically meaningful quantity and keeps A exact across presets;
    // thereafter the drag handle owns x_out and L/V is derived from it (D-09).
    xOut: sys.xIn + (sys.yIn - sys.yOut) / sys.LoV0,
    HOG: pack.HOG,
    Eo: TRAY_DEFAULTS.Eo,
    traySpacing: TRAY_DEFAULTS.traySpacing,
    hTop: TRAY_DEFAULTS.hTop,
    hBot: TRAY_DEFAULTS.hBot,
    ...overrides,
  };
}
