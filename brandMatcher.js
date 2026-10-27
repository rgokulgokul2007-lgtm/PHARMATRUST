/**
 * ============================================================================
 * PharmaTrust - AI-Powered Pharmaceutical Brand Matching Engine
 * File: /brandMatcher.js
 * ============================================================================
 * Implements strict clinical substitution rules required for bioequivalence:
 * 1. Active Ingredients:
 *    - Must match identical chemical active molecules (e.g. Paracetamol === Paracetamol).
 *    - Rejects any mismatch.
 * 2. Dosage Strength:
 *    - Must match exact milligram / microgram strength (e.g. 500mg === 500mg).
 *    - Rejects incompatible strengths (e.g. 650mg vs 500mg) due to dosing risk.
 * 3. Dosage Form:
 *    - Must match delivery route / formulation (e.g. Tablet === Tablet).
 *    - Rejects mismatched formulations (e.g. Tablet vs Syrup).
 * 4. Price Savings Delta:
 *    - Calculates absolute savings in INR (Requested MRP - Substitute MRP).
 *    - Calculates percentage cost savings for the patient.
 * 5. Out-of-Stock Alternative Traversal:
 *    - When a scanned/requested medication is out of stock, traverses database
 *      to find the optimal in-stock bioequivalent alternative.
 * ============================================================================
 */

/**
 * Normalizes active ingredient names for clinical comparison
 * Strips dosages if comparing active molecules, removes punctuation, sorts.
 */
export function normalizeActiveIngredients(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw)
    ? raw
    : String(raw)
        .split(/[+,/]/)
        .map((s) => s.trim());

  return list
    .map((item) => {
      let str = String(item).trim().toLowerCase();
      // Normalize common synonyms
      str = str.replace(/\bacetaminophen\b/g, "paracetamol");
      str = str.replace(/\bclavulanate potassium\b/g, "clavulanic acid");
      str = str.replace(/\bclavulanate\b/g, "clavulanic acid");
      // Remove specific milligram concentrations inside the ingredient string for chemical comparison
      str = str.replace(/\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|%)\b/gi, "").trim();
      return str;
    })
    .filter(Boolean)
    .sort();
}

/**
 * Extracts normalized strength string (e.g. "500mg", "625mg", "20mg")
 */
export function normalizeStrength(strength, fallbackName = "") {
  let s = strength ? String(strength).trim().toLowerCase() : "";
  if (!s && fallbackName) {
    const match = fallbackName.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)\b/i);
    if (match) s = match[0].toLowerCase();
  }
  return s.replace(/\s+/g, "");
}

/**
 * Normalizes dosage form (Tablet, Capsule, Syrup, Suspension, Injection)
 */
export function normalizeDosageForm(form, fallbackName = "") {
  let f = form ? String(form).trim().toLowerCase() : "";
  if (!f && fallbackName) {
    const fn = fallbackName.toLowerCase();
    if (fn.includes("tablet") || fn.includes("tab")) f = "tablet";
    else if (fn.includes("capsule") || fn.includes("cap")) f = "capsule";
    else if (fn.includes("syrup")) f = "syrup";
    else if (fn.includes("suspension") || fn.includes("susp")) f = "suspension";
    else if (fn.includes("injection") || fn.includes("inj")) f = "injection";
  }
  if (f.includes("tablet") || f.includes("tab")) return "tablet";
  if (f.includes("capsule") || f.includes("cap")) return "capsule";
  if (f.includes("syrup") || f.includes("liquid")) return "syrup";
  if (f.includes("suspension") || f.includes("susp")) return "suspension";
  if (f.includes("injection") || f.includes("inj") || f.includes("vial")) return "injection";
  return f || "tablet";
}

/**
 * Price database lookup for MRP in INR if not directly present on record
 */
export const DEFAULT_MEDICINE_PRICES = {
  "crocin": 32.50,
  "calpol": 28.00,
  "pacimol": 19.50,
  "dolo": 34.00,
  "augmentin": 215.00,
  "moxikind-cv": 148.00,
  "pantocid": 142.00,
  "pan-40": 135.00,
  "azithral": 128.00,
  "zithromax": 190.00,
  "allegra": 185.00,
  "fexova": 120.00,
  "montair-lc": 198.00,
  "telekast-l": 165.00,
  "cetirizine": 24.00,
  "zyrtec": 55.00
};

/**
 * Resolves medicine price in INR
 */
export function resolveMedicinePrice(med) {
  if (!med) return 30.00;
  if (typeof med.mrp === "number" && med.mrp > 0) return med.mrp;
  if (typeof med.price === "number" && med.price > 0) return med.price;
  if (typeof med.mrp_inr === "number" && med.mrp_inr > 0) return med.mrp_inr;

  const nameKey = (med.brandName || med.brand_name || med.medicine_name || "").toLowerCase();
  for (const [key, val] of Object.entries(DEFAULT_MEDICINE_PRICES)) {
    if (nameKey.includes(key)) {
      return val;
    }
  }
  return 35.00;
}

/**
 * Strict Bioequivalence Evaluation Engine
 * Validates:
 * 1. Active Ingredients
 * 2. Strength
 * 3. Dosage Form
 *
 * Returns detailed diagnostic report with rejection reason or 100% bioequivalent approval.
 */
