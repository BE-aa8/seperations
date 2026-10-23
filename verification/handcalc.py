"""Independent reference calculation for the MVR Crystallizer Explorer (plan v2, section 3).

Neither build (Claude's site, Muse's molab notebook) imports this file. It reads the same
site/data/*.json files the builds use and writes the expected answers they are tested against:
  verification/handcalc.json  - the hand-calc case
  verification/vectors.json   - 6 extra "what if" cases

Course-level methods only: steam-table interpolation, ideal-gas compressor work, ebullioscopic BPE.
The `iapws` package is used ONLY for the steam-table cross-check of compressor work (optional).

Run:  python3 verification/handcalc.py
"""
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data"
OUT = Path(__file__).resolve().parent


def load(name):
    return json.loads((DATA / f"{name}.json").read_text())


STEAM = load("steam")["rows"]
SOL = load("solubility")["selected"]
PROPS = load("properties")
EQUIP = load("equipment")
PRICES = load("prices")
PROC = load("process")

R_H = PROPS["MW_LiOH"]["value"] / PROPS["MW_LiOH_H2O"]["value"]  # kg LiOH per kg hydrate
MW_LIOH = PROPS["MW_LiOH"]["value"] / 1000                          # kg/mol
NU = PROPS["nu_LiOH"]["value"]
R = PROPS["R"]["value"]                                              # J/(mol K)


# ---------- steam table (linear in T; ln P for pressure) ----------
def steam(t_c, key):
    """Saturated property at t_c [C]. key in steam.json rows."""
    lo = max(0, min(len(STEAM) - 2, int(math.floor(t_c)) - 40))
    a, b = STEAM[lo], STEAM[lo + 1]
    f = (t_c - a["T_C"]) / (b["T_C"] - a["T_C"])
    if key == "P_kPa":
        return math.exp(math.log(a[key]) + f * (math.log(b[key]) - math.log(a[key])))
    return a[key] + f * (b[key] - a[key])


def t_sat(p_kpa):
    """Saturation temperature [C] at p_kpa, inverse of ln P interpolation."""
    lnp = math.log(p_kpa)
    for a, b in zip(STEAM, STEAM[1:]):
        if math.log(a["P_kPa"]) <= lnp <= math.log(b["P_kPa"]):
            f = (lnp - math.log(a["P_kPa"])) / (math.log(b["P_kPa"]) - math.log(a["P_kPa"]))
            return a["T_C"] + f
    raise ValueError(f"pressure {p_kpa} kPa outside steam table")


# ---------- solubility ----------
def s_sat(t_c):
    """Solubility [g LiOH / 100 g water], linear between selected points."""
    pts = SOL
    if t_c >= pts[-1]["T_C"]:
        a, b = pts[-2], pts[-1]
    else:
        a, b = next((p, q) for p, q in zip(pts, pts[1:]) if t_c <= q["T_C"])
    f = (t_c - a["T_C"]) / (b["T_C"] - a["T_C"])
    return a["s_g_per_100g_water"] + f * (b["s_g_per_100g_water"] - a["s_g_per_100g_water"])


def x_sat(t_c):
    s = s_sat(t_c)
    return s / (100 + s)


# ---------- BPE ----------
def kb(t_c):
    """Ebullioscopic constant K_b = R T^2 / lambda  [K kg/mol]  (lambda in J/kg)."""
    t = t_c + 273.15
    return R * t * t / (steam(t_c, "lambda_kJkg") * 1000)


def molality(x):
    return x / ((1 - x) * MW_LIOH)


def boiling(p_kpa, phi):
    """Fixed point: T_boil = T_sat + BPE(x_sat(T_boil)). Returns dict."""
    ts = t_sat(p_kpa)
    t = ts
    for it in range(1, 21):
        x = x_sat(t)
        bpe = kb(ts) * NU * phi * molality(x)
        t_new = ts + bpe
        if abs(t_new - t) < 0.01:
            t = t_new
            break
        t = t_new
    return {"T_sat_C": ts, "x_sat": x, "m_molkg": molality(x), "Kb": kb(ts), "BPE_K": bpe,
            "T_boil_C": t, "iterations": it}


