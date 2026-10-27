/**
 * ============================================================================
 * PharmaTrust - Firestore Clinical Service & Strict Schema Layer
 * File: /inventoryService.js
 * ============================================================================
 * Implements the Capstone Review NoSQL Document Schema:
 * 
 * 1. Medicines Collection:
 *    - medicineId (string)
 *    - brandName (string)
 *    - genericName (string)
 *    - activeIngredients (string[])
 *    - strength (string)
 *    - dosageForm (string)
 *    - manufacturer (string)
 * 
 * 2. Inventory Collection:
 *    - inventoryId (string)
 *    - medicineId (string)
 *    - branchId (string: "avinashi_main" | "branch_2_railway" | "tirupur_hub")
 *    - batchNumber (string)
 *    - quantity (number)
 *    - expiryDate (string: "YYYY-MM-DD")
 *    - updatedAt (string / timestamp)
 *    - shelfLocation (string)
 *    - barcode (string)
 * 
 * 3. Users Collection:
 *    - userId (string)
 *    - role (string: "Chief Dispensing Pharmacist" | "Store Manager" | "Intake Technician")
 *    - branchId (string)
 *    - status ("active" | "inactive")
 * 
 * 4. Audit Logs Collection (Append-only immutable audit trail):
 *    - eventId (string)
 *    - actorId (string)
 *    - action (string: "DISPENSE" | "RESTOCK" | "INTAKE" | "SCAN" | "BATCH_DELETE")
 *    - recordId (string)
 *    - timestamp (string / timestamp)
 *    - details (object)
 * ============================================================================
 */

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  writeBatch
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase.js";

// Canonical Firestore Collection Identifiers
export const COLLECTIONS = {
  MEDICINES: "Medicines",
  INVENTORY: "Inventory",
  USERS: "Users",
  AUDIT_LOGS: "AuditLogs",
  LEGACY_PHARMA_INVENTORY: "PharmaInventory"
};

export const INVENTORY_COLLECTION = COLLECTIONS.LEGACY_PHARMA_INVENTORY;
export const AUDIT_COLLECTION = COLLECTIONS.AUDIT_LOGS;

// Fallback in-memory state for offline/standby mode
let memoryMedicines = [];
let memoryInventory = [];
let memoryAuditLogs = [];

/**
 * Computes pharmaceutical stock status based on numeric quantity
 * @param {number} stockLevel 
 * @returns {"In Stock" | "Low Stock" | "Out of Stock"}
 */
export function computeStockStatus(stockLevel) {
  const stock = typeof stockLevel === "number" ? stockLevel : parseInt(stockLevel, 10) || 0;
  if (stock <= 0) return "Out of Stock";
  if (stock < 20) return "Low Stock";
  return "In Stock";
}

/**
 * Generates a unique, standardized batch QR code matrix string
 * Format: PT-QR-[PREFIX]-[SHELF]-[TIMESTAMP_HASH][RANDOM]
 * e.g., PT-QR-AMOX-RKB1-M9Z2X7
 */
export function generateUniqueQrCode(name = "DRUG", shelf = "") {
  const prefix = (name || "DRUG").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase() || "MED";
  const shelfTag = (shelf || "").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase();
  const timeHex = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-QR-${prefix}${shelfTag ? `-${shelfTag}` : ""}-${timeHex.slice(-4)}${rand}`;
}

// ============================================================================
// 1. AUDIT LOGGING SERVICE
// ============================================================================

/**
 * Creates an immutable audit trail entry in the 'AuditLogs' Firestore collection
 * Schema: eventId, actorId, action, recordId, timestamp, details
 * 
 * @param {Object} param0
 * @param {string} param0.actorId - Pharmacist ID or system process
 * @param {string} param0.action - Action verb (DISPENSE, RESTOCK, INTAKE, SCAN, etc.)
 * @param {string} param0.recordId - Inventory ID or Medicine ID affected
 * @param {Object|string} [param0.details] - Contextual metadata
 * @returns {Promise<string>} Created eventId
 */
export async function logAuditEvent({ actorId = "system-pharmacist", action, recordId, details = {} }) {
  const eventId = `EVT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const auditEntry = {
    eventId,
    actorId,
    action,
    recordId: String(recordId || "N/A"),
    timestamp: nowIso,
    details: typeof details === "object" ? details : { info: String(details) }
  };

  memoryAuditLogs.unshift(auditEntry);

  if (db && isFirebaseConfigured) {
    try {
      const auditRef = doc(db, COLLECTIONS.AUDIT_LOGS, eventId);
      await setDoc(auditRef, auditEntry);
      console.log(`[Firestore Audit] Recorded: ${action} on ${recordId} by ${actorId}`);
    } catch (err) {
      console.warn("[Firestore Audit] Standby fallback:", err?.message);
    }
  }

  return eventId;
}

