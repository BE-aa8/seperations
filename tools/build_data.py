#!/usr/bin/env python3
"""Generate site/js/data.js: every property value and price used by the simulator.

Run:  python3 tools/build_data.py

Every value carries a sourceId (see SOURCES) and an `estimate` flag.
Raw numbers are copied verbatim from the cited source. Derived tables (LiOH
solubility, osmotic coefficient at saturation, steam cost) are computed below
from published equations so the derivation can be audited.
Standard library only.
"""
import json
import math
from pathlib import Path

ACCESSED = "2026-11-13"

SOURCES = {
    "nist-water": {
        "citation": "NIST Chemistry WebBook, SRD 69, Thermophysical Properties of Fluid Systems: Water, saturation properties (IAPWS-95 formulation, Wagner & Pruss 2002).",
        "url": "https://webbook.nist.gov/cgi/fluid.cgi?Action=Load&ID=C7732185&Type=SatP&TLow=30&THigh=150&TInc=5&Digits=6&TUnit=C&PUnit=kPa&HUnit=kJ%2Fkg",
        "accessed": ACCESSED,
    },
    "antoine-lange": {
        "citation": "Antoine constants for water (log10 P[mmHg] = A - B/(C + T[C])), A = 8.07131, B = 1730.63, C = 233.426, as tabulated in Lange's Handbook of Chemistry (via the Wikipedia 'Antoine equation' table). Checked by Claude against the NIST WebBook table: within 0.38 % from 30 to 110 C and 0.56 % at 130 C.",
        "url": "https://en.wikipedia.org/wiki/Antoine_equation",
        "accessed": ACCESSED,
        "verify": "Andrew: confirm the constants in a print copy of Lange's Handbook or Felder & Rousseau Table B.4.",
    },
    "monnin2005": {
        "citation": "Monnin, C.; Dubois, M. Thermodynamics of the LiOH + H2O system. J. Chem. Eng. Data 2005, 50 (4), 1109-1113. doi:10.1021/je0495482. Solubility fit: Eq 1 and Table 1 (LiOH.H2O, 255-373 K, 18 points from Pickering, Donk, Van Moeurs, Stephan & Miller, Ennan & Lapshin). Osmotic coefficient: Pitzer model Eqs 3-6, 8, Tables 3-4.",
        "url": "https://hal.science/hal-00350526v1/file/je0495482.pdf",
        "accessed": ACCESSED,
    },
    "eia-epm-5.6.a": {
        "citation": "U.S. EIA, Electric Power Monthly, Table 5.6.A, Average Price of Electricity to Ultimate Customers by End-Use Sector, by State, August 2026 and 2025 (released October 23, 2026).",
        "url": "https://www.eia.gov/electricity/monthly/epm_table_grapher.php?t=epmt_5_6_a",
        "accessed": ACCESSED,
    },
    "eia-ng-tx-ind": {
        "citation": "U.S. EIA, Texas Natural Gas Industrial Price (dollars per thousand cubic feet), monthly series N3035TX3 (released 10/30/2026).",
        "url": "https://www.eia.gov/dnav/ng/hist/n3035tx3m.htm",
        "accessed": ACCESSED,
    },
    "eia-ng-heat-content": {
        "citation": "U.S. EIA FAQ 'How do I convert natural gas prices in dollars per cubic feet to dollars per Btu?': 2025 U.S. average heat content of natural gas delivered to end users about 1,037 Btu/cf.",
        "url": "https://www.eia.gov/tools/faqs/faq.php?id=45&t=8",
        "accessed": ACCESSED,
    },
    "eia-epa-8.1": {
        "citation": "U.S. EIA, Electric Power Annual, Table 8.1, Average Operating Heat Rate for Selected Energy Sources, 2015-2025 (natural gas 2025: 7,781 Btu/kWh).",
        "url": "https://www.eia.gov/electricity/annual/html/epa_08_01.html",
        "accessed": ACCESSED,
    },
    "iupac-mw": {
        "citation": "IUPAC standard atomic weights (Li 6.94, O 15.999, H 1.008).",
        "url": "https://iupac.qmul.ac.uk/AtWt/",
        "accessed": ACCESSED,
    },
    "estimate": {
        "citation": "ESTIMATE: typical engineering value chosen by the project and not yet tied to a primary source. Shown on the site with an ESTIMATE label and adjustable with a slider.",
        "url": "",
        "accessed": ACCESSED,
    },
    "tesla-robstown": {
        "citation": "Tesla Robstown, TX lithium refinery: EnergyX blog 'Tesla's Lithium Refinery in Texas'; Spectrum News (Jan 21, 2026) 'Tesla lithium refinery in Texas is now fully operational'; Electrek. Target about 50 GWh/yr of battery capacity.",
        "url": "https://mynews13.com/fl/orlando/news/2026/01/21/tesla-lithium-refinery-in-texas-is-now-fully-operational",
        "accessed": "2026-10-23",
    },
    "us10961126": {
        "citation": "US Patent 10,961,126 B2, Process for reducing fouling in evaporators in lithium hydroxide recovery (Veolia). Lithium carbonate scaling in LiOH evaporators; MVR, TVR and multi-effect options.",
        "url": "https://patents.google.com/patent/US10961126",
        "accessed": ACCESSED,
    },
}