export function evaluateBioequivalence(requestedMed, candidateMed) {
  if (!requestedMed || !candidateMed) {
    return {
      isMatch: false,
      matchScore: 0,
      status: "INVALID_RECORD",
      rejectionReason: "Missing or invalid medication record provided.",
      activeIngredientsMatch: false,
      strengthMatch: false,
      dosageFormMatch: false,
      reqPrice: 0,
      candPrice: 0,
      savingsDelta: 0,
      savingsPercent: 0
    };
  }

  // 1. Active Ingredients comparison
  const reqRawIng = requestedMed.activeIngredients || requestedMed.active_salt || requestedMed.genericName;
  const candRawIng = candidateMed.activeIngredients || candidateMed.active_salt || candidateMed.genericName;

  const reqIngredients = normalizeActiveIngredients(reqRawIng);
  const candIngredients = normalizeActiveIngredients(candRawIng);

  const activeIngredientsMatch =
    reqIngredients.length > 0 &&
    reqIngredients.length === candIngredients.length &&
    reqIngredients.every((ing, idx) => ing === candIngredients[idx]);

  // 2. Strength comparison
  const reqStrength = normalizeStrength(
    requestedMed.strength,
    requestedMed.medicine_name || requestedMed.brandName
  );
  const candStrength = normalizeStrength(
    candidateMed.strength,
    candidateMed.medicine_name || candidateMed.brandName
  );
  const strengthMatch = Boolean(reqStrength && candStrength && reqStrength === candStrength);

  // 3. Dosage Form comparison
  const reqForm = normalizeDosageForm(
    requestedMed.dosageForm,
    requestedMed.medicine_name || requestedMed.brandName
  );
  const candForm = normalizeDosageForm(
    candidateMed.dosageForm,
    candidateMed.medicine_name || candidateMed.brandName
  );
  const dosageFormMatch = Boolean(reqForm && candForm && reqForm === candForm);

  // Determine Match or Rejection
  let isMatch = false;
  let status = "MATCH";
  let rejectionReason = "";

  if (!activeIngredientsMatch) {
    status = "REJECTED_ACTIVE_INGREDIENT_MISMATCH";
    rejectionReason = `Active ingredient incompatibility: [${reqIngredients.join(", ") || "Unknown"}] vs [${candIngredients.join(", ") || "Unknown"}]. Pharmacologically distinct compounds cannot be substituted.`;
  } else if (!strengthMatch) {
    status = "REJECTED_STRENGTH_MISMATCH";
    rejectionReason = `Incompatible dosage strength: requested ${reqStrength || "unspecified"} vs candidate ${candStrength || "unspecified"}. Risk of subtherapeutic efficacy or supratherapeutic overdose.`;
  } else if (!dosageFormMatch) {
    status = "REJECTED_DOSAGE_FORM_MISMATCH";
    rejectionReason = `Incompatible delivery form: requested ${reqForm || "unspecified"} vs candidate ${candForm || "unspecified"}. Pharmacokinetic release profiles differ.`;
  } else {
    isMatch = true;
    status = "BIOEQUIVALENT_MATCH_APPROVED";
    rejectionReason = "";
  }

  // Pricing & Delta Savings
  const reqPrice = resolveMedicinePrice(requestedMed);
  const candPrice = resolveMedicinePrice(candidateMed);
  const savingsDelta = parseFloat((reqPrice - candPrice).toFixed(2));
  const savingsPercent =
    reqPrice > 0 && savingsDelta > 0
      ? parseFloat(((savingsDelta / reqPrice) * 100).toFixed(1))
      : 0;

  return {
    isMatch,
    matchScore: isMatch ? 100 : 0,
    status,
    rejectionReason,
    activeIngredientsMatch,
    strengthMatch,
    dosageFormMatch,
    reqStrength,
    candStrength,
    reqForm,
    candForm,
    reqIngredients,
    candIngredients,
    reqPrice,
    candPrice,
    savingsDelta,
    savingsPercent,
    isCheaper: savingsDelta > 0,
    isSamePrice: Math.abs(savingsDelta) < 0.01
  };
}

/**
 * Finds all strictly bioequivalent substitutes from an inventory pool
 * When requested brand is out of stock or requested, traverses inventory to find valid alternatives.
 */
export function findBioequivalentSubstitutes(requestedMed, inventoryPool = []) {
  if (!requestedMed || !Array.isArray(inventoryPool)) return [];

  const reqId = requestedMed.id ?? requestedMed.inventoryId ?? requestedMed.medicineId ?? requestedMed.brandName;

  const validCandidates = [];

  for (const candidate of inventoryPool) {
    const candId = candidate.id ?? candidate.inventoryId ?? candidate.medicineId ?? candidate.brandName;
    if (candId && reqId && candId === reqId) continue;

    const evalResult = evaluateBioequivalence(requestedMed, candidate);
    if (evalResult.isMatch) {
      validCandidates.push({
        candidate,
        evaluation: evalResult
      });
    }
  }

  // Sort candidates:
  // 1. In-stock items first (quantity > 0)
  // 2. Highest price savings for patient
  // 3. Longest remaining expiry months
  validCandidates.sort((a, b) => {
    const qtyA = a.candidate.stock_quantity ?? a.candidate.quantity ?? 0;
    const qtyB = b.candidate.stock_quantity ?? b.candidate.quantity ?? 0;
    const inStockA = qtyA > 0 ? 1 : 0;
    const inStockB = qtyB > 0 ? 1 : 0;

    if (inStockA !== inStockB) return inStockB - inStockA;

    // Prefer higher savings delta
    if (b.evaluation.savingsDelta !== a.evaluation.savingsDelta) {
      return b.evaluation.savingsDelta - a.evaluation.savingsDelta;
    }

    // Prefer longer expiry
    const expA = a.candidate.expiry_date_months ?? 0;
    const expB = b.candidate.expiry_date_months ?? 0;
    return expB - expA;
  });

  return validCandidates;
}

export default {
  normalizeActiveIngredients,
  normalizeStrength,
  normalizeDosageForm,
  resolveMedicinePrice,
  evaluateBioequivalence,
  findBioequivalentSubstitutes
};
