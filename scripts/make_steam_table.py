"""Generate site/data/steam.json: saturated-steam table at 1 C spacing, 40-150 C.

Uses the IAPWS-IF97 industrial formulation via the `iapws` Python package
(pip install iapws==1.5.5). Both builds (site and molab notebook) read this one
file so they interpolate identical numbers.

Run:  python3 scripts/make_steam_table.py
"""
import json
from pathlib import Path

from iapws import IAPWS97

OUT = Path(__file__).resolve().parent.parent / "site" / "data" / "steam.json"

# Published steam-table values used as an independent spot check
# (Cengel & Boles, Thermodynamics, Table A-4, saturated water by temperature).
CHECKS = {  # T_C: (P_kPa, h_f, h_g)
    60: (19.947, 251.18, 2608.8),
    80: (47.416, 335.02, 2643.0),
    100: (101.42, 419.17, 2675.6),
    120: (198.67, 503.81, 2706.0),
    150: (476.16, 632.18, 2745.9),
}


def row(t_c):
    liq = IAPWS97(T=t_c + 273.15, x=0)
    vap = IAPWS97(T=t_c + 273.15, x=1)
    return {
        "T_C": t_c,
        "P_kPa": round(liq.P * 1000, 4),
        "h_f_kJkg": round(liq.h, 3),
        "h_g_kJkg": round(vap.h, 3),
        "lambda_kJkg": round(vap.h - liq.h, 3),
        "v_g_m3kg": round(vap.v, 5),
        "s_g_kJkgK": round(vap.s, 5),
        "cp_g_kJkgK": round(vap.cp, 4),
    }


def main():
    rows = [row(t) for t in range(40, 151)]
    checks = []
    for t, (p, hf, hg) in CHECKS.items():
        r = rows[t - 40]
        checks.append({
            "T_C": t,
            "P_pct_diff": round(100 * (r["P_kPa"] - p) / p, 3),
            "h_f_pct_diff": round(100 * (r["h_f_kJkg"] - hf) / hf, 3),
            "h_g_pct_diff": round(100 * (r["h_g_kJkg"] - hg) / hg, 3),
        })
    worst = max(abs(v) for c in checks for k, v in c.items() if k != "T_C")
    assert worst < 0.1, f"steam table disagrees with published values by {worst}%"
    data = {
        "meta": {
            "description": "Saturated water/steam properties, 1 C spacing",
            "source_id": "iapws97",
            "check_source_id": "cengel_A4",
            "interpolation": "linear in T for h, lambda, v; linear in ln(P) for P_sat",
            "spot_checks": checks,
            "units": {"T_C": "C", "P_kPa": "kPa", "h_f_kJkg": "kJ/kg", "h_g_kJkg": "kJ/kg",
                      "lambda_kJkg": "kJ/kg", "v_g_m3kg": "m3/kg", "s_g_kJkgK": "kJ/(kg K)",
                      "cp_g_kJkgK": "kJ/(kg K), saturated vapor"},
        },
        "rows": rows,
    }
    OUT.write_text(json.dumps(data, indent=1))
    print(f"wrote {OUT} ({len(rows)} rows); worst spot-check diff {worst}%")


if __name__ == "__main__":
    main()
