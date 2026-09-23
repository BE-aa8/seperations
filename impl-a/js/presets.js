/**
 * presets.js — pure data. No computation lives here (PLAN §2.2).
 *
 * ON THESE NUMBERS. Every value below is an ILLUSTRATIVE TYPICAL FIGURE,
 * chosen so the demonstration is legible and hand-checkable. None of it is
 * design data, and none of it is transcribed from a specific source.
 *
 * Each entry carries a `typical` range and a `basis` line. Those ranges are
 * general engineering practice — the kind of figure quoted across the standard
 * separations literature — and are stated as such. Where a value sits at the
 * edge of its own range, the note says so rather than quietly moving it.
 *
 * The equilibrium slopes `m` are the weakest numbers here and are marked
 * individually: a Henry's-law slope depends on the system, the temperature and
 * the pressure, so a single figure is an order-of-magnitude illustration and
 * nothing more. For real design values, look them up for your actual
 * conditions. See PLAN §4 and the sourcing table in DECISIONS.md §4.
 */

/** When these figures were selected, shown in the standing on-screen note. */
export const DEFAULTS_CHOSEN = '2026-09-21';

export const ILLUSTRATIVE_NOTE =
  'Parameter values here are illustrative typical figures, chosen to make the ' +
  'demonstration legible. They are not design data — equilibrium slopes in ' +
  'particular depend on system, temperature and pressure. Look values up for ' +
  'your own conditions before using any of this for real sizing.';

// ---------------------------------------------------------------------------
// Tray defaults (PLAN §4.1)
// ---------------------------------------------------------------------------

export const TRAY_DEFAULTS = {
  // Overall efficiency. Absorbers generally run lower than distillation
  // columns; figures in the 0.3–0.7 band are commonly quoted, and 0.7 sits at
  // the OPTIMISTIC end of that. It is kept because the worked examples and the
  // test suite are built on it, and because a round number is easier to check
  // by hand — not because it is a conservative choice.
  Eo: 0.7,
  // Tray spacing. 0.6 m is 24 inches, the usual default; real columns run
  // roughly 0.45–0.75 m and larger diameters tend to want more.
  traySpacing: 0.6,
  // Disengaging space above the top tray and sump below the bottom one.
  // Both are strongly design-dependent; ~1 m each is a plausible allowance.
  hTop: 1.0,
  hBot: 1.0,

  basis: {
    Eo: { typical: '0.3–0.7 for absorbers', note: 'this value is at the optimistic end' },
    traySpacing: { typical: '0.45–0.75 m', note: '0.6 m = 24 in, the common default' },
    hTop: { typical: '~1 m', note: 'strongly design-dependent' },
    hBot: { typical: '~1 m', note: 'sized by liquid holdup and residence time' },
  },
  illustrative: true,
};

// ---------------------------------------------------------------------------
// Packing (PLAN §4.1, D-16: H_OG constant per packing, not flow-correlated)
// ---------------------------------------------------------------------------

export const PACKINGS = [
  {
    id: 'raschig',
    label: 'Ceramic Raschig rings, 25 mm',
    HOG: 0.9,
    note: 'First-generation random packing. Low capacity, high HETP.',
    typical: '0.6–1.2 m',
    basis:
      'Older random packings sit at the tall end of the transfer-unit range. ' +
      'The actual figure depends on size, material, system and loading.',
    illustrative: true,
  },
  {
    id: 'pall',
    label: 'Metal Pall rings, 38 mm',
    HOG: 0.6,
    note: 'Third-generation random packing. The usual default choice.',
    typical: '0.4–0.8 m',
    basis:
      'Modern random packings improve markedly on rings of the same size. ' +
      'Mid-range figure for a 38 mm metal packing.',
    illustrative: true,
  },
  {
    id: 'structured',
    label: 'Structured, 250 m²/m³',
    HOG: 0.4,
    note: 'Ordered corrugated sheets. Lowest HETP and pressure drop, highest cost.',
    typical: '0.3–0.6 m',
    basis:
      'Structured packings give the shortest transfer unit of the three, which ' +
      'is most of why they are specified despite the cost.',
    illustrative: true,
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
    m: 1.0,
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
    typical: 'n/a — a deliberately round teaching value',
    basis:
      'Not a real system. m = 1 puts the equilibrium line on the diagonal, ' +
      'which makes every number on screen checkable by hand.',
    illustrative: true,
  },
  {
    id: 'ammonia',
    label: 'Ammonia in air → water',
    m: 0.85,
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
      'substantially over a 10 °C swing. The value here is a round figure for ' +
      'roughly 20 °C and 1 atm, and is illustrative rather than design data.',
    typical: 'order 1 at ambient conditions',
    basis:
      'Ammonia is very soluble in water, so its equilibrium slope is small — ' +
      'around one at ambient conditions, falling as temperature drops. The ' +
      'exact figure depends on temperature and pressure; look it up for yours.',
    illustrative: true,
  },
  {
    id: 'acetone',
    label: 'Acetone in air → water',
    m: 1.8,
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
    typical: 'order 1–2 at ambient conditions',
    basis:
      'Moderately soluble, so the slope is a small multiple of one. Genuinely ' +
      'dilute at these compositions, which is why this is the best-behaved of ' +
      'the four for a straight-line model.',
    illustrative: true,
  },
  {
    id: 'so2',
    label: 'Sulphur dioxide in air → water',
    m: 40,
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
    typical: 'order 10¹–10² at ambient conditions',
    basis:
      'Much less soluble than ammonia, so the slope is far larger — which is ' +
      'exactly why the liquid rate this preset demands is so enormous. Treat ' +
      'the figure as an order of magnitude: the real relationship is curved, ' +
      'so no single slope describes it over any useful range.',
    illustrative: true,
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
