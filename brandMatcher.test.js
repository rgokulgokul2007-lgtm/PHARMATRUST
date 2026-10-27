import { describe, it, expect } from "vitest";
import {
  evaluateBioequivalence,
  findBioequivalentSubstitutes,
  normalizeActiveIngredients,
  normalizeStrength,
  normalizeDosageForm,
  resolveMedicinePrice,
} from "./brandMatcher.js";

describe("PharmaTrust AI Brand Matching Engine - Capstone Module 6 Unit Tests", () => {
  // Test Case 1: Exact-Match Validation (Active Ingredients, Strength, Dosage Form)
  describe("Exact-Match Bioequivalence Validation", () => {
    it("mathematically approves exact matches having identical active ingredients, strength, and dosage form", () => {
      const requested = {
        medicineId: "MED-CRO-500",
        brandName: "Crocin 500mg",
        genericName: "Paracetamol 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
        mrp: 32.5,
      };

      const candidate = {
        medicineId: "MED-PAC-500",
        brandName: "Pacimol 500mg",
        genericName: "Paracetamol 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
        mrp: 19.5,
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(true);
      expect(result.status).toBe("BIOEQUIVALENT_MATCH_APPROVED");
      expect(result.matchScore).toBe(100);
      expect(result.activeIngredientsMatch).toBe(true);
      expect(result.strengthMatch).toBe(true);
      expect(result.dosageFormMatch).toBe(true);
      expect(result.savingsDelta).toBe(13.0);
      expect(result.savingsPercent).toBe(40.0);
      expect(result.isCheaper).toBe(true);
    });

    it("approves multi-salt combination bioequivalence with normalized chemical names", () => {
      const requested = {
        brandName: "Augmentin 625 Duo",
        activeIngredients: ["Amoxicillin", "Clavulanic Acid"],
        strength: "625mg",
        dosageForm: "Tablet",
        mrp: 215.0,
      };

      const candidate = {
        brandName: "Moxikind-CV 625",
        activeIngredients: ["Amoxicillin", "Clavulanate Potassium"],
        strength: "625mg",
        dosageForm: "Tablet",
        mrp: 148.0,
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(true);
      expect(result.status).toBe("BIOEQUIVALENT_MATCH_APPROVED");
      expect(result.savingsDelta).toBe(67.0);
      expect(result.savingsPercent).toBe(31.2);
    });
  });

  // Test Case 2: Rejection of Active-Ingredient Mismatches
  describe("Active-Ingredient Incompatibility Rejection", () => {
    it("strictly rejects candidates with active-ingredient mismatches (e.g. Ibuprofen vs Paracetamol)", () => {
      const requested = {
        brandName: "Crocin 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
      };

      const candidate = {
        brandName: "Brufen 400",
        activeIngredients: ["Ibuprofen"],
        strength: "500mg",
        dosageForm: "Tablet",
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(false);
      expect(result.status).toBe("REJECTED_ACTIVE_INGREDIENT_MISMATCH");
      expect(result.activeIngredientsMatch).toBe(false);
      expect(result.rejectionReason).toContain("Active ingredient incompatibility");
    });

    it("rejects single-salt candidate when requested medication requires a dual combination", () => {
      const requested = {
        brandName: "Montair-LC",
        activeIngredients: ["Montelukast", "Levocetirizine"],
        strength: "10mg/5mg",
        dosageForm: "Tablet",
      };

      const candidate = {
        brandName: "Singulair",
        activeIngredients: ["Montelukast"],
        strength: "10mg/5mg",
        dosageForm: "Tablet",
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(false);
      expect(result.status).toBe("REJECTED_ACTIVE_INGREDIENT_MISMATCH");
    });
  });

  // Test Case 3: Rejection of Dosage-Strength Mismatches
  describe("Dosage-Strength Mismatch Rejection", () => {
    it("strictly rejects candidates with dosage-strength mismatches (e.g. 650mg vs 500mg)", () => {
      const requested = {
        brandName: "Crocin 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
      };

      const candidate = {
        brandName: "Dolo 650",
        activeIngredients: ["Paracetamol"],
        strength: "650mg",
        dosageForm: "Tablet",
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(false);
      expect(result.status).toBe("REJECTED_STRENGTH_MISMATCH");
      expect(result.activeIngredientsMatch).toBe(true);
      expect(result.strengthMatch).toBe(false);
      expect(result.rejectionReason).toContain("Incompatible dosage strength");
    });

    it("rejects strength mismatch even when active molecules and dosage forms are identical", () => {
      const requested = {
        brandName: "Lipitor 10mg",
        activeIngredients: ["Atorvastatin"],
        strength: "10mg",
        dosageForm: "Tablet",
      };

      const candidate = {
        brandName: "Atorva 20mg",
        activeIngredients: ["Atorvastatin"],
        strength: "20mg",
        dosageForm: "Tablet",
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(false);
      expect(result.status).toBe("REJECTED_STRENGTH_MISMATCH");
    });
  });

  // Test Case 4: Rejection of Dosage-Form Mismatches
  describe("Dosage-Form Incompatibility Rejection", () => {
    it("rejects candidate when delivery route differs (e.g. Tablet vs Syrup/Suspension)", () => {
      const requested = {
        brandName: "Calpol 500 Tablet",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
      };

      const candidate = {
        brandName: "Calpol Paediatric Syrup",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Syrup",
      };

      const result = evaluateBioequivalence(requested, candidate);

      expect(result.isMatch).toBe(false);
      expect(result.status).toBe("REJECTED_DOSAGE_FORM_MISMATCH");
      expect(result.dosageFormMatch).toBe(false);
      expect(result.rejectionReason).toContain("Incompatible delivery form");
    });
  });

  // Test Case 5: Safe Handling of Empty Datasets and Missing Records
  describe("Robust Error Handling & Boundary Defense", () => {
    it("safely handles null, undefined, or missing medication records without throwing", () => {
      expect(() => evaluateBioequivalence(null, null)).not.toThrow();

      const resultNull = evaluateBioequivalence(null, null);
      expect(resultNull.isMatch).toBe(false);
      expect(resultNull.status).toBe("INVALID_RECORD");
      expect(resultNull.matchScore).toBe(0);

      const resultPartial = evaluateBioequivalence({ brandName: "Test" }, undefined);
      expect(resultPartial.isMatch).toBe(false);
      expect(resultPartial.status).toBe("INVALID_RECORD");
    });

    it("safely returns empty array when searching an empty inventory pool", () => {
      const requested = {
        brandName: "Crocin 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
      };

      const substitutes = findBioequivalentSubstitutes(requested, []);
      expect(Array.isArray(substitutes)).toBe(true);
      expect(substitutes.length).toBe(0);

      const nullPoolSubstitutes = findBioequivalentSubstitutes(requested, null);
      expect(Array.isArray(nullPoolSubstitutes)).toBe(true);
      expect(nullPoolSubstitutes.length).toBe(0);
    });

    it("normalizes malformed or whitespace-padded inputs gracefully", () => {
      expect(normalizeActiveIngredients("  PARACETAMOL , caffeine ")).toEqual([
        "caffeine",
        "paracetamol",
      ]);
      expect(normalizeActiveIngredients(null)).toEqual([]);
      expect(normalizeStrength("  500  mg ")).toBe("500mg");
      expect(normalizeDosageForm("  FILM-COATED TABLET ")).toBe("tablet");
      expect(resolveMedicinePrice(null)).toBe(30.0);
    });
  });

  // Test Case 6: Out-of-Stock Alternative Traversal & Ranking
  describe("Out-of-Stock Alternative Traversal & Ranking", () => {
    it("traverses candidate pool, filters non-matching items, and prioritizes in-stock items with maximum price savings", () => {
      const requested = {
        medicineId: "MED-REQ-001",
        brandName: "Crocin 500mg",
        activeIngredients: ["Paracetamol"],
        strength: "500mg",
        dosageForm: "Tablet",
        mrp: 35.0,
      };

      const inventoryPool = [
        {
          medicineId: "MED-REQ-001", // Scanned item itself (should be excluded)
          brandName: "Crocin 500mg",
          activeIngredients: ["Paracetamol"],
          strength: "500mg",
          dosageForm: "Tablet",
          mrp: 35.0,
          quantity: 0,
        },
        {
          medicineId: "MED-ALT-001", // Bioequivalent, In-Stock, Rs 20 (Save 15)
          brandName: "Pacimol 500mg",
          activeIngredients: ["Paracetamol"],
          strength: "500mg",
          dosageForm: "Tablet",
          mrp: 20.0,
          quantity: 45,
          expiry_date_months: 18,
        },
        {
          medicineId: "MED-ALT-002", // Bioequivalent, In-Stock, Rs 28 (Save 7)
          brandName: "Calpol 500mg",
          activeIngredients: ["Paracetamol"],
          strength: "500mg",
          dosageForm: "Tablet",
          mrp: 28.0,
          quantity: 12,
          expiry_date_months: 12,
        },
        {
          medicineId: "MED-ALT-003", // Rejected: Strength 650mg
          brandName: "Dolo 650mg",
          activeIngredients: ["Paracetamol"],
          strength: "650mg",
          dosageForm: "Tablet",
          mrp: 30.0,
          quantity: 100,
        },
        {
          medicineId: "MED-ALT-004", // Rejected: Active ingredient Ibuprofen
          brandName: "Combiflam",
          activeIngredients: ["Ibuprofen", "Paracetamol"],
          strength: "500mg",
          dosageForm: "Tablet",
          mrp: 25.0,
          quantity: 50,
        },
      ];

      const matches = findBioequivalentSubstitutes(requested, inventoryPool);

      expect(matches.length).toBe(2);
      // Top candidate must be the highest savings delta in stock (Pacimol 500mg, saves Rs 15)
      expect(matches[0].candidate.brandName).toBe("Pacimol 500mg");
      expect(matches[0].evaluation.savingsDelta).toBe(15.0);

      // Second candidate is Calpol 500mg (saves Rs 7)
      expect(matches[1].candidate.brandName).toBe("Calpol 500mg");
      expect(matches[1].evaluation.savingsDelta).toBe(7.0);
    });
  });
});
