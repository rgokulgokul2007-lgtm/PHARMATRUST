/**
 * ============================================================================
 * PharmaTrust - Firestore Inventory Service
 * File: /inventoryService.js
 * ============================================================================
 * Comprehensive modular CRUD operations and business logic for the
 * "PharmaInventory" Firestore collection.
 * 
 * Includes:
 * 1. CREATE: addMedication(), addMockMedication()
 * 2. READ: subscribeToInventory(), getInventorySnapshot(), getMedicationById()
 * 3. UPDATE: updateMedication(), updateMedicationStock(), dispenseMedication(), restockMedication()
 * 4. DELETE: deleteMedication(), batchDeleteMedications()
 * 5. QUERY & SEARCH: queryMedicationsByAPI(), queryMedicationByQrCode()
 * 6. SEED & SYNC: seedInitialInventoryIfEmpty()
 * 7. HELPERS: generateUniqueQrCode(), computeStockStatus()
 * ============================================================================
 */

import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
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
import { db } from "./firebase.js";

// Firestore Collection Reference for PharmaTrust
export const INVENTORY_COLLECTION = "PharmaInventory";
export const AUDIT_COLLECTION = "DispensaryAuditLogs";

const inventoryRef = collection(db, INVENTORY_COLLECTION);

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
 * 
 * @param {string} name - Medication name or brand
 * @param {string} shelf - Physical shelf rack location
 * @returns {string} Unique QR string identifier
 */
