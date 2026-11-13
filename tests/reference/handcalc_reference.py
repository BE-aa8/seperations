#!/usr/bin/env python3
"""Independent reference implementation of the hand-calc case (plan-v2-final.md, Section 7).

Reads site/js/data.js, computes every expected value UNROUNDED, and writes
tests/handcalc-expected.json. The Node test (tests/handcalc.test.mjs) checks
each build's js/model.js against that file.

Written before either build exists, so neither build model influences the test.
Standard library only. Run:  python3 -I tests/reference/handcalc_reference.py
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
raw = (ROOT / "site/js/data.js").read_text()
DATA = json.loads(raw[raw.index("export const DATA = ") + len("export const DATA = "):].rstrip().rstrip(";"))

M_LIOH = DATA["molarMass"]["LiOH"]["value"]
M_H2O = DATA["molarMass"]["H2O"]["value"]
M_HYD = DATA["molarMass"]["LiOH_H2O"]["value"]
F_LI = M_LIOH / M_HYD                      # LiOH mass fraction of the hydrate
R = DATA["constants"]["R"]["value"]
RV = DATA["constants"]["Rv"]["value"]
AN = DATA["antoine"]


def interp(points, x):
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= x <= x1:
            return y0 + (x - x0) / (x1 - x0) * (y1 - y0)
    raise ValueError(f"{x} outside table")


def psat(T_C):
    return 10 ** (AN["A"] - AN["B"] / (AN["C"] + T_C)) * 0.133322


def hfg(T_C):
    return interp([(r[0], r[4]) for r in DATA["steamTable"]["rows"]], T_C)


def solubility(T_C):
    return interp(DATA["solubility"]["points"], T_C)


def phi_sat(T_C):
    return interp(DATA["osmoticSat"]["points"], T_C)


DEFAULT_INPUTS = {
    "F": 10000, "xF": DATA["feed"]["xF"]["value"], "zF": DATA["feed"]["zF"]["value"],
    "T_C": 60, "purgeRatio": 0.05, "epsilon": DATA["feed"]["epsilon"]["value"],
    "i": 2, "useOsmotic": True, "activityFactor": 1.0,
    "dT_heater": DATA["compressor"]["dT_heater"]["value"],
    "etaIs": DATA["compressor"]["etaIs"]["value"], "etaMotor": DATA["compressor"]["etaMotor"]["value"],
    "gamma": DATA["constants"]["gamma"]["value"],
    "Ts_C": DATA["evaporator"]["Ts_C"]["value"], "Tlast_C": DATA["evaporator"]["Tlast_C"]["value"],
    "dTmin": DATA["evaporator"]["dTmin"]["value"], "N": 3,
    "ce": DATA["prices"]["electricity"]["value"], "cs": DATA["prices"]["steam"]["value"],
    "hours": 8000,
}


def simulate(inp):
    p = {**DEFAULT_INPUTS, **inp}
    T = p["T_C"]
    s = solubility(T)
    m = (s / 100) / (M_LIOH / 1000)
    Kb = R * (T + 273.15) ** 2 * (M_H2O / 1000) / (hfg(T) * 1000 * M_H2O / 1000)
    a = phi_sat(T) if p["useOsmotic"] else p["activityFactor"]
    BPE = a * p["i"] * Kb * m

    # mass balance (M1-M8)
    F, xF, zF, pr = p["F"], p["xF"], p["zF"], p["purgeRatio"]
    P = pr * F
    zML = zF / pr
    xL = (1 - zML) * s / (100 + s)
    C = (F * xF - P * xL) / F_LI
    V = F * (1 - xF - zF) - (1 - F_LI) * C - P * (1 - xL - zML)
    mass = {
        "C": C, "V": V, "P": P, "xL": xL, "zML": zML,
        "liYield": F_LI * C / (F * xF),
        "productImpurity_ppm": p["epsilon"] * zML / (1 + p["epsilon"]) * 1e6,
        "closureError": V + C + P - F,
        "feasible": C >= 0 and V >= 0 and xL > 0,
    }

    Tv = T - BPE
    lamV = hfg(Tv)
    Q = V * lamV / 3600

    # MVR (C1-C7)
    g = p["gamma"]
    k = (g - 1) / g
    Tc = T + p["dT_heater"]
    P1, P2 = psat(Tv), psat(Tc)
    r = P2 / P1
    T1 = T + 273.15
    ws = g / (g - 1) * RV * T1 * (r ** k - 1) / 1000
    w = ws / p["etaIs"]
    mvr = {
        "Tv_C": Tv, "P1": P1, "Tc_C": Tc, "P2": P2, "r": r, "lift": Tc - Tv,
        "ws": ws, "w": w, "T2_C": T1 * (1 + (r ** k - 1) / p["etaIs"]) - 273.15,
        "Wshaft_kW": V * w / 3600, "Welec_kW": V * w / 3600 / p["etaMotor"],
        "kWh_per_t": w / (3.6 * p["etaMotor"]),
        "COP": lamV / w, "COP_carnot": (Tc + 273.15) / (Tc - Tv),
    }

    # multi-effect (E2-E4) and economics ($1-$4)
    E1 = hfg(p["Ts_C"]) / lamV
    maxN = math.floor((p["Ts_C"] - p["Tlast_C"]) / (BPE + p["dTmin"]))
    effects, econ = {}, {}
    for N in sorted({1, 3, 5, p["N"]}):
        econ_N = N * E1
        dT = (p["Ts_C"] - p["Tlast_C"] - N * BPE) / N
        effects[str(N)] = {"S": V / econ_N, "economy": econ_N, "dT_per_effect": dT,
                           "feasible": dT >= p["dTmin"], "maxFeasibleN": maxN}
        c_mvr = p["ce"] * mvr["kWh_per_t"]
        c_me = p["cs"] / econ_N
        econ[str(N)] = {"cost_MVR_per_t": c_mvr, "cost_ME_per_t": c_me,
                        "ce_crossover": p["cs"] / (econ_N * mvr["kWh_per_t"]),
                        "annual_MVR": c_mvr * V * p["hours"] / 1000,
                        "annual_ME": c_me * V * p["hours"] / 1000}
    return {"s": s, "m": m, "Kb": Kb, "phi": a, "BPE": BPE, "Q_kW": Q, "lambdaV": lamV,
            "mass": mass, "mvr": mvr, "effects": effects, "econ": econ}


def flatten(d, prefix=""):
    out = {}
    for k, v in d.items():
        key = f"{prefix}.{k}" if prefix else k
        if isinstance(v, dict):
            out.update(flatten(v, key))
        else:
            out[key] = v
    return out


def main():
    base = simulate({})
    ideal = simulate({"useOsmotic": False, "activityFactor": 1.0})
    expected = {
        "_comment": "Generated by tests/reference/handcalc_reference.py from site/js/data.js. Unrounded. Tolerance +/-0.5 % (closureError: absolute 1e-6).",
        "inputs": DEFAULT_INPUTS,
        "base": {k: v for k, v in flatten(base).items() if not isinstance(v, bool)},
        "baseFlags": {k: v for k, v in flatten(base).items() if isinstance(v, bool)},
        "idealBPE": {"BPE": ideal["BPE"], "mvr.kWh_per_t": ideal["mvr"]["kWh_per_t"]},
        "infeasibleMass": {"inputs": {"xF": 0.02, "purgeRatio": 0.2}, "expect": {"mass.feasible": False}},
        "infeasibleEffects": {"inputs": {"N": 8}, "expect": {"effects.8.feasible": False,
                                                              "effects.8.maxFeasibleN": base["effects"]["3"]["maxFeasibleN"]}},
    }
    # sanity: the infeasible case really is infeasible in the reference
    assert simulate(expected["infeasibleMass"]["inputs"])["mass"]["feasible"] is False
    out = ROOT / "tests/handcalc-expected.json"
    out.write_text(json.dumps(expected, indent=2) + "\n")
    b = flatten(base)
    for k in ["s", "m", "Kb", "phi", "BPE", "mass.C", "mass.V", "mass.liYield", "mass.productImpurity_ppm",
              "Q_kW", "mvr.P1", "mvr.P2", "mvr.r", "mvr.lift", "mvr.ws", "mvr.w", "mvr.T2_C", "mvr.Welec_kW",
              "mvr.kWh_per_t", "mvr.COP", "mvr.COP_carnot", "effects.1.economy", "effects.3.economy",
              "effects.5.economy", "effects.5.dT_per_effect", "effects.3.maxFeasibleN",
              "econ.1.cost_ME_per_t", "econ.3.cost_ME_per_t", "econ.5.cost_ME_per_t", "econ.3.cost_MVR_per_t",
              "econ.3.ce_crossover", "econ.5.ce_crossover", "econ.3.annual_MVR", "econ.3.annual_ME"]:
        print(f"{k:28s} {b[k]}")
    print("ideal BPE", ideal["BPE"], "ideal kWh/t", ideal["mvr"]["kWh_per_t"])
    print("wrote", out)


if __name__ == "__main__":
    main()