// ============================================================================
// 2. MEDICINES COLLECTION SERVICE
// ============================================================================

/**
 * Adds or updates a Medicine master document in Firestore
 * Schema: medicineId, brandName, genericName, activeIngredients, strength, dosageForm, manufacturer
 */
export async function addMedicineMaster({
  medicineId,
  brandName,
  genericName,
  activeIngredients,
  strength,
  dosageForm,
  manufacturer
}) {
  const id = medicineId || `MED-${brandName.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 6)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  
  const medicineDoc = {
    medicineId: id,
    brandName: brandName.trim(),
    genericName: (genericName || brandName).trim(),
    activeIngredients: Array.isArray(activeIngredients) ? activeIngredients : [String(activeIngredients)],
    strength: String(strength || "Standard").trim(),
    dosageForm: String(dosageForm || "Tablet").trim(),
    manufacturer: String(manufacturer || "Generic Pharma").trim()
  };

  const existingIdx = memoryMedicines.findIndex(m => m.medicineId === id);
  if (existingIdx >= 0) {
    memoryMedicines[existingIdx] = medicineDoc;
  } else {
    memoryMedicines.push(medicineDoc);
  }

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, COLLECTIONS.MEDICINES, id);
      await setDoc(docRef, medicineDoc, { merge: true });
    } catch (err) {
      console.warn("[Firestore Medicines] Standby fallback:", err?.message);
    }
  }

  return medicineDoc;
}

// ============================================================================
// 3. INVENTORY COLLECTION SERVICE
// ============================================================================

/**
 * Adds an Inventory batch document to Firestore
 * Schema: inventoryId, medicineId, branchId, batchNumber, quantity, expiryDate, updatedAt
 */
export async function addInventoryBatch({
  inventoryId,
  medicineId,
  branchId = "avinashi_main",
  batchNumber,
  quantity,
  expiryDate,
  shelfLocation = "Rack A1 - Shelf 1",
  barcode = ""
}) {
  const id = inventoryId || `INV-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
  const nowIso = new Date().toISOString();

  const inventoryDoc = {
    inventoryId: id,
    medicineId: String(medicineId),
    branchId: String(branchId),
    batchNumber: String(batchNumber || `BAT-${Date.now().toString().slice(-6)}`),
    quantity: Math.max(0, parseInt(quantity, 10) || 0),
    expiryDate: String(expiryDate || "2027-12-31"),
    shelfLocation: String(shelfLocation),
    barcode: String(barcode),
    updatedAt: nowIso
  };

  const existingIdx = memoryInventory.findIndex(i => i.inventoryId === id);
  if (existingIdx >= 0) {
    memoryInventory[existingIdx] = inventoryDoc;
  } else {
    memoryInventory.push(inventoryDoc);
  }

  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY, id);
      await setDoc(docRef, inventoryDoc, { merge: true });
    } catch (err) {
      console.warn("[Firestore Inventory] Standby fallback:", err?.message);
    }
  }

  await logAuditEvent({
    action: "BATCH_INTAKE",
    recordId: id,
    details: { medicineId, batchNumber: inventoryDoc.batchNumber, quantity: inventoryDoc.quantity, branchId }
  });

  return inventoryDoc;
}

// ============================================================================
// 4. REAL-TIME MULTI-COLLECTION INVENTORY SYNC (onSnapshot)
// ============================================================================