export function generateUniqueQrCode(name = "DRUG", shelf = "") {
  const prefix = (name || "DRUG").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase() || "MED";
  const shelfTag = (shelf || "").replace(/[^A-Za-z0-9]/g, "").substring(0, 4).toUpperCase();
  const timeHex = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PT-QR-${prefix}${shelfTag ? `-${shelfTag}` : ""}-${timeHex.slice(-4)}${rand}`;
}

/**
 * 1. CREATE: Adds a new medication document to the "PharmaInventory" collection
 * 
 * @param {Object} medication - Medication payload
 * @param {string} medication.name - Commercial name and dosage (e.g., "Paracetamol 650mg")
 * @param {number|string} medication.stockLevel - Numerical stock count (e.g., 100)
 * @param {string} medication.activeMolecule - Active Pharmaceutical Ingredient / API (e.g., "Acetaminophen")
 * @param {string} medication.expiry - Expiry date/horizon (e.g., "Dec 2027")
 * @param {string} [medication.status] - Optional stock status override
 * @param {string} [medication.shelfLocation] - Dispensary shelf assignment (e.g., "Rack A2 - Shelf 1")
 * @param {string} [medication.qrCodeData] - Unique batch QR code string matrix
 * @returns {Promise<{id: string, success: boolean, data: Object}>}
 */
export async function addMedication({
  name,
  drugName,
  stockLevel,
  activeMolecule,
  api,
  expiry,
  expiryDate,
  status,
  shelfLocation,
  qrCodeData
}) {
  try {
    const medName = (name || drugName || "Unnamed Medication").trim();
    const molecule = (activeMolecule || api || "Active Molecule N/A").trim();
    const parsedStock = Math.max(0, parseInt(stockLevel, 10) || 0);
    const assignedShelf = (shelfLocation || "Rack A1 - Shelf 1").trim();
    const assignedQr = (qrCodeData || generateUniqueQrCode(medName, assignedShelf)).trim();
    const assignedExpiry = (expiry || expiryDate || "Dec 2027").trim();
    const computedStatus = status || computeStockStatus(parsedStock);

    const docData = {
      name: medName,
      drugName: medName, // Dual compatibility for schema
      stockLevel: parsedStock,
      activeMolecule: molecule,
      api: molecule, // Dual compatibility for schema
      expiry: assignedExpiry,
      expiryDate: assignedExpiry,
      shelfLocation: assignedShelf,
      physical_shelf_location: assignedShelf,
      qrCodeData: assignedQr,
      status: computedStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(inventoryRef, docData);
    console.log(`[Firestore] Added medication "${medName}" (ID: ${docRef.id}, QR: ${assignedQr})`);

    return {
      success: true,
      id: docRef.id,
      data: docData
    };
  } catch (error) {
    console.error("[Firestore] Error adding medication to PharmaInventory:", error);
    throw error;
  }
}

/**
 * 2. READ (Real-Time Listener): Subscribes to live updates from "PharmaInventory"
 * 
 * @param {Function} onUpdate - Callback receiving the updated array of medication documents
 * @param {Function} [onError] - Optional error handler callback
 * @returns {Function} Unsubscribe function to terminate listener
 */
export function subscribeToInventory(onUpdate, onError) {
  const inventoryQuery = query(inventoryRef, orderBy("createdAt", "desc"));

  return onSnapshot(
    inventoryQuery,
    (snapshot) => {
      const medications = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const fallbackShelf = data.shelfLocation || data.physical_shelf_location || "Rack A1 - Shelf 1";
        const medName = data.name || data.drugName || "Unnamed Medication";
        const molecule = data.activeMolecule || data.api || "N/A";
        const stock = typeof data.stockLevel === "number" ? data.stockLevel : parseInt(data.stockLevel, 10) || 0;

        return {
          id: docSnap.id,
          name: medName,
          drugName: medName,
          activeMolecule: molecule,
          api: molecule,
          stockLevel: stock,
          status: data.status || computeStockStatus(stock),
          expiry: data.expiry || data.expiryDate || "N/A",
          shelfLocation: fallbackShelf,
          qrCodeData: data.qrCodeData || generateUniqueQrCode(medName, fallbackShelf),
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate() : new Date(data.createdAt)) : new Date(),
          updatedAt: data.updatedAt ? (data.updatedAt.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt)) : null
        };
      });

      console.log(`[Firestore] Real-time sync: Received ${medications.length} items from PharmaInventory`);
      if (typeof onUpdate === "function") {
        onUpdate(medications);
      }
    },
    (error) => {
      console.warn("[Firestore] Real-time inventory subscription notice:", error.message);
      if (typeof onError === "function") {
        onError(error);
      }
    }
  );
}

/**
 * 3. READ (One-Time Snapshot): Fetches all medications once from "PharmaInventory"
 * 
 * @returns {Promise<Array<Object>>}
 */
export async function getInventorySnapshot() {
  try {
    const snapshot = await getDocs(inventoryRef);
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      const shelf = data.shelfLocation || data.physical_shelf_location || "Rack A1 - Shelf 1";
      const name = data.name || data.drugName || "Unnamed Medication";
      const stock = typeof data.stockLevel === "number" ? data.stockLevel : parseInt(data.stockLevel, 10) || 0;
      return {
        id: docSnap.id,
        ...data,
        name,
        drugName: name,
        stockLevel: stock,
        status: data.status || computeStockStatus(stock),
        shelfLocation: shelf,
        qrCodeData: data.qrCodeData || generateUniqueQrCode(name, shelf)
      };
    });
  } catch (error) {
    console.error("[Firestore] Error fetching inventory snapshot:", error);
    throw error;
  }
}

/**
 * 4. READ (Single Document): Fetches a single medication by document ID
 * 
 * @param {string} docId - Firestore document ID
 * @returns {Promise<Object|null>}
 */
export async function getMedicationById(docId) {
  try {
    if (!docId) throw new Error("docId is required");
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);
    const snap = await getDoc(itemDocRef);
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
      id: snap.id,
      ...data,
      name: data.name || data.drugName,
      drugName: data.name || data.drugName,
      stockLevel: typeof data.stockLevel === "number" ? data.stockLevel : parseInt(data.stockLevel, 10) || 0
    };
  } catch (error) {
    console.error(`[Firestore] Error fetching medication with ID ${docId}:`, error);
    throw error;
  }
}

/**
 * 5. UPDATE: Updates fields of an existing medication in "PharmaInventory"
 * 
 * @param {string} docId - Firestore document ID
 * @param {Object} updateFields - Fields to update
 * @returns {Promise<{success: boolean}>}
 */
export async function updateMedication(docId, updateFields = {}) {
  try {
    if (!docId) throw new Error("docId is required for update");
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);

    const payload = {
      ...updateFields,
      updatedAt: serverTimestamp()
    };

    // If stockLevel is updated, automatically synchronize status
    if ("stockLevel" in updateFields) {
      const stock = Math.max(0, parseInt(updateFields.stockLevel, 10) || 0);
      payload.stockLevel = stock;
      if (!updateFields.status) {
        payload.status = computeStockStatus(stock);
      }
    }

    // Keep name & drugName in sync if either is updated
    if (updateFields.name && !updateFields.drugName) payload.drugName = updateFields.name;
    if (updateFields.drugName && !updateFields.name) payload.name = updateFields.drugName;

    // Keep activeMolecule & api in sync
    if (updateFields.activeMolecule && !updateFields.api) payload.api = updateFields.activeMolecule;
    if (updateFields.api && !updateFields.activeMolecule) payload.activeMolecule = updateFields.api;

    await updateDoc(itemDocRef, payload);
    console.log(`[Firestore] Updated medication ${docId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Firestore] Error updating medication ${docId}:`, error);
    throw error;
  }
}

/**
 * 6. UPDATE (Stock Quantity): Updates numerical stock level and recomputes status
 * 
 * @param {string} docId - Firestore document ID
 * @param {number|string} newStockLevel - New numerical stock count
 * @returns {Promise<{success: boolean, stockLevel: number, status: string}>}
 */
export async function updateMedicationStock(docId, newStockLevel) {
  try {
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);
    const parsedStock = Math.max(0, parseInt(newStockLevel, 10) || 0);
    const computedStatus = computeStockStatus(parsedStock);

    await updateDoc(itemDocRef, {
      stockLevel: parsedStock,
      status: computedStatus,
      updatedAt: serverTimestamp()
    });

    console.log(`[Firestore] Stock level updated for ${docId}: ${parsedStock} (${computedStatus})`);
    return {
      success: true,
      stockLevel: parsedStock,
      status: computedStatus
    };
  } catch (error) {
    console.error(`[Firestore] Error updating stock for item ${docId}:`, error);
    throw error;
  }
}

/**
 * 7. DISPENSE: Decrements inventory stock when dispensing to a patient/prescription
 * 
 * @param {string} docId - Firestore document ID
 * @param {number} quantityToDispense - Quantity of units to dispense (default: 1)
 * @returns {Promise<{success: boolean, previousStock: number, remainingStock: number, status: string}>}
 */
export async function dispenseMedication(docId, quantityToDispense = 1) {
  try {
    if (!docId) throw new Error("docId is required for dispensing");
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);
    const snap = await getDoc(itemDocRef);

    if (!snap.exists()) {
      throw new Error(`Medication document ${docId} not found in Firestore`);
    }

    const currentData = snap.data();
    const currentStock = typeof currentData.stockLevel === "number" ? currentData.stockLevel : parseInt(currentData.stockLevel, 10) || 0;
    const qty = Math.max(1, parseInt(quantityToDispense, 10) || 1);

    if (currentStock <= 0) {
      throw new Error(`Cannot dispense: "${currentData.name || 'Medication'}" is completely out of stock.`);
    }

    const remainingStock = Math.max(0, currentStock - qty);
    const newStatus = computeStockStatus(remainingStock);

    await updateDoc(itemDocRef, {
      stockLevel: remainingStock,
      status: newStatus,
      lastDispensedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[Firestore] Dispensed ${qty} units of "${currentData.name}". Remaining: ${remainingStock}`);

    return {
      success: true,
      previousStock: currentStock,
      remainingStock,
      dispensedQuantity: qty,
      status: newStatus
    };
  } catch (error) {
    console.error(`[Firestore] Error dispensing medication ${docId}:`, error);
    throw error;
  }
}