# --- NIST saturation table, verbatim (T_C, P_kPa, hf, hg in kJ/kg) ---
NIST_ROWS = [
    (30.0000, 4.24697, 125.734, 2555.55),
    (35.0000, 5.62902, 146.634, 2564.55),
    (40.0000, 7.38494, 167.533, 2573.51),
    (45.0000, 9.59500, 188.435, 2582.43),
    (50.0000, 12.3519, 209.342, 2591.29),
    (55.0000, 15.7621, 230.256, 2600.09),
    (60.0000, 19.9464, 251.180, 2608.83),
    (65.0000, 25.0416, 272.116, 2617.50),
    (70.0000, 31.2009, 293.065, 2626.10),
    (75.0000, 38.5954, 314.030, 2634.60),
    (80.0000, 47.4145, 335.012, 2643.02),
    (85.0000, 57.8670, 356.015, 2651.33),
    (90.0000, 70.1818, 377.039, 2659.53),
    (95.0000, 84.6085, 398.089, 2667.61),
    (100.000, 101.418, 419.166, 2675.57),
    (105.000, 120.903, 440.274, 2683.39),
    (110.000, 143.379, 461.415, 2691.06),
    (115.000, 169.182, 482.593, 2698.58),
    (120.000, 198.674, 503.812, 2705.93),
    (125.000, 232.238, 525.074, 2713.10),
    (130.000, 270.280, 546.384, 2720.08),
    (135.000, 313.229, 567.745, 2726.87),
    (140.000, 361.539, 589.162, 2733.44),
    (145.000, 415.685, 610.638, 2739.80),
    (150.000, 476.165, 632.179, 2745.93),
]

# --- Monnin & Dubois (2005) ---
SOL_A = [-39.568, 0.48784, -1.7670e-3, 2.1431e-6]          # Table 1, LiOH.H2O, m = sum a_i T^i
Q = [86.683649, 0.0848795, -8.88878e-5, 4.88096e-8, -1327.31477, -17.6460]  # Table 3 q_i (Eq 6)
PITZER = {                                                    # Table 4 (Eq 8)
    "b0": [3.689298e-1, -1.262427e-3, 7.422313e-7, -3.968190e-1],
    "b1": [-2.201838, 1.119177e-2, -1.403500e-5, 0.0],
    "Cphi": [-1.491614e-2, 2.707400e-5, 3.591966e-8, 0.0],
}
M_LIOH = 6.94 + 15.999 + 1.008          # 23.947 g/mol
M_H2O = 2 * 1.008 + 15.999              # 18.015 g/mol


def m_sat(T_K):
    return sum(a * T_K ** i for i, a in enumerate(SOL_A))


def a_phi(T_K):
    q = Q
    return q[0] + q[1] * T_K + q[2] * T_K ** 2 + q[3] * T_K ** 3 + q[4] / T_K + q[5] * math.log(T_K)


def pitzer(name, T_K):
    c = PITZER[name]
    return c[0] + c[1] * T_K + c[2] * T_K ** 2 + c[3] / (T_K - 240.0)


def phi(m, T_K):
    """Osmotic coefficient of LiOH(aq), Monnin & Dubois Eqs 3-5 (1:1 electrolyte, I = m)."""
    s = math.sqrt(m)
    f = -a_phi(T_K) * s / (1 + 1.2 * s)
    B = pitzer("b0", T_K) + pitzer("b1", T_K) * math.exp(-2 * s)
    return 1 + f + m * B + m * m * pitzer("Cphi", T_K)