/**
 * Subscribes to real-time updates for a specific branch inventory, joining with Medicines master data.
 * Produces normalized records seamlessly consumed by dashboard table, D3 chart, and Trust Screen.
 * 
 * @param {string} branchId - Pharmacy branch ("avinashi_main", "branch_2_railway", "tirupur_hub")
 * @param {Function} onUpdate - Callback receiving array of fully joined and calculated medications
 * @param {Function} onError - Error callback
 * @returns {Function} Unsubscribe function
 */
export function subscribeToBranchInventory(branchId = "avinashi_main", onUpdate, onError) {
  if (!db || !isFirebaseConfigured) {
    console.info(`[Firestore] Standby mode active for branch: "${branchId}". Using verified in-memory dataset.`);
    const combined = getMemoryJoinedInventory(branchId);
    if (typeof onUpdate === "function") {
      onUpdate(combined);
    }
    return () => {};
  }

  try {
    let currentMedicinesMap = new Map();
    let currentInventoryDocs = [];

    const emitJoinedState = () => {
      const joined = currentInventoryDocs.map((invItem) => {
        const medMaster = currentMedicinesMap.get(invItem.medicineId) || {};
        return normalizeUnifiedRecord(invItem, medMaster);
      });
      if (typeof onUpdate === "function") {
        onUpdate(joined);
      }
    };

    // 1. Subscribe to Medicines collection
    const medicinesUnsub = onSnapshot(
      collection(db, COLLECTIONS.MEDICINES),
      (snap) => {
        currentMedicinesMap.clear();
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          currentMedicinesMap.set(data.medicineId || docSnap.id, data);
        });
        emitJoinedState();
      },
      (err) => {
        console.warn("[Firestore Medicines Listener Error]:", err?.message);
        if (typeof onError === "function") onError(err);
      }
    );

    // 2. Subscribe to Inventory collection filtered by branchId
    const inventoryQuery = query(
      collection(db, COLLECTIONS.INVENTORY),
      where("branchId", "==", branchId)
    );

    const inventoryUnsub = onSnapshot(
      inventoryQuery,
      (snap) => {
        currentInventoryDocs = [];
        snap.forEach((docSnap) => {
          currentInventoryDocs.push({
            id: docSnap.id,
            ...docSnap.data()
          });
        });

        // If collection was empty for this branch, seed canonical demo data
        if (snap.empty && branchId === "avinashi_main") {
          seedCanonicalCollections();
        }

        emitJoinedState();
      },
      (err) => {
        console.warn("[Firestore Inventory Listener Error]:", err?.message);
        if (typeof onError === "function") onError(err);
      }
    );

    return () => {
      medicinesUnsub();
      inventoryUnsub();
    };
  } catch (err) {
    console.error("[Firestore subscribeToBranchInventory Failed]:", err);
    if (typeof onUpdate === "function") {
      onUpdate(getMemoryJoinedInventory(branchId));
    }
    return () => {};
  }
}

/**
 * Normalizes an Inventory batch and Medicine master doc into the unified model consumed by the dashboard UI
 */