/**
 * 8. RESTOCK: Increments inventory stock when new batch arrives
 * 
 * @param {string} docId - Firestore document ID
 * @param {number} quantityToAdd - Units to add to current stock
 * @returns {Promise<{success: boolean, previousStock: number, newStock: number, status: string}>}
 */
export async function restockMedication(docId, quantityToAdd = 50) {
  try {
    if (!docId) throw new Error("docId is required for restocking");
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);
    const snap = await getDoc(itemDocRef);

    if (!snap.exists()) {
      throw new Error(`Medication document ${docId} not found in Firestore`);
    }

    const currentData = snap.data();
    const currentStock = typeof currentData.stockLevel === "number" ? currentData.stockLevel : parseInt(currentData.stockLevel, 10) || 0;
    const qty = Math.max(1, parseInt(quantityToAdd, 10) || 50);
    const newStock = currentStock + qty;
    const newStatus = computeStockStatus(newStock);

    await updateDoc(itemDocRef, {
      stockLevel: newStock,
      status: newStatus,
      lastRestockedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log(`[Firestore] Restocked +${qty} units of "${currentData.name}". New stock: ${newStock}`);

    return {
      success: true,
      previousStock: currentStock,
      newStock,
      addedQuantity: qty,
      status: newStatus
    };
  } catch (error) {
    console.error(`[Firestore] Error restocking medication ${docId}:`, error);
    throw error;
  }
}

/**
 * 9. DELETE: Permanently deletes a medication document from "PharmaInventory"
 * 
 * @param {string} docId - Firestore document ID
 * @returns {Promise<{success: boolean}>}
 */
export async function deleteMedication(docId) {
  try {
    if (!docId) throw new Error("docId is required for deletion");
    const itemDocRef = doc(db, INVENTORY_COLLECTION, docId);
    await deleteDoc(itemDocRef);
    console.log(`[Firestore] Deleted medication document ${docId}`);
    return { success: true };
  } catch (error) {
    console.error(`[Firestore] Error deleting medication ${docId}:`, error);
    throw error;
  }
}

/**
 * 10. BATCH DELETE: Removes multiple medication documents in an atomic batch
 * 
 * @param {Array<string>} docIds - Array of document IDs to delete
 * @returns {Promise<{success: boolean, count: number}>}
 */
export async function batchDeleteMedications(docIds = []) {
  try {
    if (!Array.isArray(docIds) || docIds.length === 0) {
      return { success: true, count: 0 };
    }
    const batch = writeBatch(db);
    docIds.forEach((id) => {
      const ref = doc(db, INVENTORY_COLLECTION, id);
      batch.delete(ref);
    });
    await batch.commit();
    console.log(`[Firestore] Successfully batch deleted ${docIds.length} items`);
    return { success: true, count: docIds.length };
  } catch (error) {
    console.error("[Firestore] Error executing batch deletion:", error);
    throw error;
  }
}

/**
 * 11. QUERY BY API: Finds available brand substitutes sharing the same Active Pharmaceutical Ingredient
 * 
 * @param {string} apiQuery - Active molecule / chemical name (e.g. "Acetaminophen", "Amoxicillin")
 * @returns {Promise<Array<Object>>} Matching medication documents
 */
export async function queryMedicationsByAPI(apiQuery) {
  try {
    if (!apiQuery || typeof apiQuery !== "string") return [];
    const normalizedQuery = apiQuery.trim().toLowerCase();

    // Query Firestore collection
    const snapshot = await getDocs(inventoryRef);
    const matches = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const molecule = (data.activeMolecule || data.api || "").toLowerCase();
      const drugName = (data.name || data.drugName || "").toLowerCase();

      if (molecule.includes(normalizedQuery) || normalizedQuery.includes(molecule) || drugName.includes(normalizedQuery)) {
        matches.push({
          id: docSnap.id,
          ...data,
          name: data.name || data.drugName,
          stockLevel: typeof data.stockLevel === "number" ? data.stockLevel : parseInt(data.stockLevel, 10) || 0
        });
      }
    });

    return matches;
  } catch (error) {
    console.error(`[Firestore] Error querying medications by API "${apiQuery}":`, error);
    throw error;
  }
}