def val(value, units, sourceId, estimate=False, note=""):
    return {"value": value, "units": units, "sourceId": sourceId, "estimate": estimate, "note": note}


def build():
    temps = list(range(0, 101, 5))
    sol_points, phi_points = [], []
    for t in temps:
        T = t + 273.15
        m = m_sat(T)
        sol_points.append([t, round(m * M_LIOH / 10.0, 4)])     # g LiOH / 100 g H2O
        phi_points.append([t, round(phi(m, T), 4)])

    # Steam cost (fuel only), ESTIMATE built from EIA data
    gas_usd_mcf = 2.98                       # Texas industrial, Aug 2026
    heat_content = 1.037                     # MMBtu per Mcf
    gj_per_mmbtu = 1.055056
    usd_per_gj = gas_usd_mcf / heat_content / gj_per_mmbtu
    eta_boiler = 0.85                        # ESTIMATE
    T_feedwater = 100.0                      # ESTIMATE (condensate return)
    hg_120 = 2705.93
    hf_100 = 419.166
    dh_gj_per_t = (hg_120 - hf_100) / 1000.0  # GJ per tonne of steam
    steam_cost = dh_gj_per_t / eta_boiler * usd_per_gj

    data = {
        "meta": {
            "generatedBy": "tools/build_data.py",
            "generated": ACCESSED,
            "note": "Do not edit by hand; edit tools/build_data.py and rerun. Format: 'export const DATA = ' + strict JSON.",
        },
        "sources": SOURCES,
        "molarMass": {
            "LiOH": val(round(M_LIOH, 3), "g/mol", "iupac-mw"),
            "H2O": val(round(M_H2O, 3), "g/mol", "iupac-mw"),
            "LiOH_H2O": val(round(M_LIOH + M_H2O, 3), "g/mol", "iupac-mw"),
        },
        "constants": {
            "R": val(8.314, "J/(mol K)", "iupac-mw", False, "Gas constant (CODATA 8.314462618)."),
            "Rv": val(461.5, "J/(kg K)", "iupac-mw", False, "R / M_H2O = 8.314 / 0.018015."),
            "gamma": val(1.33, "-", "estimate", True, "Heat-capacity ratio of low-pressure steam, ideal-gas approximation."),
        },
        "antoine": {
            "A": 8.07131, "B": 1730.63, "C": 233.426,
            "form": "log10(P/mmHg) = A - B/(C + T/degC); P_kPa = P_mmHg * 0.133322",
            "validRange_C": [1, 100],
            "checkedRange_C": [30, 130],
            "sourceId": "antoine-lange", "estimate": False,
            "note": "One constant set is used over the whole simulator range (30-130 C); error vs NIST is -0.38 % at 55-65 C, cancelling in the pressure ratio.",
        },
        "steamTable": {
            "columns": ["T_C", "P_kPa", "hf_kJkg", "hg_kJkg", "hfg_kJkg"],
            "rows": [[t, p, hf, hg, round(hg - hf, 3)] for (t, p, hf, hg) in NIST_ROWS],
            "sourceId": "nist-water", "estimate": False,
            "note": "Verbatim NIST values; hfg = hg - hf. Linear interpolation between rows.",
        },
        "solubility": {
            "columns": ["T_C", "s_g_per_100g_H2O"],
            "points": sol_points,
            "solidPhase": "LiOH.H2O (stable solid from the eutectic, 254.9 K, to the peritectic, 378.3 K)",
            "sourceId": "monnin2005", "estimate": False,
            "note": "Computed from Monnin & Dubois Eq 1 (fit to 18 critically selected literature points), m_sat in mol/kg converted with M_LiOH = 23.947 g/mol. Linear interpolation between points. Impurities assumed not to change solubility.",
        },
        "osmoticSat": {
            "columns": ["T_C", "phi"],
            "points": phi_points,
            "sourceId": "monnin2005", "estimate": False,
            "note": "Osmotic coefficient of SATURATED LiOH(aq), from the Monnin & Dubois Pitzer model (Eqs 3-6, 8). It enters BPE = phi * i * Kb * m. The model's only data between 273 and 373 K are at 298.15 K (plus 393-443 K isopiestic data), so 40-100 C values are model interpolation; treat as +/-0.05.",
        },
        "compressor": {
            "etaIs": val(0.75, "-", "estimate", True, "Isentropic efficiency; slider 0.60-0.85."),
            "etaMotor": val(0.95, "-", "estimate", True, "Motor/drive efficiency; slider 0.90-0.97."),
            "rMaxSingleStage": val(2.0, "-", "estimate", True, "Warn above this pressure ratio per stage (fans ~1.2-1.4, centrifugal ~1.8-2)."),
            "dT_heater": val(6, "K", "estimate", True, "Condensing-side driving force in the MVR heater."),
            "specificEnergyRange": val([20, 60], "kWh/t water", "estimate", True, "Plausibility band shown on plots."),
        },
        "evaporator": {
            "U": val(2000, "W/(m2 K)", "estimate", True, "Forced-circulation evaporator overall coefficient (Phase 2)."),
            "dTmin": val(5, "K", "estimate", True, "Minimum useful driving force per effect."),
            "Ts_C": val(120, "C", "estimate", True, "Heating steam saturation temperature (multi-effect)."),
            "Tlast_C": val(50, "C", "estimate", True, "Last-effect condenser temperature (cooling-water limited)."),
            "cpFeed": val(4.0, "kJ/(kg K)", "estimate", True, "Feed liquor heat capacity; only used if feed is subcooled."),
        },
        "prices": {
            "electricity": val(0.0721, "$/kWh", "eia-epm-5.6.a", False, "Texas industrial, August 2026 (7.21 c/kWh; August 2025: 6.42). U.S. industrial August 2026: 9.64."),
            "gasTexasIndustrial": val(gas_usd_mcf, "$/Mcf", "eia-ng-tx-ind", False, "August 2026. Prior 12 months ranged 2.84-6.33 $/Mcf."),
            "gasHeatContent": val(heat_content, "MMBtu/Mcf", "eia-ng-heat-content"),
            "boilerEfficiency": val(eta_boiler, "-", "estimate", True, "Gas-fired boiler, fuel to steam."),
            "feedwaterT_C": val(T_feedwater, "C", "estimate", True, "Boiler feedwater (condensate return) temperature."),
            "steam": val(round(steam_cost, 2), "$/t steam", "estimate", True,
                         "FUEL-ONLY steam cost = gas $/GJ x (hg(120 C) - hf(100 C)) / eta_boiler "
                         f"= {usd_per_gj:.3f} $/GJ x {dh_gj_per_t:.4f} GJ/t / {eta_boiler} = {steam_cost:.2f} $/t. "
                         "Excludes boiler capital, water treatment, labor; real steam costs more."),
            "gridHeatRate": val(7781, "Btu/kWh", "eia-epa-8.1", False, "Natural gas plants, 2025: 2.28 kWh of fuel per kWh of electricity."),
        },
        "feed": {
            "xF": val(0.060, "mass frac LiOH", "estimate", True, "Purified liquor to the crystallizer; no published figure found yet."),
            "zF": val(0.0010, "mass frac NaOH-eq", "estimate", True, "Na impurity in feed."),
            "epsilon": val(0.03, "kg liquor / kg crystals", "estimate", True, "Adhering mother liquor after centrifuge and wash."),
        },
        "industry": {
            "teslaCapacity": val(50, "GWh/yr battery capacity", "tesla-robstown"),
            "lceToHydrate": val(round(2 * (M_LIOH + M_H2O) / 73.89, 4), "t LiOH.H2O per t LCE", "iupac-mw", False, "2 x 41.962 / 73.89 (Li2CO3)."),
            "lceIntensity": val(None, "kg LCE / kWh", "estimate", True, "SOURCE NEEDED (IEA Global Critical Minerals Outlook). Not used until sourced."),
        },
        "spec": {
            "naMax_ppm": val(None, "ppm Na", "estimate", True, "SOURCE NEEDED: GB/T 26008-2020 Table 1 or a producer data sheet. Spec line hidden until sourced."),
        },
    }
    return data


def main():
    data = build()
    out = Path(__file__).resolve().parent.parent / "site" / "js" / "data.js"
    text = ("// GENERATED by tools/build_data.py. Do not edit by hand.\n"
            "// Every value cites DATA.sources[sourceId]; estimate:true means flagged ESTIMATE on the site.\n"
            "export const DATA = " + json.dumps(data, indent=2) + ";\n")
    out.write_text(text)
    print(f"wrote {out}  ({len(text)} bytes)")
    print("steam $/t", data["prices"]["steam"]["value"])
    print("s(60C)", dict(map(tuple, data["solubility"]["points"]))[60], "phi(60C)", dict(map(tuple, data["osmoticSat"]["points"]))[60])


if __name__ == "__main__":
    main()