export function normalizeUnifiedRecord(inv, med = {}) {
  const expiryDateStr = inv.expiryDate || "2027-12-31";
  
  // Calculate remaining days & fractional months
  const now = new Date();
  const expiry = new Date(expiryDateStr);
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const monthsRemaining = parseFloat((daysRemaining / 30.44).toFixed(1));

  const brandName = med.brandName || inv.brandName || "Generic Medicine";
  const activeIngredients = Array.isArray(med.activeIngredients)
    ? med.activeIngredients
    : [med.activeIngredients || med.genericName || "Paracetamol 500mg"];
  const activeSalt = activeIngredients.join(" + ");
  const strength = med.strength || "Standard";
  const dosageForm = med.dosageForm || "Tablet";
  const manufacturer = med.manufacturer || "Generic Pharma";
  const quantity = typeof inv.quantity === "number" ? inv.quantity : parseInt(inv.quantity, 10) || 0;
  const shelf = inv.shelfLocation || "Rack A1 - Shelf 1";
  const barcode = inv.barcode || "8901030382011";

  return {
    id: inv.inventoryId || inv.id,
    inventoryId: inv.inventoryId || inv.id,
    medicineId: inv.medicineId || med.medicineId || inv.id,
    batchNumber: inv.batchNumber || "BAT-DEFAULT",
    medicine_name: `${brandName} ${strength} ${dosageForm}`.trim(),
    brand_name: `${brandName} (${manufacturer})`,
    brandName,
    genericName: med.genericName || brandName,
    active_salt: activeSalt,
    activeIngredients,
    strength,
    dosageForm,
    manufacturer,
    therapeutic_category: med.therapeutic_category || "Essential Clinical Therapeutic",
    stock_quantity: quantity,
    quantity,
    stockLevel: quantity,
    low_stock_threshold: 10,
    expiry_days_remaining: daysRemaining,
    expiry_date_months: monthsRemaining,
    expiryDate: expiryDateStr,
    expiry: expiryDateStr,
    physical_shelf_location: shelf,
    shelfLocation: shelf,
    barcode,
    status: computeStockStatus(quantity),
    qrCodeData: inv.qrCodeData || generateUniqueQrCode(brandName, shelf)
  };
}

// ============================================================================
// 5. DISPENSE & RESTOCK REAL-TIME OPERATIONS
// ============================================================================

/**
 * Real-time decrement of inventory batch with atomic Firestore increment and audit log
 */
export async function dispenseInventoryItem(inventoryId, quantityToDispense = 1, actorId = "pharmacist-terminal-01") {
  const qty = Math.max(1, parseInt(quantityToDispense, 10) || 1);
  const nowIso = new Date().toISOString();

  // 1. Update in-memory state
  const item = memoryInventory.find(i => i.inventoryId === inventoryId || i.id === inventoryId);
  if (item) {
    item.quantity = Math.max(0, (item.quantity || 0) - qty);
    item.updatedAt = nowIso;
  }

  // 2. Update Firestore if configured
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY, inventoryId);
      await updateDoc(docRef, {
        quantity: increment(-qty),
        updatedAt: nowIso
      });
      console.log(`[Firestore Dispense] Decremented ${qty} from ${inventoryId}`);
    } catch (err) {
      console.warn("[Firestore Dispense] Standby fallback:", err?.message);
    }
  }

  await logAuditEvent({
    actorId,
    action: "DISPENSE",
    recordId: inventoryId,
    details: { quantityDispensed: qty, newQuantity: item?.quantity }
  });

  return { success: true, inventoryId, quantityDispensed: qty };
}

/**
 * Real-time increment of inventory batch with atomic Firestore increment and audit log
 */
export async function restockInventoryItem(inventoryId, quantityToAdd = 10, actorId = "pharmacist-intake-01") {
  const qty = Math.max(1, parseInt(quantityToAdd, 10) || 10);
  const nowIso = new Date().toISOString();

  // 1. Update in-memory state
  const item = memoryInventory.find(i => i.inventoryId === inventoryId || i.id === inventoryId);
  if (item) {
    item.quantity = (item.quantity || 0) + qty;
    item.updatedAt = nowIso;
  }

  // 2. Update Firestore if configured
  if (db && isFirebaseConfigured) {
    try {
      const docRef = doc(db, COLLECTIONS.INVENTORY, inventoryId);
      await updateDoc(docRef, {
        quantity: increment(qty),
        updatedAt: nowIso
      });
      console.log(`[Firestore Restock] Added ${qty} to ${inventoryId}`);
    } catch (err) {
      console.warn("[Firestore Restock] Standby fallback:", err?.message);
    }
  }

  await logAuditEvent({
    actorId,
    action: "RESTOCK",
    recordId: inventoryId,
    details: { quantityAdded: qty, newQuantity: item?.quantity }
  });

  return { success: true, inventoryId, quantityAdded: qty };
}

// ============================================================================
// 6. CANONICAL SEEDING FOR CAPSTONE SCHEMA
// ============================================================================