/**
 * 12. QUERY BY QR CODE: Queries a medication by its unique batch QR string matrix
 * 
 * @param {string} qrCodeString - QR code string (e.g. "PT-QR-PARA-RKA2-650A")
 * @returns {Promise<Object|null>}
 */
export async function queryMedicationByQrCode(qrCodeString) {
  try {
    if (!qrCodeString) return null;
    const trimmed = qrCodeString.trim();

    const q = query(inventoryRef, where("qrCodeData", "==", trimmed), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const docSnap = snap.docs[0];
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    }

    // Fallback: check all documents in case of whitespace or casing mismatch
    const all = await getDocs(inventoryRef);
    for (const d of all.docs) {
      const data = d.data();
      if ((data.qrCodeData || "").toLowerCase() === trimmed.toLowerCase()) {
        return {
          id: d.id,
          ...data
        };
      }
    }

    return null;
  } catch (error) {
    console.error(`[Firestore] Error querying by QR Code "${qrCodeString}":`, error);
    throw error;
  }
}

/**
 * 13. SEED INITIAL INVENTORY: Populates the Firestore "PharmaInventory" collection
 * with canonical pharmaceutical items if currently empty.
 * 
 * @param {Array<Object>} [customItems] - Optional custom items to seed
 * @returns {Promise<{success: boolean, seededCount: number}>}
 */