# ---------- full case ----------
def run(case):
    F, xF, TF = case["F_kgh"], case["xF"], case["TF_C"]
    P1, phi, dT, eta, k = case["P1_kPa"], case["phi"], case["dT_heater_K"], case["eta"], case["k"]
    cp, purge = case["cp_feed"], case["purge_frac"]
    out = {}

    b = boiling(P1, phi)
    out.update(b)
    Tb, Ts, x = b["T_boil_C"], b["T_sat_C"], b["x_sat"]

    # mass balance
    Pg = purge * F
    C = (F * xF - Pg * x) / R_H
    V = F - Pg - C
    out.update(purge_kgh=Pg, C_kgh=C, V_kgh=V, yield_Li=R_H * C / (F * xF), feasible=C > 0)

    # evaporator duty (enthalpy basis; vapor leaves superheated by BPE)
    h_v1 = steam(Ts, "h_g_kJkg") + steam(Ts, "cp_g_kJkgK") * b["BPE_K"]
    Q = (F * cp * (Tb - TF) + V * (h_v1 - steam(Tb, "h_f_kJkg"))) / 3600  # kW
    Q_preheat = F * cp * (Tb - TF) / 3600
    out.update(h_v1_kJkg=h_v1, Q_kW=Q, Q_preheat_kW=Q_preheat)

    # heat of solution magnitude check
    dH = PROPS["dH_solution_LiOH_H2O"]["value"] / (PROPS["MW_LiOH_H2O"]["value"] / 1000)  # kJ/kg
    out["Q_cryst_pct_of_Q"] = 100 * dH * C / 3600 / Q

    # single effect and N effects
    T_steam = EQUIP["multi_effect_T_steam_C"]["value"]
    lam_s = steam(T_steam, "lambda_kJkg")
    S1 = Q * 3600 / lam_s
    E1 = V / S1
    out.update(lambda_s=lam_s, S1_kgh=S1, E1=E1)
    T_last = EQUIP["multi_effect_T_last_C"]["value"]
    dTmin = PROPS["dT_min_effect"]["value"]
    effects = {}
    for N in range(1, 7):
        xs = [xF + (x - xF) * j / N for j in range(1, N + 1)]
        sum_bpe = sum(kb((T_steam + T_last) / 2) * NU * phi * molality(xj) for xj in xs)
        dT_eff = (T_steam - T_last - sum_bpe) / N
        effects[N] = {"E_N": N * E1, "sum_BPE_K": sum_bpe, "dT_per_effect_K": dT_eff,
                      "feasible": dT_eff >= dTmin}
    out["effects"] = effects

    # MVR compressor
    Tc = Tb + dT
    P2 = steam(Tc, "P_kPa")
    CR = P2 / P1
    T1 = Tb + 273.15
    ws = k / (k - 1) * PROPS["R_steam"]["value"] * T1 * (CR ** ((k - 1) / k) - 1)
    w = ws / eta
    W = V / 3600 * w
    e = w / 3.6
    out.update(T_cond_C=Tc, P2_kPa=P2, CR=CR, lift_K=Tc - Ts, ws_kJkg=ws, w_kJkg=w, W_kW=W,
               e_kWh_per_t_water=e, e_kWh_per_t_product=e * V / C if C > 0 else None)

    # heat closure
    h_out = h_v1 + w
    Q_avail = V / 3600 * (h_out - steam(Tc, "h_f_kJkg"))
    makeup = max(0.0, Q - Q_avail) * 3600 / lam_s
    out.update(h_out_kJkg=h_out, superheat_delivered_kJkg=h_out - steam(Tc, "h_g_kJkg"),
               Q_avail_kW=Q_avail, makeup_steam_kgh=makeup, makeup_pct_of_V=100 * makeup / V)
    out["COP"] = Q_avail / W
    out["COP_carnot"] = (Tc + 273.15) / (Tc - Tb)
    out["heater_area_m2"] = Q * 1000 / (PROPS["U_forced_circulation"]["value"] * dT)
    out["suction_m3s"] = V / 3600 * steam(Ts, "v_g_m3kg") * (T1 / (Ts + 273.15))

    # cooling comparison: evaporate to saturation at Tb, then cool to 25 C
    sb = s_sat(Tb) / 100
    water_left = F * xF / sb
    dLiOH = water_left * (sb - s_sat(25) / 100)
    out.update(cool_water_left_kgh=water_left, cool_hydrate_kgh=dLiOH / R_H,
               cool_yield=dLiOH / (F * xF))

    # impurities (decoupled approximation, dry product basis)
    eps = case["epsilon"]
    for ion, w_ppm in (("Na", case["Na_ppm"]), ("K", case["K_ppm"])):
        w_ml = F * w_ppm / (Pg + eps * C) if C > 0 else float("inf")
        out[f"{ion}_ML_ppm"] = w_ml
        out[f"{ion}_product_ppm"] = eps * w_ml

    # operating costs
    p_el = case["p_el"]
    p_steam = case["p_gas_Mcf"] / PRICES["gas_heat_content"]["value"] * \
        (PRICES["steam_dh_kJkg"]["value"] * 1000 / 1.055056e6) / PRICES["boiler_efficiency"]["value"]
    out["p_steam_per_t"] = p_steam
    out["cost_MVR_per_t_water"] = e * p_el + makeup / V * p_steam
    out["cost_N_per_t_water"] = {N: p_steam / effects[N]["E_N"] for N in effects}

    # purge needed to meet the Na spec (product ppm falls as purge rises; bisection)
    spec = PROPS["battery_spec"]["Na_max_ppm"]
    if case.get("solve_purge", True):
        lo, hi = 0.001, 0.5
        for _ in range(60):
            mid = (lo + hi) / 2
            r = run({**case, "purge_frac": mid, "solve_purge": False})
            lo, hi = (mid, hi) if r["Na_product_ppm"] > spec else (lo, mid)
        out["purge_for_Na_spec"] = hi
        out["yield_at_Na_spec"] = run({**case, "purge_frac": hi, "solve_purge": False})["yield_Li"]
    return out


