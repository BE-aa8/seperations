// content.js: equation cards (KaTeX source, units, one-line physical interpretation), from plan-v2-final.md §8.
// Text only, no physics. Rendered on the Theory tab and reused by the Simulator result cards.

export const EQ = {
  // ---- mass balances ----
  M1: { title: 'Overall mass balance', tex: String.raw`F = V + C + P`, units: 'kg/h',
    interp: 'Everything fed leaves as vapor, crystals, or purge.' },
  M2: { title: 'LiOH balance', tex: String.raw`F x_F = 0.5707\,C + P x_L`, units: 'kg LiOH/h',
    interp: 'Lithium leaves only in crystals or purge, so a bigger purge means less product.' },
  M3: { title: 'Impurity balance', tex: String.raw`F z_F = P z_{ML}`, units: 'kg/h',
    interp: "Impurities don't crystallize, so the purge is their only exit." },
  M4: { title: 'Mother-liquor impurity', tex: String.raw`z_{ML} = \dfrac{z_F}{p},\quad p = P/F`, units: '– (mass fraction)',
    interp: 'The mother liquor concentrates impurity by 1/p.' },
  M5: { title: 'Saturated liquor composition', tex: String.raw`x_L = (1 - z_{ML})\,\dfrac{s}{100 + s}`, units: '– (mass fraction LiOH)',
    interp: 'Saturated liquor: the LiOH:water ratio is fixed by solubility at T.' },
  M6: { title: 'Water balance', tex: String.raw`F(1-x_F-z_F) = V + 0.4293\,C + P(1 - x_L - z_{ML})`, units: 'kg/h',
    interp: 'Water leaves as vapor, as hydrate water, or in the purge.' },
  M7: { title: 'Lithium yield', tex: String.raw`\text{Yield} = \dfrac{0.5707\,C}{F x_F}`, units: '– (fraction)',
    interp: 'Fraction of the incoming Li recovered as crystals.' },
  M8: { title: 'Product impurity (adhering liquor)', tex: String.raw`\text{Impurity} \approx \dfrac{\varepsilon\, z_{ML}}{1+\varepsilon}\times 10^6`, units: 'ppm (mass)',
    interp: 'Purity-only model: the liquor film left on the crystals after the centrifuge carries impurity. Its mass is neglected in M1–M6.' },
  M9: { title: 'Cooling-crystallization yield', tex: String.raw`Y_{cool} = \dfrac{s(T_{hot}) - s(T_{cold})}{s(T_{hot})}`, units: '– (fraction)',
    interp: 'Flat solubility: cooling recovers little, so water must be evaporated.' },

  // ---- phase equilibrium, BPE, crystallization ----
  B1: { title: 'Boiling-point elevation', tex: String.raw`\mathrm{BPE} = a\, i\, K_b\, m,\qquad K_b = \dfrac{R\,T_b^2\,M_w}{\Delta H_{vap}} = \dfrac{R\,T_b^2}{h_{fg}(T_b)},\qquad m = \dfrac{s/100}{M_{LiOH}}`, units: 'K (K_b in K·kg/mol, m in mol/kg)',
    interp: "Dissolved ions lower water's vapor pressure, so the liquor must be hotter to boil at the same pressure. K_b is taken at T_b for simplicity (strictly the pure-water boiling point, ~3 % effect)." },
  B2: { title: 'Liquor vs vapor temperature', tex: String.raw`T_b = T_{sat}(P) + \mathrm{BPE}`, units: '°C',
    interp: "Non-volatile LiOH stays in the liquid, so the boiling liquor is at T_b. It makes pure water vapor at pressure P, superheated by BPE above that vapor's condensation point T_sat(P)." },
  B3: { title: 'Antoine equation (water)', tex: String.raw`\log_{10} P_{sat}[\mathrm{mmHg}] = A - \dfrac{B}{C + T[^\circ\mathrm{C}]}`, units: 'mmHg (× 0.133322 → kPa)',
    interp: 'Higher T → higher vapor pressure. The compressor raises P so the vapor condenses hotter.' },
  B4: { title: 'Supersaturation', tex: String.raw`S = \dfrac{c}{c^*},\qquad \sigma = \dfrac{c - c^*}{c^*}`, units: '– (dimensionless)',
    interp: 'Driving force for crystallization: how far above saturation the liquor is.' },
  B5: { title: 'Binodal, metastable limit, spinodal (schematic)', tex: String.raw`c^*_{\text{binodal}} \;<\; c_{\text{metastable limit}} \;<\; c_{\text{spinodal}}`, units: 'concentration (schematic, no LiOH data)',
    interp: 'Below c*: crystals dissolve. Metastable zone: seed crystals grow but new nuclei rarely form, so seeding controls size. Above the metastable limit: a nucleation shower → fines. Spinodal: the thermodynamic limit where phase separation needs no nucleation barrier. The metastable width is kinetic; the spinodal is thermodynamic.' },

  // ---- energy ----
  E1: { title: 'Evaporator heat duty', tex: String.raw`Q \approx \dfrac{V\, h_{fg}(T_v)}{3600} \;\;(+\,F c_p (T_b - T_F) \text{ if subcooled})`, units: 'kW (V in kg/h, h_fg in kJ/kg)',
    interp: 'Almost all the energy goes into boiling water off. Vapor superheat (BPE) and the heat of crystallization are neglected (~0.4 %); the feed enters at T_b here.' },
  E2: { title: 'Single-effect steam use and economy', tex: String.raw`S = \dfrac{3600\,Q}{h_{fg}(T_s)},\qquad E = \dfrac{V}{S}`, units: 'kg/h; – (kg water per kg steam)',
    interp: 'One kg of steam boils about one kg of water.' },
  E3: { title: 'N-effect economy (ideal)', tex: String.raw`E_N \approx N\, E_1`, units: '– (kg water per kg steam)',
    interp: "Each effect's vapor heats the next, so the latent heat is reused N times (an upper bound)." },
  E4: { title: 'Driving force per effect', tex: String.raw`\Delta T_{effect} = \dfrac{T_s - T_{last} - N\cdot \mathrm{BPE}}{N} \;\ge\; \Delta T_{min}`, units: 'K',
    interp: 'In each effect, vapor leaves the liquor at T_b,k but condenses in the next heater only at T_b,k − BPE, so BPE is subtracted from the usable driving force in every stage.' },

  // ---- compressor ----
  C1: { title: 'Compressor suction and discharge', tex: String.raw`T_c = T_b + \Delta T_{heater};\quad P_2 = P_{sat}(T_c);\quad P_1 = P_{sat}(T_b - \mathrm{BPE})`, units: '°C, kPa',
    interp: 'The vapor must be compressed until it condenses hotter than the liquor it heats.' },
  C2: { title: 'Pressure ratio and lift', tex: String.raw`r = \dfrac{P_2}{P_1},\qquad \text{lift} = T_c - T_v = \mathrm{BPE} + \Delta T_{heater}`, units: '–; K',
    interp: 'Set by the required lift (BPE + ΔT_heater).' },
  C3: { title: 'Isentropic work (ideal gas)', tex: String.raw`w_s = \dfrac{\gamma}{\gamma - 1}\,\dfrac{R}{M}\,T_1\left[r^{(\gamma-1)/\gamma} - 1\right]`, units: 'J/(kg·K) × K = J/kg (÷1000 → kJ/kg)',
    interp: 'Work grows with the lift, not with the latent heat recycled. It scales with T_1 and R/M because hotter, lighter vapor has a larger specific volume (v = RT/(PM)), so more ∫v dP work is needed per kg for the same pressure ratio. T_1 = T_b because the vapor leaves the boiling liquor at T_b.' },
  C4: { title: 'Actual work and electric power', tex: String.raw`w = \dfrac{w_s}{\eta_{is}};\qquad W_{elec} = \dfrac{V\,w}{3600\,\eta_m}`, units: 'kJ/kg; kW',
    interp: 'Real machines and motors lose some work as heat.' },
  C5: { title: 'Specific energy', tex: String.raw`\dfrac{\text{kWh}}{\text{t}} = \dfrac{w}{3.6\,\eta_m}`, units: 'kWh per tonne of water evaporated',
    interp: 'The plant-comparison number (vendor range 20–60 kWh/t, ESTIMATE).' },
  C6: { title: 'Heat-pump COP', tex: String.raw`\mathrm{COP} = \dfrac{h_{fg}(T_v)}{w};\qquad \mathrm{COP}_{Carnot} = \dfrac{T_c}{T_c - T_v}\;[\mathrm{K}]`, units: '– (kJ heat moved per kJ work)',
    interp: 'A heat pump: ~20+ units of heat moved per unit of work, because only the lift is paid for.' },
  C7: { title: 'Discharge temperature', tex: String.raw`T_2 = T_1\left[1 + \dfrac{r^{(\gamma-1)/\gamma} - 1}{\eta_{is}}\right]`, units: 'K',
    interp: "Compression superheats steam; it doesn't make it wet. Liquid reaches the compressor only as entrained mist or foam (erosion, LiOH carry-over), or deliberately as condensate spray to desuperheat." },
  C8: { title: 'Where the compressor work goes', tex: String.raw`q_{heater} \approx h_g(T_v) + c_{p,v}\,\mathrm{BPE} + w - h_f(T_c)\;\approx\; 2440 \text{ vs } \approx 2359 \text{ kJ/kg needed}`, units: 'kJ/kg (Q&A only)',
    interp: "The compressor work doesn't disappear: it shows up as ~3 % surplus heat, used for feed preheat and losses, or vented." },

  // ---- economics ----
  $1: { title: 'MVR operating cost', tex: String.raw`\text{cost}_{MVR} = c_e \cdot \dfrac{\text{kWh}}{\text{t}}`, units: '$/t water',
    interp: 'You pay only for the lift.' },
  $2: { title: 'Multi-effect operating cost', tex: String.raw`\text{cost}_N = \dfrac{c_s}{E_N}`, units: '$/t water',
    interp: 'You pay for steam, divided by the number of reuses.' },
  $3: { title: 'Crossover electricity price', tex: String.raw`c_e^* = \dfrac{c_s}{E_N \cdot \text{kWh/t}}`, units: '$/kWh',
    interp: 'Below this electricity price, MVR is cheaper to run.' },
  $4: { title: 'Annual operating cost', tex: String.raw`\text{Annual} = \text{cost}/\text{t} \times V \times \dfrac{\text{hours}}{1000}`, units: '$/yr',
    interp: 'Scales the per-tonne cost to the plant.' },
};

export const THEORY_GROUPS = [
  { title: 'Mass balances (steady state, one crystallizer with purge)', ids: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M9'] },
  { title: 'Phase equilibrium, BPE, and crystallization', ids: ['B1', 'B2', 'B3', 'B4', 'B5'] },
  { title: 'Energy: single and multiple effects', ids: ['E1', 'E2', 'E3', 'E4'] },
  { title: 'MVR compressor (a heat pump)', ids: ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'] },
  { title: 'Economics (operating cost only in Phase 1)', ids: ['$1', '$2', '$3', '$4'] },
];