export async function seedInitialInventoryIfEmpty(customItems = null) {
  const defaultMedications = customItems || [
    {
      name: "Paracetamol 500mg",
      stockLevel: 142,
      activeMolecule: "Acetaminophen / Paracetamol",
      shelfLocation: "Rack A2 - Shelf 1",
      qrCodeData: "PT-QR-PARA-RKA2-142A",
      expiry: "Dec 2027"
    },
    {
      name: "Amoxicillin Trihydrate 500mg",
      stockLevel: 88,
      activeMolecule: "Amoxicillin Trihydrate",
      shelfLocation: "Rack B1 - Shelf 2",
      qrCodeData: "PT-QR-AMOX-RKB1-880B",
      expiry: "Oct 2028"
    },
    {
      name: "Metformin Hydrochloride 500mg",
      stockLevel: 210,
      activeMolecule: "Metformin HCl",
      shelfLocation: "Rack D4 - Shelf 2",
      qrCodeData: "PT-QR-METF-RKD4-210C",
      expiry: "Aug 2027"
    },
    {
      name: "Atorvastatin Calcium 20mg",
      stockLevel: 18,
      activeMolecule: "Atorvastatin",
      shelfLocation: "Rack C3 - Shelf 1",
      qrCodeData: "PT-QR-ATOR-RKC3-018D",
      expiry: "Jun 2026"
    },
    {
      name: "Azithromycin Dihydrate 250mg",
      stockLevel: 180,
      activeMolecule: "Azithromycin",
      shelfLocation: "Rack B1 - Shelf 4",
      qrCodeData: "PT-QR-AZIT-RKB1-180E",
      expiry: "Nov 2028"
    }
  ];

  try {
    const existingSnap = await getDocs(inventoryRef);
    if (!existingSnap.empty) {
      console.log(`[Firestore] PharmaInventory already contains ${existingSnap.size} documents. Skipping auto-seed.`);
      return { success: true, seededCount: 0, existingCount: existingSnap.size };
    }

    console.log(`[Firestore] PharmaInventory is empty. Seeding ${defaultMedications.length} items...`);
    let count = 0;
    for (const item of defaultMedications) {
      await addMedication(item);
      count++;
    }

    console.log(`[Firestore] Successfully seeded ${count} medications into PharmaInventory.`);
    return { success: true, seededCount: count };
  } catch (error) {
    console.error("[Firestore] Error seeding initial inventory:", error);
    throw error;
  }
}