def steam_table_check(case, res):
    """Compare ideal-gas w_s with h2s - h1 from IAPWS-IF97 (needs `pip install iapws`)."""
    try:
        from iapws import IAPWS97
    except ImportError:
        return None
    s1 = IAPWS97(P=case["P1_kPa"] / 1000, T=res["T_boil_C"] + 273.15)
    s2 = IAPWS97(P=res["P2_kPa"] / 1000, s=s1.s)
    ws_tab = s2.h - s1.h
    vals = {"h1_kJkg": s1.h, "h2s_kJkg": s2.h, "ws_table_kJkg": ws_tab,
            "ws_ideal_gas_kJkg": res["ws_kJkg"],
            "pct_diff": 100 * (res["ws_kJkg"] - ws_tab) / ws_tab,
            "h_v1_table_vs_cp_estimate_kJkg": s1.h - res["h_v1_kJkg"]}
    return {k: round(float(v), 4) for k, v in vals.items()}


BASE = {
    "F_kgh": 10000, "xF": PROC["feed_LiOH_wt_frac"]["value"], "TF_C": 80,
    "P1_kPa": 101.325, "phi": PROPS["phi_osmotic"]["value"],
    "dT_heater_K": EQUIP["heater_dT"]["value"], "eta": EQUIP["eta_isentropic"]["value"],
    "k": PROPS["k_steam"]["value"], "cp_feed": PROPS["cp_feed"]["value"], "purge_frac": 0.05,
    "epsilon": PROPS["epsilon_retained_liquor"]["value"],
    "Na_ppm": PROC["feed_Na_ppm"]["value"], "K_ppm": PROC["feed_K_ppm"]["value"],
    "p_el": PRICES["electricity_TX_industrial"]["value"],
    "p_gas_Mcf": PRICES["gas_TX_industrial"]["value"],
}

VECTORS = {
    "vacuum_0p2bar": {"P1_kPa": 20.0},
    "dT_3K": {"dT_heater_K": 3},
    "dT_15K": {"dT_heater_K": 15},
    "purge_1pct": {"purge_frac": 0.01},
    "dilute_feed_3pct": {"xF": 0.03},
    "low_eta_0p65": {"eta": 0.65},
}

KEYS = ["T_boil_C", "BPE_K", "x_sat", "C_kgh", "V_kgh", "yield_Li", "Q_kW", "E1", "CR",
        "ws_kJkg", "w_kJkg", "W_kW", "e_kWh_per_t_water", "Q_avail_kW", "makeup_steam_kgh",
        "COP", "heater_area_m2", "Na_product_ppm", "cost_MVR_per_t_water"]