export const CANONICAL_MEDICINES = [
  {
    medicineId: "MED-CROCIN-500",
    brandName: "Crocin",
    genericName: "Paracetamol",
    activeIngredients: ["Paracetamol 500mg"],
    strength: "500mg",
    dosageForm: "Tablet",
    manufacturer: "GSK Pharmaceuticals"
  },
  {
    medicineId: "MED-CALPOL-500",
    brandName: "Calpol Fast-Release",
    genericName: "Paracetamol",
    activeIngredients: ["Paracetamol 500mg"],
    strength: "500mg",
    dosageForm: "Tablet",
    manufacturer: "GSK Consumer"
  },
  {
    medicineId: "MED-PACIMOL-500",
    brandName: "Pacimol",
    genericName: "Paracetamol",
    activeIngredients: ["Paracetamol 500mg"],
    strength: "500mg",
    dosageForm: "Tablet",
    manufacturer: "Ipca Laboratories"
  },
  {
    medicineId: "MED-DOLO-650",
    brandName: "Dolo",
    genericName: "Paracetamol",
    activeIngredients: ["Paracetamol 650mg"],
    strength: "650mg",
    dosageForm: "Tablet",
    manufacturer: "Micro Labs"
  },
  {
    medicineId: "MED-AUGMENTIN-625",
    brandName: "Augmentin Duo",
    genericName: "Amoxicillin and Clavulanate Potassium",
    activeIngredients: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
    strength: "625mg",
    dosageForm: "Tablet",
    manufacturer: "GSK Pharmaceuticals"
  },
  {
    medicineId: "MED-MOXIKIND-625",
    brandName: "Moxikind-CV",
    genericName: "Amoxicillin and Clavulanate Potassium",
    activeIngredients: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
    strength: "625mg",
    dosageForm: "Tablet",
    manufacturer: "Mankind Pharma"
  },
  {
    medicineId: "MED-CLAVAM-625",
    brandName: "Clavam",
    genericName: "Amoxicillin and Clavulanate Potassium",
    activeIngredients: ["Amoxicillin 500mg", "Clavulanic Acid 125mg"],
    strength: "625mg",
    dosageForm: "Tablet",
    manufacturer: "Alkem Laboratories"
  },
  {
    medicineId: "MED-GLYCOMET-500",
    brandName: "Glycomet",
    genericName: "Metformin Hydrochloride",
    activeIngredients: ["Metformin HCl 500mg"],
    strength: "500mg",
    dosageForm: "Tablet",
    manufacturer: "USV Private Limited"
  },
  {
    medicineId: "MED-PAN-D",
    brandName: "Pan-D",
    genericName: "Pantoprazole and Domperidone",
    activeIngredients: ["Pantoprazole 40mg", "Domperidone 30mg"],
    strength: "40mg/30mg",
    dosageForm: "Capsule",
    manufacturer: "Alkem Laboratories"
  },
  {
    medicineId: "MED-PANTOSEC-D",
    brandName: "Pantosec-D",
    genericName: "Pantoprazole and Domperidone",
    activeIngredients: ["Pantoprazole 40mg", "Domperidone 30mg"],
    strength: "40mg/30mg",
    dosageForm: "Capsule",
    manufacturer: "Cipla Limited"
  }
];