def self_checks(res):
    # limiting cases and units
    assert abs(kb(100) - 0.512) < 0.003, kb(100)
    assert abs(kb(60) - 0.39) < 0.01, kb(60)
    z = run({**BASE, "phi": 1e-9, "dT_heater_K": 1e-9})
    assert z["ws_kJkg"] < 0.01, "zero lift must give zero work"
    assert abs(res["effects"][1]["E_N"] - res["E1"]) < 1e-12, "N=1 must give E1"
    assert abs(res["e_kWh_per_t_water"] - res["w_kJkg"] / 3.6) < 1e-9, "kJ/kg -> kWh/t"
    # balances close
    F, xF = BASE["F_kgh"], BASE["xF"]
    assert abs(F - res["V_kgh"] - res["purge_kgh"] - res["C_kgh"]) < 1e-6
    assert abs(F * xF - res["purge_kgh"] * res["x_sat"] - R_H * res["C_kgh"]) < 1e-6
    # every source_id resolves
    srcs = load("sources")["sources"]
    for name in ("solubility", "properties", "equipment", "prices", "process", "steam"):
        text = (DATA / f"{name}.json").read_text()
        for sid in set(__import__("re").findall(r'"(?:check_)?source_id":\s*"([^"]+)"', text)):
            assert sid in srcs, f"{name}.json: unknown source_id {sid}"


def rounded(d):
    out = {}
    for k in KEYS:
        out[k] = round(d[k], 6)
    return out


def main():
    res = run(BASE)
    self_checks(res)
    check = steam_table_check(BASE, res)
    hand = {
        "meta": {"tolerance_rel": 0.005, "generated_by": "verification/handcalc.py",
                 "note": "Expected outputs for both builds. Units: kg/h, kW, kJ/kg, kWh/t, $/t, ppm, C, K."},
        "inputs": BASE,
        "outputs": rounded(res),
        "effects": {str(n): {k: round(v, 6) if isinstance(v, float) else v for k, v in e.items()}
                    for n, e in res["effects"].items()},
        "extra": {k: round(res[k], 6) for k in
                  ("T_sat_C", "m_molkg", "Kb", "iterations", "purge_kgh", "T_cond_C", "P2_kPa",
                   "lift_K", "h_v1_kJkg", "h_out_kJkg", "superheat_delivered_kJkg",
                   "makeup_pct_of_V", "COP_carnot", "suction_m3s", "Q_preheat_kW",
                   "Q_cryst_pct_of_Q", "e_kWh_per_t_product", "cool_water_left_kgh",
                   "cool_hydrate_kgh", "cool_yield", "Na_ML_ppm", "K_ML_ppm", "K_product_ppm",
                   "p_steam_per_t", "lambda_s", "S1_kgh", "purge_for_Na_spec",
                   "yield_at_Na_spec")},
        "cost_N_per_t_water": {str(n): round(v, 6) for n, v in res["cost_N_per_t_water"].items()},
        "steam_table_check": check,
    }
    (OUT / "handcalc.json").write_text(json.dumps(hand, indent=1))
    vecs = {name: {"inputs_override": ov, "outputs": rounded(run({**BASE, **ov}))}
            for name, ov in VECTORS.items()}
    vecs["meta"] = {"tolerance_rel": 0.005, "base": "handcalc.json inputs"}
    (OUT / "vectors.json").write_text(json.dumps(vecs, indent=1))

    for k in KEYS:
        print(f"{k:24s} {res[k]:12.4f}")
    print("effects:", {n: (round(e['E_N'], 3), round(e['dT_per_effect_K'], 2), e['feasible'])
                       for n, e in res["effects"].items()})
    for k in hand["extra"]:
        print(f"  {k:28s} {hand['extra'][k]}")
    print("cost_N:", hand["cost_N_per_t_water"])
    print("steam-table check:", check)
    for name, v in vecs.items():
        if name != "meta":
            o = v["outputs"]
            print(f"{name:18s} Tb={o['T_boil_C']:.2f} CR={o['CR']:.3f} e={o['e_kWh_per_t_water']:.2f} "
                  f"C={o['C_kgh']:.1f} makeup={o['makeup_steam_kgh']:.1f}")


if __name__ == "__main__":
    main()