export const CANONICAL_INVENTORY = [
  // Avinashi Main Branch
  {
    inventoryId: "INV-AVI-001",
    medicineId: "MED-CROCIN-500",
    branchId: "avinashi_main",
    batchNumber: "CR-2026-A1",
    quantity: 35,
    expiryDate: "2026-11-15",
    shelfLocation: "Rack A2 - Shelf 1",
    barcode: "8901030382011"
  },
  {
    inventoryId: "INV-AVI-002",
    medicineId: "MED-CALPOL-500",
    branchId: "avinashi_main",
    batchNumber: "CL-2027-B2",
    quantity: 60,
    expiryDate: "2027-08-20",
    shelfLocation: "Rack A2 - Shelf 3",
    barcode: "8901030382028"
  },
  {
    inventoryId: "INV-AVI-003",
    medicineId: "MED-PACIMOL-500",
    branchId: "avinashi_main",
    batchNumber: "PC-2027-C3",
    quantity: 85,
    expiryDate: "2027-12-10",
    shelfLocation: "Rack A2 - Shelf 4",
    barcode: "8901030382035"
  },
  {
    inventoryId: "INV-AVI-004",
    medicineId: "MED-AUGMENTIN-625",
    branchId: "avinashi_main",
    batchNumber: "AG-2026-M4",
    quantity: 6, // Low stock + Urgent expiry demo
    expiryDate: "2026-11-20",
    shelfLocation: "Rack B1 - Shelf 2",
    barcode: "8901030382042"
  },
  {
    inventoryId: "INV-AVI-005",
    medicineId: "MED-MOXIKIND-625",
    branchId: "avinashi_main",
    batchNumber: "MX-2027-K5",
    quantity: 50,
    expiryDate: "2027-09-15",
    shelfLocation: "Rack B1 - Shelf 3",
    barcode: "8901030382059"
  },
  {
    inventoryId: "INV-AVI-006",
    medicineId: "MED-CLAVAM-625",
    branchId: "avinashi_main",
    batchNumber: "CV-2028-L6",
    quantity: 90,
    expiryDate: "2028-02-28",
    shelfLocation: "Rack B1 - Shelf 4",
    barcode: "8901030382066"
  },
  {
    inventoryId: "INV-AVI-007",
    medicineId: "MED-GLYCOMET-500",
    branchId: "avinashi_main",
    batchNumber: "GL-2027-G7",
    quantity: 110,
    expiryDate: "2027-10-30",
    shelfLocation: "Rack C3 - Shelf 1",
    barcode: "8901030382073"
  },
  {
    inventoryId: "INV-AVI-008",
    medicineId: "MED-PAN-D",
    branchId: "avinashi_main",
    batchNumber: "PD-2026-P8",
    quantity: 8, // Low stock demo
    expiryDate: "2026-12-05",
    shelfLocation: "Rack D1 - Shelf 2",
    barcode: "8901030382080"
  },
  {
    inventoryId: "INV-AVI-009",
    medicineId: "MED-PANTOSEC-D",
    branchId: "avinashi_main",
    batchNumber: "PS-2027-D9",
    quantity: 75,
    expiryDate: "2027-11-18",
    shelfLocation: "Rack D1 - Shelf 3",
    barcode: "8901030382097"
  },

  // Branch 2 Railway Feeder
  {
    inventoryId: "INV-RLW-001",
    medicineId: "MED-CROCIN-500",
    branchId: "branch_2_railway",
    batchNumber: "CR-2027-R1",
    quantity: 45,
    expiryDate: "2027-06-15",
    shelfLocation: "Bay 1 - Shelf A",
    barcode: "8901030382011"
  },
  {
    inventoryId: "INV-RLW-002",
    medicineId: "MED-AUGMENTIN-625",
    branchId: "branch_2_railway",
    batchNumber: "AG-2027-R2",
    quantity: 4,
    expiryDate: "2026-11-30",
    shelfLocation: "Bay 2 - Shelf B",
    barcode: "8901030382042"
  },
  {
    inventoryId: "INV-RLW-003",
    medicineId: "MED-MOXIKIND-625",
    branchId: "branch_2_railway",
    batchNumber: "MX-2027-R3",
    quantity: 30,
    expiryDate: "2027-10-01",
    shelfLocation: "Bay 2 - Shelf C",
    barcode: "8901030382059"
  },

  // Tirupur Hub
  {
    inventoryId: "INV-HUB-001",
    medicineId: "MED-AUGMENTIN-625",
    branchId: "tirupur_hub",
    batchNumber: "AG-2027-H1",
    quantity: 250,
    expiryDate: "2027-12-31",
    shelfLocation: "Warehouse Zone A",
    barcode: "8901030382042"
  },
  {
    inventoryId: "INV-HUB-002",
    medicineId: "MED-PAN-D",
    branchId: "tirupur_hub",
    batchNumber: "PD-2027-H2",
    quantity: 180,
    expiryDate: "2027-11-20",
    shelfLocation: "Warehouse Zone B",
    barcode: "8901030382080"
  }
];

export const CANONICAL_USERS = [
  {
    userId: "USR-PHARM-01",
    role: "Chief Dispensing Pharmacist",
    branchId: "avinashi_main",
    status: "active"
  },
  {
    userId: "USR-MGR-02",
    role: "Store Manager",
    branchId: "avinashi_main",
    status: "active"
  },
  {
    userId: "USR-DEMO-03",
    role: "Guest Senior Pharmacist",
    branchId: "avinashi_main",
    status: "active"
  }
];

// Initialize memory collections with canonical data
memoryMedicines = [...CANONICAL_MEDICINES];
memoryInventory = [...CANONICAL_INVENTORY];

/**
 * Returns joined inventory list from memory for the given branchId
 */
function getMemoryJoinedInventory(branchId) {
  const branchItems = memoryInventory.filter(i => i.branchId === branchId);
  const medMap = new Map(memoryMedicines.map(m => [m.medicineId, m]));
  return branchItems.map(inv => normalizeUnifiedRecord(inv, medMap.get(inv.medicineId) || {}));
}

/**
 * Seeds the canonical Capstone NoSQL database (Medicines, Inventory, Users) into Firestore if empty
 */
export async function seedCanonicalCollections() {
  if (!db || !isFirebaseConfigured) {
    console.info("[Firestore] Standby mode: Canonical collections initialized in memory.");
    return { success: true, count: memoryInventory.length };
  }

  try {
    const batch = writeBatch(db);

    // 1. Seed Medicines
    CANONICAL_MEDICINES.forEach((med) => {
      const docRef = doc(db, COLLECTIONS.MEDICINES, med.medicineId);
      batch.set(docRef, med, { merge: true });
    });

    // 2. Seed Inventory
    CANONICAL_INVENTORY.forEach((inv) => {
      const docRef = doc(db, COLLECTIONS.INVENTORY, inv.inventoryId);
      batch.set(docRef, { ...inv, updatedAt: new Date().toISOString() }, { merge: true });
    });

    // 3. Seed Users
    CANONICAL_USERS.forEach((usr) => {
      const docRef = doc(db, COLLECTIONS.USERS, usr.userId);
      batch.set(docRef, usr, { merge: true });
    });

    await batch.commit();
    console.log("[Firestore] Canonical Capstone Schema successfully committed to Firestore!");

    await logAuditEvent({
      action: "SCHEMA_SEED",
      recordId: "SYSTEM_INITIALIZATION",
      details: { medicinesCount: CANONICAL_MEDICINES.length, inventoryCount: CANONICAL_INVENTORY.length }
    });

    return { success: true, count: CANONICAL_INVENTORY.length };
  } catch (err) {
    console.warn("[Firestore] Standby fallback on seedCanonicalCollections:", err?.message);
    return { success: false, error: err?.message };
  }
}

/**
 * ============================================================================
 * MODULE 2: Query Firestore Medicines & Inventory collections by scanned barcode / SKU
 * ============================================================================
 * Queries Firestore Medicines & Inventory collections to map scanned barcode / SKU
 * directly into unified clinical inventory record and logs an audit trail event.
 */
export async function queryMedicineAndInventoryByBarcode(rawCode, branchId = "avinashi_main") {
  if (!rawCode) return null;
  const cleaned = String(rawCode).trim();
  const lower = cleaned.toLowerCase();

  let foundMed = null;
  let foundInv = null;

  // 1. If Firestore is active, query remote Medicines and Inventory collections
  if (isFirebaseConfigured && db) {
    try {
      // Query Inventory by barcode
      const invBarcodeQ = query(
        collection(db, COLLECTIONS.INVENTORY),
        where("branchId", "==", branchId),
        where("barcode", "==", cleaned),
        limit(1)
      );
      const invSnap = await getDocs(invBarcodeQ);

      if (!invSnap.empty) {
        foundInv = { ...invSnap.docs[0].data(), inventoryId: invSnap.docs[0].id };
      } else {
        // Try inventoryId match
        const invDoc = await getDoc(doc(db, COLLECTIONS.INVENTORY, cleaned));
        if (invDoc.exists()) {
          foundInv = { ...invDoc.data(), inventoryId: invDoc.id };
        }
      }

      // Query Medicines collection by medicineId
      const targetMedId = foundInv?.medicineId || cleaned;
      const medDoc = await getDoc(doc(db, COLLECTIONS.MEDICINES, targetMedId));
      if (medDoc.exists()) {
        foundMed = { ...medDoc.data(), medicineId: medDoc.id };
      } else {
        // Query Medicines collection by genericName or brandName
        const medQ = query(
          collection(db, COLLECTIONS.MEDICINES),
          where("brandName", "==", cleaned),
          limit(1)
        );
        const medSnap = await getDocs(medQ);
        if (!medSnap.empty) {
          foundMed = { ...medSnap.docs[0].data(), medicineId: medSnap.docs[0].id };
        }
      }
    } catch (err) {
      console.warn("[Firestore] Live query fallback on scan:", err?.message);
    }
  }

  // 2. If not found in remote or offline, check canonical in-memory state
  if (!foundInv || !foundMed) {
    // Check canonical inventory
    const matchedInv = CANONICAL_INVENTORY.find(
      (item) =>
        item.branchId === branchId &&
        (item.barcode === cleaned || item.inventoryId === cleaned || item.medicineId === cleaned)
    ) || CANONICAL_INVENTORY.find(
      (item) => item.barcode === cleaned || item.inventoryId === cleaned || item.medicineId === cleaned
    );

    if (matchedInv) {
      foundInv = foundInv || matchedInv;
      foundMed = foundMed || CANONICAL_MEDICINES.find((m) => m.medicineId === matchedInv.medicineId);
    }

    if (!foundMed) {
      foundMed = CANONICAL_MEDICINES.find(
        (m) =>
          m.medicineId.toLowerCase() === lower ||
          m.brandName.toLowerCase().includes(lower) ||
          m.genericName.toLowerCase().includes(lower)
      );
    }
  }

  if (foundInv || foundMed) {
    const unified = normalizeUnifiedRecord(
      foundInv || {
        inventoryId: `INV-${cleaned}`,
        medicineId: foundMed?.medicineId || cleaned,
        branchId,
        batchNumber: "BAT-LIVE-SCAN",
        quantity: 25,
        expiryDate: "2027-08-31",
        shelfLocation: "Rack A1 - Shelf 1",
        barcode: cleaned
      },
      foundMed || {
        medicineId: foundInv?.medicineId || cleaned,
        brandName: cleaned,
        genericName: cleaned,
        activeIngredients: [cleaned],
        strength: "Standard",
        dosageForm: "Tablet",
        manufacturer: "Clinical Pharma"
      }
    );

    // Module 1 & 2 requirement: Append-only audit logging for scan events
    try {
      await logAuditEvent({
        actorId: "pharmacist-scanner-terminal",
        action: "SCAN",
        recordId: unified.inventoryId || unified.medicineId,
        details: {
          scannedCode: cleaned,
          brandName: unified.brandName,
          shelfLocation: unified.shelfLocation,
          quantityInHand: unified.quantity,
          branchId
        }
      });
    } catch (auditErr) {
      console.warn("[AuditLog] Standby for scan event:", auditErr?.message);
    }

    return unified;
  }

  return null;
}

// Backward-compatible exports for existing dashboard functions
export const subscribeToInventory = (onUpdate, onError) => subscribeToBranchInventory("avinashi_main", onUpdate, onError);
export const seedInitialInventoryIfEmpty = seedCanonicalCollections;
export const dispenseMedication = (id, qty) => dispenseInventoryItem(id, qty);
export const restockMedication = (id, qty) => restockInventoryItem(id, qty);

export default {
  COLLECTIONS,
  subscribeToBranchInventory,
  addMedicineMaster,
  addInventoryBatch,
  dispenseInventoryItem,
  restockInventoryItem,
  logAuditEvent,
  seedCanonicalCollections,
  queryMedicineAndInventoryByBarcode,
  computeStockStatus,
  generateUniqueQrCode
};
