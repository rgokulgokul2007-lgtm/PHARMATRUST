import { Html5Qrcode } from "html5-qrcode";
import * as d3 from "d3";

/**
 * PharmaTrust & Smart Shelf Locator
 * Frontend Application Logic (Vanilla JavaScript)
 * 
 * Part 1: Simulates backend data & API sorting
 * Part 2: Pharmacist Dashboard with Expiry Color-Coding, Shelf Locator & D3 Analytics
 * Part 3: Customer Trust Interface with "Trust Matcher" Algorithm
 * Part 4: Camera-Based QR Code and Barcode Scanner
 */

// Fallback dummy inventory embedded to ensure instant, reliable client execution
const DEFAULT_INVENTORY = [
  {
    id: 1,
    medicine_name: "Crocin Advance 500mg",
    active_salt: "Paracetamol 500mg",
    therapeutic_category: "Analgesic & Antipyretic (Pain & Fever)",
    brand_name: "Crocin (GSK)",
    expiry_date_months: 0.6,
    expiry_days_remaining: 18,
    stock_quantity: 35,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack A2 - Shelf 1",
    barcode: "8901030382011"
  },
  {
    id: 2,
    medicine_name: "Calpol 500mg Fast-Release",
    active_salt: "Paracetamol 500mg",
    therapeutic_category: "Analgesic & Antipyretic (Pain & Fever)",
    brand_name: "Calpol (GSK)",
    expiry_date_months: 9,
    expiry_days_remaining: 270,
    stock_quantity: 60,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack A2 - Shelf 3",
    barcode: "8901030382028"
  },
  {
    id: 3,
    medicine_name: "Pacimol 500mg Tablet",
    active_salt: "Paracetamol 500mg",
    therapeutic_category: "Analgesic & Antipyretic (Pain & Fever)",
    brand_name: "Pacimol (Ipca)",
    expiry_date_months: 14,
    expiry_days_remaining: 420,
    stock_quantity: 85,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack A2 - Shelf 4",
    barcode: "8901030382035"
  },
  {
    id: 4,
    medicine_name: "Augmentin 625 Duo",
    active_salt: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    therapeutic_category: "Broad-Spectrum Antibiotic (Bacterial Infection)",
    brand_name: "Augmentin (GSK)",
    expiry_date_months: 0.8,
    expiry_days_remaining: 24,
    stock_quantity: 6,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack B1 - Shelf 2",
    barcode: "8901030382042"
  },
  {
    id: 5,
    medicine_name: "Moxikind-CV 625",
    active_salt: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    therapeutic_category: "Broad-Spectrum Antibiotic (Bacterial Infection)",
    brand_name: "Moxikind-CV (Mankind)",
    expiry_date_months: 11,
    stock_quantity: 45,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack B1 - Shelf 4",
    barcode: "8901030382059"
  },
  {
    id: 6,
    medicine_name: "Clavam 625 Tablet",
    active_salt: "Amoxicillin 500mg + Clavulanic Acid 125mg",
    therapeutic_category: "Broad-Spectrum Antibiotic (Bacterial Infection)",
    brand_name: "Clavam (Alkem)",
    expiry_date_months: 8,
    stock_quantity: 50,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack B1 - Shelf 3",
    barcode: "8901030382066"
  },
  {
    id: 7,
    medicine_name: "Lipitor 20mg",
    active_salt: "Atorvastatin 20mg",
    therapeutic_category: "Lipid-Lowering Statin (Cholesterol Management)",
    brand_name: "Lipitor (Pfizer)",
    expiry_date_months: 3,
    stock_quantity: 4,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack C3 - Shelf 1",
    barcode: "8901030382073"
  },
  {
    id: 8,
    medicine_name: "Atorva 20mg",
    active_salt: "Atorvastatin 20mg",
    therapeutic_category: "Lipid-Lowering Statin (Cholesterol Management)",
    brand_name: "Atorva (Zydus)",
    expiry_date_months: 10,
    stock_quantity: 72,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack C3 - Shelf 3",
    barcode: "8901030382080"
  },
  {
    id: 9,
    medicine_name: "Storvas 20mg",
    active_salt: "Atorvastatin 20mg",
    therapeutic_category: "Lipid-Lowering Statin (Cholesterol Management)",
    brand_name: "Storvas (Sun Pharma)",
    expiry_date_months: 16,
    stock_quantity: 90,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack C3 - Shelf 4",
    barcode: "8901030382097"
  },
  {
    id: 10,
    medicine_name: "Glucophage 500mg",
    active_salt: "Metformin Hydrochloride 500mg",
    therapeutic_category: "Biguanide Antidiabetic (Glycemic Control)",
    brand_name: "Glucophage (Merck)",
    expiry_date_months: 4,
    stock_quantity: 25,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack D4 - Shelf 2",
    barcode: "8901030382103"
  },
  {
    id: 11,
    medicine_name: "Glycomet 500mg",
    active_salt: "Metformin Hydrochloride 500mg",
    therapeutic_category: "Biguanide Antidiabetic (Glycemic Control)",
    brand_name: "Glycomet (USV)",
    expiry_date_months: 12,
    stock_quantity: 110,
    low_stock_threshold: 5,
    physical_shelf_location: "Rack D4 - Shelf 4",
    barcode: "8901030382110"
  }
];

// ==========================================================================
// OPTION 3: MULTI-STORE MULTI-PHARMACY BRANCH REPOSITORIES
// ==========================================================================
const BRANCH_METADATA = {
  avinashi_main: {
    name: "Nila Medicals - Avinashi Main (Flagship)",
    terminal: "Terminal: Avinashi-Main-01",
    shortCode: "AVIN"
  },
  branch_2_railway: {
    name: "Nila Medicals - Branch 2 (Railway Feeder)",
    terminal: "Terminal: Branch-02-Counter-01",
    shortCode: "RLWY"
  },
  tirupur_hub: {
    name: "Nila Medicals - Tirupur Town Hub",
    terminal: "Terminal: Tirupur-Hub-01",
    shortCode: "TRPR"
  }
};

const BRANCH_DATA = {
  avinashi_main: [...DEFAULT_INVENTORY],
  branch_2_railway: [
    {
      id: 101,
      medicine_name: "Dolo 650 Fast Tablet",
      active_salt: "Paracetamol 650mg",
      therapeutic_category: "Analgesic & Antipyretic (Pain & Fever)",
      brand_name: "Dolo 650 (Micro Labs)",
      expiry_date_months: 0.5,
      expiry_days_remaining: 14,
      stock_quantity: 12,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F1 - Shelf 2",
      barcode: "8901030382201"
    },
    {
      id: 102,
      medicine_name: "Calpol 650 Plus",
      active_salt: "Paracetamol 650mg",
      therapeutic_category: "Analgesic & Antipyretic (Pain & Fever)",
      brand_name: "Calpol 650 (GSK)",
      expiry_date_months: 9,
      expiry_days_remaining: 270,
      stock_quantity: 75,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F1 - Shelf 4",
      barcode: "8901030382202"
    },
    {
      id: 103,
      medicine_name: "Azee 500 Tablet",
      active_salt: "Azithromycin 500mg",
      therapeutic_category: "Macrolide Antibiotic (Respiratory Infection)",
      brand_name: "Azee 500 (Cipla)",
      expiry_date_months: 0.7,
      expiry_days_remaining: 21,
      stock_quantity: 18,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F2 - Shelf 1",
      barcode: "8901030382203"
    },
    {
      id: 104,
      medicine_name: "Azithral 500mg",
      active_salt: "Azithromycin 500mg",
      therapeutic_category: "Macrolide Antibiotic (Respiratory Infection)",
      brand_name: "Azithral (Alembic)",
      expiry_date_months: 11,
      expiry_days_remaining: 330,
      stock_quantity: 55,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F2 - Shelf 3",
      barcode: "8901030382204"
    },
    {
      id: 105,
      medicine_name: "Pan-D Gastro Capsule",
      active_salt: "Pantoprazole 40mg + Domperidone 30mg",
      therapeutic_category: "Proton Pump Inhibitor (Acid Reflux & GERD)",
      brand_name: "Pan-D (Alkem)",
      expiry_date_months: 4,
      expiry_days_remaining: 120,
      stock_quantity: 32,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F3 - Shelf 1",
      barcode: "8901030382205"
    },
    {
      id: 106,
      medicine_name: "Pantocid-D SR",
      active_salt: "Pantoprazole 40mg + Domperidone 30mg",
      therapeutic_category: "Proton Pump Inhibitor (Acid Reflux & GERD)",
      brand_name: "Pantocid-D (Sun Pharma)",
      expiry_date_months: 14,
      expiry_days_remaining: 420,
      stock_quantity: 80,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F3 - Shelf 3",
      barcode: "8901030382206"
    },
    {
      id: 107,
      medicine_name: "Cetzine 10mg Strip",
      active_salt: "Cetirizine Hydrochloride 10mg",
      therapeutic_category: "Second-Gen Antihistamine (Allergic Rhinitis)",
      brand_name: "Cetzine (Dr. Reddy)",
      expiry_date_months: 10,
      expiry_days_remaining: 300,
      stock_quantity: 95,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F4 - Shelf 2",
      barcode: "8901030382207"
    },
    {
      id: 108,
      medicine_name: "Zyrtec 10mg",
      active_salt: "Cetirizine Hydrochloride 10mg",
      therapeutic_category: "Second-Gen Antihistamine (Allergic Rhinitis)",
      brand_name: "Zyrtec (GSK)",
      expiry_date_months: 3,
      expiry_days_remaining: 90,
      stock_quantity: 3,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack F4 - Shelf 1",
      barcode: "8901030382208"
    }
  ],
  tirupur_hub: [
    {
      id: 201,
      medicine_name: "Atorva 20mg Tablet",
      active_salt: "Atorvastatin 20mg",
      therapeutic_category: "Lipid-Lowering Statin (Cholesterol Management)",
      brand_name: "Atorva (Zydus)",
      expiry_date_months: 0.6,
      expiry_days_remaining: 19,
      stock_quantity: 4,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H1 - Shelf 1",
      barcode: "8901030382301"
    },
    {
      id: 202,
      medicine_name: "Storvas 20mg Heart-Care",
      active_salt: "Atorvastatin 20mg",
      therapeutic_category: "Lipid-Lowering Statin (Cholesterol Management)",
      brand_name: "Storvas (Sun Pharma)",
      expiry_date_months: 15,
      expiry_days_remaining: 450,
      stock_quantity: 90,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H1 - Shelf 3",
      barcode: "8901030382302"
    },
    {
      id: 203,
      medicine_name: "Telma 40mg Cardioprotective",
      active_salt: "Telmisartan 40mg",
      therapeutic_category: "Angiotensin Receptor Blocker (Hypertension)",
      brand_name: "Telma (Glenmark)",
      expiry_date_months: 4,
      expiry_days_remaining: 120,
      stock_quantity: 28,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H2 - Shelf 2",
      barcode: "8901030382303"
    },
    {
      id: 204,
      medicine_name: "Telpres 40mg",
      active_salt: "Telmisartan 40mg",
      therapeutic_category: "Angiotensin Receptor Blocker (Hypertension)",
      brand_name: "Telpres (Abbott)",
      expiry_date_months: 12,
      expiry_days_remaining: 360,
      stock_quantity: 85,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H2 - Shelf 4",
      barcode: "8901030382304"
    },
    {
      id: 205,
      medicine_name: "Glycomet Trio 2mg",
      active_salt: "Glimepiride 2mg + Metformin 500mg + Voglibose 0.2mg",
      therapeutic_category: "Triple Combination Oral Hypoglycemic (Type 2 Diabetes)",
      brand_name: "Glycomet Trio (USV)",
      expiry_date_months: 0.9,
      expiry_days_remaining: 27,
      stock_quantity: 14,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H3 - Shelf 1",
      barcode: "8901030382305"
    },
    {
      id: 206,
      medicine_name: "Januvia 100mg",
      active_salt: "Sitagliptin Phosphate 100mg",
      therapeutic_category: "DPP-4 Inhibitor (Postprandial Glycemic Control)",
      brand_name: "Januvia (MSD)",
      expiry_date_months: 16,
      expiry_days_remaining: 480,
      stock_quantity: 45,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H3 - Shelf 4",
      barcode: "8901030382306"
    },
    {
      id: 207,
      medicine_name: "Foracort 200 Rotacaps",
      active_salt: "Budesonide 200mcg + Formoterol Fumarate 6mcg",
      therapeutic_category: "Inhaled Corticosteroid & LABA (Asthma & COPD)",
      brand_name: "Foracort (Cipla)",
      expiry_date_months: 9,
      expiry_days_remaining: 270,
      stock_quantity: 40,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H4 - Shelf 2",
      barcode: "8901030382307"
    },
    {
      id: 208,
      medicine_name: "Ecosprin 75mg Strip",
      active_salt: "Aspirin (Acetylsalicylic Acid) 75mg Gastro-Resistant",
      therapeutic_category: "Antiplatelet Agent (Arterial Thromboembolism Prevention)",
      brand_name: "Ecosprin (USV)",
      expiry_date_months: 18,
      expiry_days_remaining: 540,
      stock_quantity: 140,
      low_stock_threshold: 5,
      physical_shelf_location: "Rack H4 - Shelf 3",
      barcode: "8901030382308"
    }
  ]
};

// Application State
let activeBranchId = "avinashi_main";
let inventoryData = [...BRANCH_DATA.avinashi_main];
let currentFilter = "all"; // "all" | "critical" | "warning" | "safe"
let currentSort = "nearest"; // "nearest" | "longest"
let autoSortUrgentFEFO = true; // Auto-sort <30d batches to the top
let urgentBannerDismissed = false;
let activeSimSelectedMedicine = null;
let searchQuery = "";
let selectedRequestedId = 1;
let selectedSubstituteId = 2;

// D3 Expiry Distribution & Purchasing Analytics State
let chartMetric = "units"; // "units" | "batches"
let chartActiveFilterRange = null; // null | { min: number, max: number, label: string }
let chartResizeObserver = null;

// ==========================================================================
// INVENTORY LOW STOCK THRESHOLD INTELLIGENCE
// ==========================================================================
const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Calculates the low stock threshold using the existing inventory item data structure.
 * Inspects item-specific threshold fields (low_stock_threshold, min_stock_level, threshold)
 * or defaults to the standard 5-unit limit.
 */
function getLowStockThreshold(item) {
  if (!item) return DEFAULT_LOW_STOCK_THRESHOLD;
  return item.low_stock_threshold ?? item.min_stock_level ?? item.threshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
}

/**
 * Evaluates whether an inventory item has fallen below its critical threshold (< 5 units).
 */
function isLowStock(item) {
  if (!item || typeof item.stock_quantity !== "number") return false;
  const threshold = getLowStockThreshold(item);
  return item.stock_quantity < threshold;
}

// ==========================================================================
// ESSENTIAL FEATURES STATE: DISPENSING, INWARD, PO & AUDIT TRAIL
// ==========================================================================
let audioMuted = false;
let audioCtx = null;
let activeDispenseMedicine = null;
let activeDispenseQty = 1;

let dispensaryAuditLog = [
  {
    id: 1,
    type: "dispense",
    title: "Stock Dispensed: Calpol 500mg Fast-Release (2 Units)",
    time: "10:30 AM Today",
    timestamp: Date.now() - 3600000,
    detail: "Patient: Ramesh Kumar &bull; Bill/Rx: #RX-2026-904. Remaining stock: 58 units. Location: Rack A2 - Shelf 3.",
    tags: ["Terminal: Counter-01", "Branch: Avinashi Road"]
  },
  {
    id: 2,
    type: "inward",
    title: "Inward Stock Intake: Lipitor 20mg (50 Units)",
    time: "09:15 AM Today",
    timestamp: Date.now() - 7200000,
    detail: "Wholesale delivery from Apex Distributors. Verified 14-month expiry runway. Stored at Rack C3 - Shelf 1.",
    tags: ["Inward Shipment", "Batch Lot #LP-998"]
  },
  {
    id: 3,
    type: "po",
    title: "Purchase Order Generated: PO-2026-NM-041",
    time: "08:45 AM Today",
    timestamp: Date.now() - 10800000,
    detail: "Order sent to Apex Wholesale Pharma for 4 low-stock & near-expiry lines. Total estimated value: ₹8,450.",
    tags: ["PO Transmitted", "Supplier: Apex Pharma"]
  }
];

/**
 * Dispensary Synthesizer Audio Feedback Engine
 */
function playAudioChime(type = "dispense") {
  if (audioMuted) return;
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === "dispense") {
      // Pleasant dual counter chime
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === "inward") {
      // Ascending intake tri-tone
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.07); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.14); // G5
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.36);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === "alert") {
      // Gentle warning tone
      osc.type = "triangle";
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(349.23, now + 0.1);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.32);
    } else if (type === "click") {
      // Subtle tactile click
      osc.type = "sine";
      osc.frequency.setValueAtTime(1100, now);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.06);
    }
  } catch (err) {
    // Non-blocking browser audio fallback
  }
}

/**
 * Initialize application and load inventory data
 */
async function initApp() {
  try {
    const response = await fetch("./inventory.json");
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        inventoryData = data;
      }
    }
  } catch (err) {
    console.info("Using embedded default inventory data:", err);
  }

  try {
    setupEventListeners();
  } catch (err) {
    console.error("setupEventListeners error:", err);
  }

  try {
    setupScannerLogic();
  } catch (err) {
    console.error("setupScannerLogic error:", err);
  }

  try {
    populateDropdownSelectors();
  } catch (err) {
    console.error("populateDropdownSelectors error:", err);
  }

  try {
    renderDashboard();
  } catch (err) {
    console.error("renderDashboard error:", err);
  }

  try {
    checkAutomatedExpiryAlert();
  } catch (err) {
    console.error("checkAutomatedExpiryAlert error:", err);
  }

  try {
    populateSimulatedScannerSamples();
  } catch (err) {
    console.error("populateSimulatedScannerSamples error:", err);
  }

  try {
    renderExpiryD3Chart();
  } catch (err) {
    console.error("renderExpiryD3Chart error:", err);
  }

  try {
    setupChartResizeObserver();
  } catch (err) {
    console.error("setupChartResizeObserver error:", err);
  }

  try {
    runTrustMatcher();
  } catch (err) {
    console.error("runTrustMatcher error:", err);
  }

  // Ensure D3 chart dimensions perfectly sync with rendered layout width
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      renderExpiryD3Chart();
    });
  }
}

/**
 * Event Listeners Setup
 */
function setupEventListeners() {
  // Navigation Tabs
  const dashboardTab = document.getElementById("tabDashboard");
  const trustTab = document.getElementById("tabTrust");
  const splitTab = document.getElementById("tabSplit");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const trustPanel = document.getElementById("trustPanel");
  const appWrapper = document.querySelector(".app-wrapper");

  dashboardTab?.addEventListener("click", () => {
    appWrapper?.classList.remove("split-mode");
    dashboardTab.classList.add("active");
    trustTab?.classList.remove("active");
    splitTab?.classList.remove("active");
    dashboardPanel.style.display = "flex";
    trustPanel.style.display = "none";
  });

  trustTab?.addEventListener("click", () => {
    appWrapper?.classList.remove("split-mode");
    trustTab.classList.add("active");
    dashboardTab?.classList.remove("active");
    splitTab?.classList.remove("active");
    trustPanel.style.display = "flex";
    dashboardPanel.style.display = "none";
    runTrustMatcher();
  });

  splitTab?.addEventListener("click", () => {
    appWrapper?.classList.add("split-mode");
    splitTab.classList.add("active");
    dashboardTab?.classList.remove("active");
    trustTab?.classList.remove("active");
    dashboardPanel.style.display = "flex";
    trustPanel.style.display = "flex";
    runTrustMatcher();
  });

  // Search Input
  const searchInput = document.getElementById("medicineSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  searchInput?.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (clearBtn) {
      clearBtn.style.display = searchQuery ? "block" : "none";
    }
    renderDashboard();
  });

  clearBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    searchQuery = "";
    clearBtn.style.display = "none";
    renderDashboard();
  });

  // Quick Chips
  document.querySelectorAll(".quick-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const term = chip.getAttribute("data-term") || "";
      if (searchInput) searchInput.value = term;
      searchQuery = term;
      if (clearBtn) clearBtn.style.display = "block";
      renderDashboard();
    });
  });

  // Filter Pills (All / 3-4 mo Warning / 8-10+ mo Safe)
  document.querySelectorAll(".filter-pill-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-pill-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.getAttribute("data-filter") || "all";
      renderDashboard();
    });
  });

  // Sort Toggle
  const sortToggleBtn = document.getElementById("sortToggleBtn");
  sortToggleBtn?.addEventListener("click", () => {
    if (currentSort === "nearest") {
      currentSort = "longest";
      sortToggleBtn.innerHTML = `Sort: <strong>Longest Expiry First &#8595;</strong>`;
    } else {
      currentSort = "nearest";
      sortToggleBtn.innerHTML = `Sort: <strong>Nearest Expiry First &#8593;</strong>`;
    }
    renderDashboard();
  });

  // Trust Interface Selectors
  const requestedSelect = document.getElementById("requestedBrandSelect");
  const substituteSelect = document.getElementById("substituteBrandSelect");

  requestedSelect?.addEventListener("change", (e) => {
    selectedRequestedId = Number(e.target.value);
    // If user changed Medicine A, suggest same-salt substitute if currently identical or mismatched
    if (selectedSubstituteId === selectedRequestedId) {
      autoSuggestSubstitute();
    }
    runTrustMatcher();
  });

  substituteSelect?.addEventListener("change", (e) => {
    selectedSubstituteId = Number(e.target.value);
    runTrustMatcher();
  });

  // Swap Medicines Button (A <-> B)
  const btnSwap = document.getElementById("btnSwapMedicines");
  btnSwap?.addEventListener("click", () => {
    const temp = selectedRequestedId;
    selectedRequestedId = selectedSubstituteId;
    selectedSubstituteId = temp;

    if (requestedSelect) requestedSelect.value = String(selectedRequestedId);
    if (substituteSelect) substituteSelect.value = String(selectedSubstituteId);

    runTrustMatcher();
    showToast("&#8644; Swapped Medicine A and Medicine B for comparison");
  });

  // Quick Preset Comparison Chips
  document.querySelectorAll(".btn-preset-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const reqId = Number(btn.getAttribute("data-req"));
      const subId = Number(btn.getAttribute("data-sub"));
      if (reqId && subId) {
        selectedRequestedId = reqId;
        selectedSubstituteId = subId;
        if (requestedSelect) requestedSelect.value = String(selectedRequestedId);
        if (substituteSelect) substituteSelect.value = String(selectedSubstituteId);
        runTrustMatcher();
        showToast(`Loaded comparison: ${btn.textContent.trim()}`);
      }
    });
  });

  // D3 Chart Metric Toggle (Total Units vs Batch Count)
  const toggleUnitsBtn = document.getElementById("toggleUnitsMetric");
  const toggleBatchesBtn = document.getElementById("toggleBatchesMetric");

  toggleUnitsBtn?.addEventListener("click", () => {
    if (chartMetric === "units") return;
    chartMetric = "units";
    toggleUnitsBtn.classList.add("active");
    toggleBatchesBtn?.classList.remove("active");
    renderExpiryD3Chart();
  });

  toggleBatchesBtn?.addEventListener("click", () => {
    if (chartMetric === "batches") return;
    chartMetric = "batches";
    toggleBatchesBtn.classList.add("active");
    toggleUnitsBtn?.classList.remove("active");
    renderExpiryD3Chart();
  });

  // Reset Chart Filter Button
  const resetChartFilterBtn = document.getElementById("resetChartFilterBtn");
  resetChartFilterBtn?.addEventListener("click", () => {
    chartActiveFilterRange = null;
    document.querySelectorAll(".zone-legend-item").forEach((item) => item.classList.remove("active-zone"));
    renderDashboard();
    renderExpiryD3Chart();
    showToast("Reset chart filter: showing all batches");
  });

  // Chart Zones Legend Click Filters
  document.querySelectorAll(".zone-legend-item").forEach((btn) => {
    btn.addEventListener("click", () => {
      const rangeStr = btn.getAttribute("data-filter-range");
      if (!rangeStr) return;

      const [minStr, maxStr] = rangeStr.split("-");
      const min = Number(minStr);
      const max = Number(maxStr);

      // Toggle off if already clicked
      if (chartActiveFilterRange && chartActiveFilterRange.min === min && chartActiveFilterRange.max === max) {
        chartActiveFilterRange = null;
        btn.classList.remove("active-zone");
        showToast("Cleared horizon filter");
      } else {
        document.querySelectorAll(".zone-legend-item").forEach((item) => item.classList.remove("active-zone"));
        btn.classList.add("active-zone");
        let label = `${min}–${max} Mo Horizon`;
        if (min <= 4) label = "3–4 Mo Critical Risk Batches";
        else if (min >= 8 && max <= 11) label = "8–11 Mo Customer Target Batches";
        else if (min >= 12) label = "12+ Mo Long Runway Batches";

        chartActiveFilterRange = { min, max, label };
        showToast(`Filtered dashboard to ${label}`);
      }

      renderDashboard();
      renderExpiryD3Chart();
    });
  });

  // Modal Close
  const modal = document.getElementById("comparisonModal");
  const modalClose = document.getElementById("modalCloseBtn");
  modalClose?.addEventListener("click", () => {
    modal?.classList.remove("active");
  });
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("active");
    }
  });

  // ==========================================================================
  // OPTION 3: STORE BRANCH SELECTOR EVENT LISTENER
  // ==========================================================================
  const branchSelect = document.getElementById("storeBranchSelect");
  branchSelect?.addEventListener("change", (e) => {
    const selectedBranch = e.target.value;
    switchPharmacyBranch(selectedBranch);
  });

  // ==========================================================================
  // OPTION 1: AUTOMATED EXPIRY ALERT (<30 DAYS) BANNER CONTROLS
  // ==========================================================================
  const btnSortUrgentFEFO = document.getElementById("btnSortUrgentFEFO");
  btnSortUrgentFEFO?.addEventListener("click", () => {
    autoSortUrgentFEFO = true;
    currentSort = "nearest";
    const sortToggleBtn = document.getElementById("sortToggleBtn");
    if (sortToggleBtn) {
      sortToggleBtn.innerHTML = `Sort: <strong>Nearest Expiry First &#8593; (FEFO)</strong>`;
    }
    renderDashboard();
    showToast("⚡ Prioritized First-Expiry-First-Out (FEFO): Critical items sorted to top!");
  });

  const btnDismissUrgentBanner = document.getElementById("btnDismissUrgentBanner");
  btnDismissUrgentBanner?.addEventListener("click", () => {
    urgentBannerDismissed = true;
    const banner = document.getElementById("urgentExpiryAlertBanner");
    if (banner) banner.style.display = "none";
    showToast("Automated expiry alert banner dismissed.");
  });

  // ==========================================================================
  // OPTION 2: SIMULATED BARCODE SCANNER EVENT LISTENERS
  // ==========================================================================
  const openSimScanBtn = document.getElementById("openSimulatedScanBtn");
  const closeSimScanBtn = document.getElementById("closeSimulatedScannerBtn");
  const simModal = document.getElementById("simulatedScannerModal");
  const btnExecuteSimScan = document.getElementById("btnExecuteSimScan");
  const btnRandomSimScan = document.getElementById("btnRandomSimScan");

  openSimScanBtn?.addEventListener("click", () => {
    openSimulatedScanModal();
  });

  closeSimScanBtn?.addEventListener("click", () => {
    closeSimulatedScanModal();
  });

  simModal?.addEventListener("click", (e) => {
    if (e.target === simModal) {
      closeSimulatedScanModal();
    }
  });

  btnExecuteSimScan?.addEventListener("click", () => {
    executeSimulatedScan();
  });

  btnRandomSimScan?.addEventListener("click", () => {
    if (inventoryData.length === 0) return;
    const randomIndex = Math.floor(Math.random() * inventoryData.length);
    const randomItem = inventoryData[randomIndex];
    activeSimSelectedMedicine = randomItem;
    updateSimScannerHUD(randomItem);
    populateSimulatedScannerSamples();
    executeSimulatedScan(randomItem);
  });
}

/**
 * Switch Dispensary Branch (Option 3: Multi-Pharmacy Multi-Store Switcher)
 */
function switchPharmacyBranch(branchId) {
  if (!BRANCH_DATA[branchId]) return;

  activeBranchId = branchId;
  inventoryData = [...BRANCH_DATA[branchId]];

  // Update active terminal badge in top right
  const badge = document.getElementById("activeTerminalBadge");
  if (badge && BRANCH_METADATA[branchId]) {
    badge.textContent = BRANCH_METADATA[branchId].terminal;
  }

  // Reset search query
  searchQuery = "";
  const searchInput = document.getElementById("medicineSearchInput");
  if (searchInput) searchInput.value = "";
  const clearBtn = document.getElementById("clearSearchBtn");
  if (clearBtn) clearBtn.style.display = "none";

  // Reset chart horizon filter and alert dismiss state
  chartActiveFilterRange = null;
  urgentBannerDismissed = false;

  // Set default comparison IDs based on branch inventory
  if (inventoryData.length >= 2) {
    selectedRequestedId = inventoryData[0].id;
    selectedSubstituteId = inventoryData[1].id;
  }

  // Re-populate Trust Matcher brand options
  populateDropdownSelectors();

  // Re-render Dashboard inventory table
  renderDashboard();

  // Re-evaluate Automated Expiry Alerts
  checkAutomatedExpiryAlert();

  // Re-populate Simulated Scanner sample packaging
  populateSimulatedScannerSamples();

  // Re-render D3 Expiry Analytics Chart for new branch
  renderExpiryD3Chart();

  showToast(`&#127973; Switched store location to: ${BRANCH_METADATA[branchId]?.name || branchId}`);
}

/**
 * Automated Expiry Alert System (Option 1: Visual pop-up warning banner for <30 days expiry)
 */
function checkAutomatedExpiryAlert() {
  const banner = document.getElementById("urgentExpiryAlertBanner");
  const titleEl = document.getElementById("urgentBannerTitle");
  const chipsEl = document.getElementById("urgentBatchesChips");
  const descEl = document.getElementById("urgentBannerDescription");

  if (!banner) return;

  const urgentBatches = inventoryData.filter(
    (item) => (item.expiry_days_remaining && item.expiry_days_remaining < 30) || item.expiry_date_months <= 1
  );

  if (urgentBatches.length > 0 && !urgentBannerDismissed) {
    banner.style.display = "block";
    if (titleEl) {
      titleEl.textContent = `Automated Alert: ${urgentBatches.length} batch${urgentBatches.length > 1 ? "es" : ""} below 30 days to expiry!`;
    }
    if (descEl) {
      descEl.innerHTML = `Identified critical short-dated inventory at <strong>${BRANCH_METADATA[activeBranchId]?.name || "Dispensary"}</strong>. Priority First-Expiry-First-Out (FEFO) dispensing is required to prevent inventory write-offs.`;
    }
    if (chipsEl) {
      chipsEl.innerHTML = urgentBatches
        .map((b) => {
          const days = b.expiry_days_remaining || Math.round(b.expiry_date_months * 30);
          return `
            <div class="urgent-batch-chip" data-id="${b.id}" title="Click to locate on shelf: ${b.medicine_name}">
              <span>&#128138; ${b.brand_name}</span>
              <span class="chip-days-alert">&#9889; ${days}d Left</span>
              <span style="font-size:0.68rem; color:#475569;">${b.physical_shelf_location}</span>
            </div>
          `;
        })
        .join("");

      // Clicking an urgent batch chip highlights the table row directly
      chipsEl.querySelectorAll(".urgent-batch-chip").forEach((chip) => {
        chip.addEventListener("click", () => {
          const id = Number(chip.getAttribute("data-id"));
          highlightTableRow(id);
        });
      });
    }
  } else {
    banner.style.display = "none";
  }
}

/**
 * Open Simulated Barcode Scanner Modal (Option 2)
 */
function openSimulatedScanModal() {
  const modal = document.getElementById("simulatedScannerModal");
  if (!modal) return;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  populateSimulatedScannerSamples();
}

/**
 * Close Simulated Barcode Scanner Modal
 */
function closeSimulatedScanModal() {
  const modal = document.getElementById("simulatedScannerModal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
}

/**
 * Populate Simulated Scanner Sample Packaging Grid
 */
function populateSimulatedScannerSamples() {
  const grid = document.getElementById("simSampleMedicinesGrid");
  if (!grid) return;

  const samples = inventoryData.slice(0, 6);
  if (!activeSimSelectedMedicine || !inventoryData.find((i) => i.id === activeSimSelectedMedicine.id)) {
    activeSimSelectedMedicine = samples[0] || inventoryData[0];
  }

  updateSimScannerHUD(activeSimSelectedMedicine);

  grid.innerHTML = samples
    .map(
      (item) => `
    <button type="button" class="sim-sample-btn ${activeSimSelectedMedicine?.id === item.id ? "active" : ""}" data-id="${item.id}">
      <span class="sim-sample-name">${item.medicine_name}</span>
      <span class="sim-sample-shelf">&#9638; ${item.physical_shelf_location}</span>
    </button>
  `
    )
    .join("");

  grid.querySelectorAll(".sim-sample-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      const selected = inventoryData.find((i) => i.id === id);
      if (selected) {
        activeSimSelectedMedicine = selected;
        grid.querySelectorAll(".sim-sample-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        updateSimScannerHUD(selected);
      }
    });
  });
}

/**
 * Update Simulated Hardware HUD Display
 */
function updateSimScannerHUD(item) {
  if (!item) return;
  const numEl = document.getElementById("simActiveBarcodeNumber");
  const indicatorEl = document.getElementById("simSelectedIndicator");

  if (numEl) numEl.textContent = item.barcode || "8901030382011";
  if (indicatorEl) {
    indicatorEl.innerHTML = `Target Medicine: <strong>${item.brand_name}</strong> &bull; Location: <span class="shelf-tag-highlight">${item.physical_shelf_location}</span>`;
  }
}

/**
 * Execute Simulated Barcode Scan (Auto-fills search and identifies exact shelf location)
 */
function executeSimulatedScan(targetItem) {
  const item = targetItem || activeSimSelectedMedicine || inventoryData[0];
  if (!item) return;

  const flashEl = document.getElementById("simScanFlash");
  const successHud = document.getElementById("simScanSuccessHud");
  const detailsEl = document.getElementById("simSuccessDetails");

  // Trigger laser scan beam flash feedback
  if (flashEl) {
    flashEl.classList.add("active");
    setTimeout(() => flashEl.classList.remove("active"), 400);
  }

  if (successHud && detailsEl) {
    detailsEl.innerHTML = `Medicine: <strong>${item.medicine_name}</strong> &bull; Barcode: <code>${item.barcode}</code><br/>Exact Dispensary Shelf Location: <strong style="color:#1e40af; font-size:0.9rem;">${item.physical_shelf_location}</strong>`;
    successHud.style.display = "block";
  }

  // Auto-fill the search input field with the sample medicine name as requested
  const searchInput = document.getElementById("medicineSearchInput");
  const clearBtn = document.getElementById("clearSearchBtn");
  if (searchInput) {
    searchInput.value = item.medicine_name;
    searchQuery = item.medicine_name;
  }
  if (clearBtn) clearBtn.style.display = "block";

  // Switch to Pharmacist Dashboard tab if needed
  const dashboardTab = document.getElementById("tabDashboard");
  const trustTab = document.getElementById("tabTrust");
  const splitTab = document.getElementById("tabSplit");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const trustPanel = document.getElementById("trustPanel");
  const appWrapper = document.querySelector(".app-wrapper");

  dashboardTab?.classList.add("active");
  trustTab?.classList.remove("active");
  splitTab?.classList.remove("active");
  appWrapper?.classList.remove("split-mode");
  if (dashboardPanel) dashboardPanel.style.display = "flex";
  if (trustPanel) trustPanel.style.display = "none";

  // Re-render dashboard
  currentFilter = "all";
  document.querySelectorAll(".filter-pill-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-filter") === "all");
  });
  renderDashboard();

  // Close modal and highlight the exact table row
  setTimeout(() => {
    closeSimulatedScanModal();
    if (successHud) successHud.style.display = "none";
    highlightTableRow(item.id);
    showToast(`⚡ Barcode Scanned: Auto-filled "${item.medicine_name}" ➔ Located at ${item.physical_shelf_location}`);
  }, 750);
}

/**
 * Highlight and smooth-scroll to a specific table row
 */
function highlightTableRow(itemId) {
  setTimeout(() => {
    const row = document.getElementById(`row-med-${itemId}`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
      row.classList.add("shelf-spotlight-pulse");
      setTimeout(() => {
        row.classList.remove("shelf-spotlight-pulse");
      }, 2600);
    }
  }, 100);
}

/**
 * Automatically suggests the best fresher substitute when a requested brand is selected
 */
function autoSuggestSubstitute() {
  const reqItem = inventoryData.find((i) => i.id === selectedRequestedId);
  if (!reqItem) return;

  const substituteSelect = document.getElementById("substituteBrandSelect");

  // Find exact salt substitutes with highest expiry
  const substitutes = inventoryData
    .filter((i) => i.active_salt === reqItem.active_salt && i.id !== reqItem.id)
    .sort((a, b) => b.expiry_date_months - a.expiry_date_months);

  if (substitutes.length > 0) {
    selectedSubstituteId = substitutes[0].id;
    if (substituteSelect) {
      substituteSelect.value = String(selectedSubstituteId);
    }
  }
}

/**
 * Populate dropdown menus in the Trust Interface
 */
function populateDropdownSelectors() {
  const requestedSelect = document.getElementById("requestedBrandSelect");
  const substituteSelect = document.getElementById("substituteBrandSelect");

  if (!requestedSelect || !substituteSelect) return;

  requestedSelect.innerHTML = "";
  substituteSelect.innerHTML = "";

  inventoryData.forEach((item) => {
    const optReq = document.createElement("option");
    optReq.value = String(item.id);
    optReq.textContent = `${item.brand_name} (${item.expiry_date_months} mo) - ${item.medicine_name}`;
    requestedSelect.appendChild(optReq);

    const optSub = document.createElement("option");
    optSub.value = String(item.id);
    optSub.textContent = `${item.brand_name} (${item.expiry_date_months} mo) [Shelf: ${item.physical_shelf_location}]`;
    substituteSelect.appendChild(optSub);
  });

  requestedSelect.value = String(selectedRequestedId);
  substituteSelect.value = String(selectedSubstituteId);
}

/**
 * PART 2: Render Pharmacist Dashboard Results Table
 * Implements:
 * - Dynamic filtering & search
 * - Sorting nearest-to-longest or longest-to-nearest
 * - COLOR CODING:
 *    - 3-4 months: Yellow/Orange Warning (Short Expiry)
 *    - 8-10+ months: Green Safe/Fresh (Demanded Expiry)
 * - Exact physical shelf location tags
 */
function renderDashboard() {
  const tableBody = document.getElementById("inventoryTableBody");
  const resultSummary = document.getElementById("resultSummaryText");
  const criticalCountBadge = document.getElementById("criticalCountBadge");
  const warningCountBadge = document.getElementById("warningCountBadge");
  const safeCountBadge = document.getElementById("safeCountBadge");

  if (!tableBody) return;

  const q = searchQuery.trim().toLowerCase();

  // Search filtering
  let filtered = inventoryData.filter((item) => {
    if (!q) return true;
    return (
      item.medicine_name.toLowerCase().includes(q) ||
      item.brand_name.toLowerCase().includes(q) ||
      item.active_salt.toLowerCase().includes(q) ||
      item.physical_shelf_location.toLowerCase().includes(q) ||
      (item.barcode && item.barcode.toLowerCase().includes(q))
    );
  });

  // Calculate counts for badges
  const totalCriticalBatches = filtered.filter(
    (i) => (i.expiry_days_remaining && i.expiry_days_remaining < 30) || i.expiry_date_months <= 1
  ).length;
  const totalWarningBatches = filtered.filter((i) => i.expiry_date_months >= 3 && i.expiry_date_months <= 4).length;
  const totalSafeBatches = filtered.filter((i) => i.expiry_date_months >= 8).length;
  const totalLowStockBatches = filtered.filter((i) => isLowStock(i)).length;

  if (criticalCountBadge) criticalCountBadge.textContent = `${totalCriticalBatches} urgent`;
  if (warningCountBadge) warningCountBadge.textContent = `${totalWarningBatches} short`;
  if (safeCountBadge) safeCountBadge.textContent = `${totalSafeBatches} fresh`;
  const lowStockCountBadge = document.getElementById("lowStockCountBadge");
  if (lowStockCountBadge) lowStockCountBadge.textContent = `${totalLowStockBatches} low`;

  // Apply Expiry Filter (All / Critical <30 days / Warning 3-4 mo / Safe 8-10+ mo / Low Stock <5 units)
  if (currentFilter === "critical") {
    filtered = filtered.filter(
      (item) => (item.expiry_days_remaining && item.expiry_days_remaining < 30) || item.expiry_date_months <= 1
    );
  } else if (currentFilter === "warning") {
    filtered = filtered.filter((item) => item.expiry_date_months >= 3 && item.expiry_date_months <= 4);
  } else if (currentFilter === "safe") {
    filtered = filtered.filter((item) => item.expiry_date_months >= 8);
  } else if (currentFilter === "low_stock") {
    filtered = filtered.filter((item) => isLowStock(item));
  }

  // Apply Interactive D3 Chart Horizon Filter (if user clicked a bar or legend bucket)
  if (chartActiveFilterRange) {
    filtered = filtered.filter(
      (item) =>
        item.expiry_date_months >= chartActiveFilterRange.min &&
        item.expiry_date_months <= chartActiveFilterRange.max
    );
  }

  // Sorting: Auto-sort urgent items (<30 days) to the very top automatically if autoSortUrgentFEFO is active
  filtered.sort((a, b) => {
    const aDays = a.expiry_days_remaining ?? Math.round(a.expiry_date_months * 30);
    const bDays = b.expiry_days_remaining ?? Math.round(b.expiry_date_months * 30);
    const aIsCritical = aDays < 30;
    const bIsCritical = bDays < 30;

    if (autoSortUrgentFEFO) {
      if (aIsCritical && !bIsCritical) return -1;
      if (!aIsCritical && bIsCritical) return 1;
    }

    if (currentSort === "nearest") {
      return aDays - bDays;
    } else {
      return bDays - aDays;
    }
  });

  // Update reset chart filter button visibility
  const resetChartBtn = document.getElementById("resetChartFilterBtn");
  if (resetChartBtn) {
    resetChartBtn.style.display = chartActiveFilterRange ? "inline-flex" : "none";
  }

  // Update summary text
  if (resultSummary) {
    let chartFilterNote = "";
    if (chartActiveFilterRange) {
      chartFilterNote = ` &bull; <span style="background:#eff6ff; color:#1d4ed8; padding:2px 8px; border-radius:9999px; font-weight:700; border:1px solid #bfdbfe;">&#128202; Chart Horizon: ${chartActiveFilterRange.label}</span>`;
    }
    resultSummary.innerHTML = `Showing <strong>${filtered.length}</strong> batches ${
      searchQuery ? `for "<em>${searchQuery}</em>"` : "in inventory"
    }${chartFilterNote}`;
  }

  // Clear table
  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="table-empty-state">
          <div class="empty-state-icon">&#128269;</div>
          <p>No inventory batches match your current search and filter criteria.</p>
        </td>
      </tr>
    `;
    return;
  }

  // Render Rows with Critical Expiry Color Coding
  filtered.forEach((item) => {
    const tr = document.createElement("tr");

    const daysLeft = item.expiry_days_remaining ?? Math.round(item.expiry_date_months * 30);
    const isCriticalUrgent = daysLeft < 30 || item.expiry_date_months <= 1;
    const lowStock = isLowStock(item);
    const threshold = getLowStockThreshold(item);

    // Determine row color-coding & badge status based on expiry_date_months
    let rowClass = "row-expiry-standard";
    let badgeClass = "standard";
    let statusLabel = `${item.expiry_date_months} Months`;
    let iconIndicator = "";

    if (isCriticalUrgent) {
      // Critical Urgent: <30 days
      rowClass = "row-expiry-critical-urgent";
      badgeClass = "critical-urgent";
      statusLabel = `${daysLeft} Days (FEFO Priority)`;
      iconIndicator = `<span title="Critical alert: Batch expires in less than 30 days! Priority First-Expiry-First-Out dispensing">&#128680;</span>`;
    } else if (item.expiry_date_months >= 3 && item.expiry_date_months <= 4) {
      // Warning: 3-4 months
      rowClass = "row-expiry-warning";
      badgeClass = "warning";
      statusLabel = `${item.expiry_date_months} Months (Short Expiry)`;
      iconIndicator = `<span title="Warning: Customer demanding 8-10 mo will likely reject this">&#9888;&#65039;</span>`;
    } else if (item.expiry_date_months >= 8) {
      // Safe / Fresh: 8-10+ months
      rowClass = "row-expiry-safe";
      badgeClass = "safe";
      statusLabel = `${item.expiry_date_months} Months (Customer Demanded)`;
      iconIndicator = `<span title="Safe/Fresh: Meets customer 8-10+ month expiry demand">&#9989;</span>`;
    }

    // Automatically highlight row with 'row-low-stock' if quantity falls below threshold (< 5 units)
    const rowClasses = [rowClass];
    if (lowStock) {
      rowClasses.push("row-low-stock");
    }
    tr.className = rowClasses.join(" ");
    tr.id = `row-med-${item.id}`;
    tr.dataset.id = item.id;

    // Check if there are other brands in inventory with identical salt
    const substituteCandidates = inventoryData.filter(
      (sub) => sub.active_salt === item.active_salt && sub.id !== item.id
    );
    const hasSubstitutes = substituteCandidates.length > 0;

    tr.innerHTML = `
      <td>
        <div class="med-brand-primary">${item.brand_name}</div>
        <div class="med-name-sub">${item.medicine_name}</div>
        <div class="med-active-salt-tag">&#129514; ${item.active_salt}</div>
        ${
          item.barcode
            ? `<div style="font-family:ui-monospace, monospace; font-size:0.68rem; color:var(--slate-400); margin-top:3px;"><span style="color:var(--slate-500);">&#9646;&#9646;</span> ${item.barcode}</div>`
            : ""
        }
      </td>
      <td>
        <span class="expiry-badge ${badgeClass}">
          ${iconIndicator} ${statusLabel}
        </span>
      </td>
      <td>
        <span class="shelf-badge">
          <span class="shelf-icon">&#9638;</span> ${item.physical_shelf_location}
        </span>
      </td>
      <td>
        <div class="stock-cell-wrap">
          <span class="stock-qty-number ${lowStock ? 'stock-qty-low' : ''}">
            <strong>${item.stock_quantity}</strong> units
          </span>
          ${
            lowStock
              ? `<span class="low-stock-badge" title="Critical Restock Alert: Quantity is ${item.stock_quantity} units (below ${threshold} units threshold)">
                   <span class="low-stock-icon">&#9888;&#65039;</span> Low Stock
                 </span>`
              : ""
          }
        </div>
      </td>
      <td>
        <div class="action-buttons-cell">
          <button type="button" class="btn-dispense-row" data-id="${item.id}" title="Quick Dispense from Counter" ${item.stock_quantity <= 0 ? 'disabled' : ''}>
            <span>⚡</span> Dispense
          </button>
          ${
            hasSubstitutes
              ? `<button type="button" class="btn-trust-action btn-show-trust" data-id="${item.id}" title="Open customer-facing 100% chemical match card">
                   &#128172; Trust Card
                 </button>`
              : `<span style="font-size:0.75rem; color:var(--slate-400); padding:4px 6px;">Sole brand</span>`
          }
        </div>
      </td>
    `;

    tableBody.appendChild(tr);
  });

  // Attach click events to "Dispense" buttons
  document.querySelectorAll(".btn-dispense-row").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      openDispenseModal(id, 1);
    });
  });

  // Attach click events to "Show Customer Trust Card" buttons
  document.querySelectorAll(".btn-show-trust").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = Number(btn.getAttribute("data-id"));
      openCustomerTrustForMedicine(id);
    });
  });

  // Update PO badge and Audit badge in header & toolbar
  const poNeededItems = inventoryData.filter((i) => isLowStock(i) || i.expiry_date_months <= 4);
  const toolbarPoBadge = document.getElementById("toolbarPoBadge");
  if (toolbarPoBadge) toolbarPoBadge.textContent = String(poNeededItems.length);
  const headerAuditBadge = document.getElementById("headerAuditBadge");
  if (headerAuditBadge) headerAuditBadge.textContent = String(dispensaryAuditLog.length);
}

/**
 * ============================================================================
 * D3.js Inventory Expiry Distribution & Bulk Purchasing Intelligence Engine
 * ============================================================================
 */

/**
 * Aggregates inventory records by expiry month horizon and annotates procurement advice
 */
function prepareExpiryChartData(items) {
  const monthMap = new Map();

  items.forEach((item) => {
    const m = Number(item.expiry_date_months) || 0;
    if (!monthMap.has(m)) {
      monthMap.set(m, {
        numericMonth: m,
        monthLabel: `${m} Mo`,
        totalUnits: 0,
        batchCount: 0,
        batches: []
      });
    }
    const entry = monthMap.get(m);
    entry.totalUnits += Number(item.stock_quantity) || 0;
    entry.batchCount += 1;
    entry.batches.push(item);
  });

  // Sort ascending by shelf-life horizon
  const data = Array.from(monthMap.values()).sort((a, b) => a.numericMonth - b.numericMonth);

  // Annotate clinical risk zone & purchasing recommendation
  data.forEach((d) => {
    if (d.numericMonth <= 4) {
      d.zone = "critical";
      d.zoneLabel = "Critical Short Expiry";
      d.color = "#ea580c";
      d.gradientId = "grad-critical";
      d.advice = "🚨 Priority Re-Order: Near expiry cutoff. Trigger fresh supplier PO immediately and prioritize FEFO shelf clearance.";
    } else if (d.numericMonth <= 7) {
      d.zone = "transition";
      d.zoneLabel = "Moderate Shelf-Life";
      d.color = "#f59e0b";
      d.gradientId = "grad-transition";
      d.advice = "⚠️ Moderate Buffer: Track dispensing velocity. Request vendor quotes for upcoming procurement cycle.";
    } else if (d.numericMonth <= 11) {
      d.zone = "target";
      d.zoneLabel = "Customer Fresh Sweetspot";
      d.color = "#10b981";
      d.gradientId = "grad-target";
      d.advice = "✅ Optimal Patient Demand: Strong customer acceptance (8-10+ mo). Maintain steady bulk replenishments.";
    } else {
      d.zone = "extended";
      d.zoneLabel = "Long Buffer Cushion";
      d.color = "#2563eb";
      d.gradientId = "grad-extended";
      d.advice = "⏸️ Defer Bulk Purchases: Robust 1-1.5 yr runway. Hold unnecessary orders to protect operating working capital.";
    }
  });

  return data;
}

/**
 * Renders the 4 Strategic Procurement Decision KPI Cards
 */
function renderProcurementKpis(items) {
  const strip = document.getElementById("procurementKpisStrip");
  if (!strip) return;

  const criticalBatches = items.filter((i) => i.expiry_date_months <= 4);
  const criticalUnits = criticalBatches.reduce((sum, i) => sum + (i.stock_quantity || 0), 0);

  const lowStockBatches = items.filter((i) => (i.stock_quantity || 0) < 10);
  const lowStockUnits = lowStockBatches.reduce((sum, i) => sum + (i.stock_quantity || 0), 0);

  const targetBatches = items.filter((i) => i.expiry_date_months >= 8 && i.expiry_date_months <= 11);
  const targetUnits = targetBatches.reduce((sum, i) => sum + (i.stock_quantity || 0), 0);

  const extendedBatches = items.filter((i) => i.expiry_date_months >= 12);
  const extendedUnits = extendedBatches.reduce((sum, i) => sum + (i.stock_quantity || 0), 0);

  strip.innerHTML = `
    <!-- KPI 1: Critical Short Expiry -->
    <div class="procurement-kpi-card kpi-critical" id="kpiCriticalCard" style="cursor:pointer;" title="Click to filter inventory to 3-4 mo critical batches">
      <div class="kpi-label-row">
        <span class="kpi-title">Critical Short Expiry</span>
        <span class="kpi-card-icon">&#9888;&#65039;</span>
      </div>
      <div class="kpi-stat-row">
        <span class="kpi-value">${criticalBatches.length}</span>
        <span class="kpi-units-tag">batches (${criticalUnits} units)</span>
      </div>
      <div class="kpi-action-advice">&#10132; Urgent PO: Near expiry cutoff</div>
      <div style="font-size:0.68rem; color:var(--slate-500); margin-top:2px;">
        ${criticalBatches.map((b) => b.brand_name.split(" ")[0]).join(", ")}
      </div>
    </div>

    <!-- KPI 2: Low Stock Warning (<10 units) -->
    <div class="procurement-kpi-card kpi-lowstock" id="kpiLowStockCard" style="cursor:pointer;" title="Click to filter inventory to low stock items (<10 units)">
      <div class="kpi-label-row">
        <span class="kpi-title">Dispensary Low Stock</span>
        <span class="kpi-card-icon">&#128308;</span>
      </div>
      <div class="kpi-stat-row">
        <span class="kpi-value">${lowStockBatches.length}</span>
        <span class="kpi-units-tag">SKUs (&lt;10 threshold)</span>
      </div>
      <div class="kpi-action-advice">&#10132; Restock: Stockout risk imminent</div>
      <div style="font-size:0.68rem; color:var(--slate-500); margin-top:2px;">
        ${lowStockBatches.map((b) => `${b.brand_name.split(" ")[0]} (${b.stock_quantity}u)`).join(", ")}
      </div>
    </div>

    <!-- KPI 3: Customer Target Sweetspot (8-11 mo) -->
    <div class="procurement-kpi-card kpi-optimal" id="kpiTargetCard" style="cursor:pointer;" title="Click to filter inventory to 8-11 mo target batches">
      <div class="kpi-label-row">
        <span class="kpi-title">Customer Fresh Sweetspot</span>
        <span class="kpi-card-icon">&#9989;</span>
      </div>
      <div class="kpi-stat-row">
        <span class="kpi-value">${targetBatches.length}</span>
        <span class="kpi-units-tag">batches (${targetUnits} units)</span>
      </div>
      <div class="kpi-action-advice">&#10132; Prime Window: High patient trust</div>
      <div style="font-size:0.68rem; color:var(--slate-500); margin-top:2px;">
        ${targetBatches.map((b) => b.brand_name.split(" ")[0]).join(", ")}
      </div>
    </div>

    <!-- KPI 4: Extended Runway (12+ mo) -->
    <div class="procurement-kpi-card kpi-extended" id="kpiExtendedCard" style="cursor:pointer;" title="Click to filter inventory to 12+ mo buffer batches">
      <div class="kpi-label-row">
        <span class="kpi-title">Extended Shelf Buffer</span>
        <span class="kpi-card-icon">&#128178;</span>
      </div>
      <div class="kpi-stat-row">
        <span class="kpi-value">${extendedBatches.length}</span>
        <span class="kpi-units-tag">batches (${extendedUnits} units)</span>
      </div>
      <div class="kpi-action-advice">&#10132; Defer Bulk POs: Capital conserved</div>
      <div style="font-size:0.68rem; color:var(--slate-500); margin-top:2px;">
        ${extendedBatches.map((b) => b.brand_name.split(" ")[0]).join(", ")}
      </div>
    </div>
  `;

  // Attach quick-click filters to KPI cards
  document.getElementById("kpiCriticalCard")?.addEventListener("click", () => {
    chartActiveFilterRange = { min: 3, max: 4, label: "3–4 Mo Critical Short Expiry" };
    syncLegendActiveState("3-4");
    renderDashboard();
    renderExpiryD3Chart();
    showToast("Filtered dashboard to 3–4 Mo Critical Short Expiry batches");
  });

  document.getElementById("kpiLowStockCard")?.addEventListener("click", () => {
    // Filter table by search term or low stock directly
    const searchInput = document.getElementById("medicineSearchInput");
    if (searchInput) searchInput.value = "";
    searchQuery = "";
    chartActiveFilterRange = null;
    currentFilter = "all";
    document.querySelectorAll(".filter-pill-btn").forEach((b) => b.classList.remove("active"));
    document.querySelector(".filter-pill-btn[data-filter='all']")?.classList.add("active");
    
    // We can filter inventoryData to low stock directly
    const tableBody = document.getElementById("inventoryTableBody");
    const resultSummary = document.getElementById("resultSummaryText");
    if (tableBody) {
      const lowStockItems = inventoryData.filter((i) => i.stock_quantity < 10);
      if (resultSummary) {
        resultSummary.innerHTML = `Showing <strong>${lowStockItems.length}</strong> batches &bull; <span style="background:#fef2f2; color:#b91c1c; padding:2px 8px; border-radius:9999px; font-weight:700; border:1px solid #fecaca;">&#9888;&#65039; Urgent Low Stock (&lt;10 units)</span>`;
      }
      // Re-trigger render with low-stock filter
      chartActiveFilterRange = { min: 0, max: 99, label: "Low Stock (<10 units)" };
      renderDashboard();
      // Apply exact low stock filter in table
      const rows = tableBody.querySelectorAll("tr");
      rows.forEach((r) => {
        const id = Number(r.dataset.id);
        const itm = inventoryData.find((x) => x.id === id);
        if (itm && itm.stock_quantity >= 10) {
          r.style.display = "none";
        }
      });
      showToast("Filtered inventory table to Urgent Low Stock (<10 units)");
    }
  });

  document.getElementById("kpiTargetCard")?.addEventListener("click", () => {
    chartActiveFilterRange = { min: 8, max: 11, label: "8–11 Mo Customer Fresh Sweetspot" };
    syncLegendActiveState("8-11");
    renderDashboard();
    renderExpiryD3Chart();
    showToast("Filtered dashboard to 8–11 Mo Customer Demanded batches");
  });

  document.getElementById("kpiExtendedCard")?.addEventListener("click", () => {
    chartActiveFilterRange = { min: 12, max: 24, label: "12+ Mo Extended Shelf Buffer" };
    syncLegendActiveState("12-24");
    renderDashboard();
    renderExpiryD3Chart();
    showToast("Filtered dashboard to 12+ Mo Extended Buffer batches");
  });
}

function syncLegendActiveState(rangeKey) {
  document.querySelectorAll(".zone-legend-item").forEach((item) => {
    if (item.getAttribute("data-filter-range") === rangeKey) {
      item.classList.add("active-zone");
    } else {
      item.classList.remove("active-zone");
    }
  });
}

/**
 * Core D3.js Chart Renderer: Visualizes Inventory Expiry Distribution
 */
function renderExpiryD3Chart() {
  const container = document.getElementById("d3ExpiryChart");
  if (!container) return;

  // Refresh procurement KPIs
  renderProcurementKpis(inventoryData);

  // Clear previous SVG contents
  d3.select(container).selectAll("*").remove();

  // Aggregate data
  const data = prepareExpiryChartData(inventoryData);
  if (data.length === 0) {
    d3.select(container).html(`
      <div style="display:flex; align-items:center; justify-content:center; height:200px; color:var(--slate-400); font-size:0.85rem;">
        No inventory data available for chart distribution.
      </div>
    `);
    return;
  }

  // Determine dimensions responsive to container wrapper
  const containerWidth = container.getBoundingClientRect().width || 640;
  const margin = { top: 26, right: 28, bottom: 44, left: 54 };
  const width = Math.max(460, containerWidth);
  const height = 240;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Append SVG
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .style("overflow", "visible");

  // Define SVG Gradients & Filters
  const defs = svg.append("defs");

  // 1. Critical Gradient (3-4 mo)
  const gradCritical = defs
    .append("linearGradient")
    .attr("id", "grad-critical")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  gradCritical.append("stop").attr("offset", "0%").attr("stop-color", "#f97316");
  gradCritical.append("stop").attr("offset", "100%").attr("stop-color", "#dc2626");

  // 2. Transition Gradient (5-7 mo)
  const gradTransition = defs
    .append("linearGradient")
    .attr("id", "grad-transition")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  gradTransition.append("stop").attr("offset", "0%").attr("stop-color", "#fbbf24");
  gradTransition.append("stop").attr("offset", "100%").attr("stop-color", "#d97706");

  // 3. Target Freshness Gradient (8-11 mo)
  const gradTarget = defs
    .append("linearGradient")
    .attr("id", "grad-target")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  gradTarget.append("stop").attr("offset", "0%").attr("stop-color", "#34d399");
  gradTarget.append("stop").attr("offset", "100%").attr("stop-color", "#059669");

  // 4. Extended Cushion Gradient (12+ mo)
  const gradExtended = defs
    .append("linearGradient")
    .attr("id", "grad-extended")
    .attr("x1", "0%")
    .attr("y1", "0%")
    .attr("x2", "0%")
    .attr("y2", "100%");
  gradExtended.append("stop").attr("offset", "0%").attr("stop-color", "#60a5fa");
  gradExtended.append("stop").attr("offset", "100%").attr("stop-color", "#1d4ed8");

  // Main Graph Group
  const g = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const xScale = d3
    .scaleBand()
    .domain(data.map((d) => d.monthLabel))
    .range([0, innerWidth])
    .padding(0.28);

  const maxVal = d3.max(data, (d) => (chartMetric === "units" ? d.totalUnits : d.batchCount)) || 10;
  const yScale = d3
    .scaleLinear()
    .domain([0, Math.ceil(maxVal * 1.25)])
    .range([innerHeight, 0])
    .nice();

  // Draw Subtle Background Purchasing Horizon Bands
  const criticalBars = data.filter((d) => d.numericMonth <= 4);
  if (criticalBars.length > 0) {
    const xStart = xScale(criticalBars[0].monthLabel) || 0;
    const lastBar = criticalBars[criticalBars.length - 1];
    const xEnd = (xScale(lastBar.monthLabel) || 0) + xScale.bandwidth();
    g.append("rect")
      .attr("x", xStart - 4)
      .attr("y", 0)
      .attr("width", xEnd - xStart + 8)
      .attr("height", innerHeight)
      .attr("fill", "#ea580c")
      .attr("rx", 6)
      .attr("class", "d3-zone-band");
  }

  // Draw Horizontal Gridlines
  const yAxisGrid = d3
    .axisLeft(yScale)
    .ticks(5)
    .tickSize(-innerWidth)
    .tickFormat("")
    .tickSizeOuter(0);

  g.append("g")
    .attr("class", "d3-grid-line")
    .call(yAxisGrid);

  // Draw Axes
  const xAxis = d3.axisBottom(xScale).tickSize(4);
  const yAxis = d3
    .axisLeft(yScale)
    .ticks(5)
    .tickFormat((d) => (chartMetric === "units" ? `${d} u` : `${d} b`));

  g.append("g")
    .attr("class", "d3-axis x-axis")
    .attr("transform", `translate(0, ${innerHeight})`)
    .call(xAxis)
    .selectAll("text")
    .style("font-size", "11px")
    .style("font-weight", "700")
    .style("fill", "#334155");

  g.append("g")
    .attr("class", "d3-axis y-axis")
    .call(yAxis)
    .selectAll("text")
    .style("font-size", "10px")
    .style("font-weight", "600")
    .style("fill", "#64748b");

  // Y-Axis Title
  g.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -40)
    .attr("x", -innerHeight / 2)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("font-weight", "800")
    .style("fill", "#475569")
    .style("letter-spacing", "0.03em")
    .text(chartMetric === "units" ? "STOCK QUANTITY (TOTAL UNITS)" : "BATCH COUNT (UNIQUE SKUS)");

  // X-Axis Title
  g.append("text")
    .attr("x", innerWidth / 2)
    .attr("y", innerHeight + 36)
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("font-weight", "800")
    .style("fill", "#475569")
    .style("letter-spacing", "0.03em")
    .text("UPCOMING SHELF-LIFE EXPIRY HORIZON (MONTHS UNTIL BATCH EXPIRATION)");

  // Safety Stock Reorder Threshold Line (when viewing units)
  if (chartMetric === "units" && yScale.domain()[1] >= 25) {
    const safetyLevel = 20;
    const threshY = yScale(safetyLevel);
    if (threshY > 0 && threshY < innerHeight) {
      g.append("line")
        .attr("x1", 0)
        .attr("x2", innerWidth)
        .attr("y1", threshY)
        .attr("y2", threshY)
        .attr("class", "d3-threshold-line");

      g.append("text")
        .attr("x", innerWidth - 6)
        .attr("y", threshY - 5)
        .attr("text-anchor", "end")
        .attr("class", "d3-threshold-text")
        .text(`Safety Reorder Threshold (${safetyLevel}u)`);
    }
  }

  // Tooltip element selection
  const tooltip = document.getElementById("d3ChartTooltip");

  // Helper: test if data item matches active filter
  function isItemActive(d) {
    if (!chartActiveFilterRange) return false;
    return d.numericMonth >= chartActiveFilterRange.min && d.numericMonth <= chartActiveFilterRange.max;
  }

  function isItemDimmed(d) {
    if (!chartActiveFilterRange) return false;
    return !isItemActive(d);
  }

  // Draw Bars with immediate position and height
  const bars = g
    .selectAll(".d3-bar")
    .data(data)
    .enter()
    .append("rect")
    .attr("class", (d) => {
      let cls = `d3-bar ${d.zone}`;
      if (isItemActive(d)) cls += " selected-filter";
      else if (isItemDimmed(d)) cls += " dimmed";
      return cls;
    })
    .attr("x", (d) => xScale(d.monthLabel) || 0)
    .attr("width", xScale.bandwidth())
    .attr("y", (d) => yScale(chartMetric === "units" ? d.totalUnits : d.batchCount))
    .attr("height", (d) => Math.max(4, innerHeight - yScale(chartMetric === "units" ? d.totalUnits : d.batchCount)))
    .attr("fill", (d) => `url(#${d.gradientId})`)
    .attr("rx", 5)
    .attr("ry", 5);

  // Value Labels on Bars (centered directly above each bar)
  g.selectAll(".d3-bar-label")
    .data(data)
    .enter()
    .append("text")
    .attr("class", "d3-bar-label")
    .attr("x", (d) => (xScale(d.monthLabel) || 0) + xScale.bandwidth() / 2)
    .attr("y", (d) => yScale(chartMetric === "units" ? d.totalUnits : d.batchCount) - 6)
    .attr("text-anchor", "middle")
    .style("opacity", (d) => (isItemDimmed(d) ? 0.3 : 1))
    .text((d) => (chartMetric === "units" ? `${d.totalUnits}u` : `${d.batchCount}b`));

  // Interactivity: Hover Tooltip & Click Filtering
  bars
    .on("mouseover", function (event, d) {
      if (!chartActiveFilterRange) {
        bars.classed("dimmed", (other) => other.numericMonth !== d.numericMonth);
      }
      d3.select(this).style("filter", "brightness(1.15)");

      if (!tooltip) return;

      const itemsListHtml = d.batches
        .map(
          (b) => `
          <li>
            <span><strong>${b.brand_name.split(" ")[0]}</strong> (${b.active_salt.split(" ")[0]})</span>
            <span><strong>${b.stock_quantity} units</strong> &bull; ${b.physical_shelf_location}</span>
          </li>
        `
        )
        .join("");

      tooltip.innerHTML = `
        <h5>
          <span style="display:inline-block; width:9px; height:9px; border-radius:50%; background:${d.color};"></span>
          ${d.monthLabel} Expiry Horizon (${d.zoneLabel})
        </h5>
        <div class="d3-tooltip-stat">
          <strong>${d.totalUnits} units total</strong> across <strong>${d.batchCount} inventory batch${
        d.batchCount > 1 ? "es" : ""
      }</strong>
        </div>
        <ul class="d3-tooltip-items">
          ${itemsListHtml}
        </ul>
        <div class="d3-tooltip-advice ${d.zone}">
          ${d.advice}
        </div>
        <div style="font-size:0.65rem; color:#94a3b8; margin-top:5px; text-align:center;">
          &#128070; Click bar to filter inventory table to this horizon
        </div>
      `;

      tooltip.style.opacity = "1";
    })
    .on("mousemove", function (event) {
      if (!tooltip) return;
      const chartBox = container.getBoundingClientRect();
      const tooltipBox = tooltip.getBoundingClientRect();

      let left = event.clientX - chartBox.left + 14;
      let top = event.clientY - chartBox.top - tooltipBox.height / 2;

      // Bound within container
      if (left + tooltipBox.width > chartBox.width - 10) {
        left = event.clientX - chartBox.left - tooltipBox.width - 14;
      }
      if (top < 10) top = 10;
      if (top + tooltipBox.height > chartBox.height + 60) {
        top = chartBox.height + 50 - tooltipBox.height;
      }

      tooltip.style.left = `${Math.max(10, left)}px`;
      tooltip.style.top = `${top}px`;
    })
    .on("mouseout", function () {
      if (!chartActiveFilterRange) {
        bars.classed("dimmed", false);
      } else {
        bars.classed("dimmed", (other) => !isItemActive(other));
      }
      d3.select(this).style("filter", "none");

      if (tooltip) {
        tooltip.style.opacity = "0";
      }
    })
    .on("click", function (event, d) {
      if (
        chartActiveFilterRange &&
        chartActiveFilterRange.min === d.numericMonth &&
        chartActiveFilterRange.max === d.numericMonth
      ) {
        // Deselect
        chartActiveFilterRange = null;
        document.querySelectorAll(".zone-legend-item").forEach((item) => item.classList.remove("active-zone"));
        showToast("Cleared horizon filter: showing all inventory batches");
      } else {
        // Select specific month horizon
        chartActiveFilterRange = {
          min: d.numericMonth,
          max: d.numericMonth,
          label: `${d.monthLabel} (${d.zoneLabel})`
        };

        // Sync legend active class
        if (d.numericMonth <= 4) syncLegendActiveState("3-4");
        else if (d.numericMonth <= 7) syncLegendActiveState("5-7");
        else if (d.numericMonth <= 11) syncLegendActiveState("8-11");
        else syncLegendActiveState("12-24");

        showToast(`Filtered dashboard to ${d.monthLabel} batches (${d.totalUnits} units)`);
      }

      renderDashboard();
      renderExpiryD3Chart();
    });
}

/**
 * Resize Observer to automatically re-scale the D3 SVG whenever the wrapper or window resizes
 */
function setupChartResizeObserver() {
  const chartWrapper = document.getElementById("d3ChartWrapper");
  if (!chartWrapper) return;

  let resizeTimeout = null;
  const onResize = () => {
    if (resizeTimeout) clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      renderExpiryD3Chart();
    }, 120);
  };

  if (window.ResizeObserver) {
    chartResizeObserver = new ResizeObserver(() => {
      onResize();
    });
    chartResizeObserver.observe(chartWrapper);
  } else {
    window.addEventListener("resize", onResize);
  }
}

/**
 * Opens Customer Trust verification for a specific medicine clicked from the table
 */
function openCustomerTrustForMedicine(medicineId) {
  selectedRequestedId = medicineId;

  // Switch to Trust Tab or Show Modal
  const reqSelect = document.getElementById("requestedBrandSelect");
  if (reqSelect) {
    reqSelect.value = String(selectedRequestedId);
  }

  autoSuggestSubstitute();
  runTrustMatcher();

  // Switch view to Trust Tab for primary full presentation
  const dashboardTab = document.getElementById("tabDashboard");
  const trustTab = document.getElementById("tabTrust");
  const dashboardPanel = document.getElementById("dashboardPanel");
  const trustPanel = document.getElementById("trustPanel");

  trustTab?.classList.add("active");
  dashboardTab?.classList.remove("active");
  if (trustPanel) trustPanel.style.display = "flex";
  if (dashboardPanel) dashboardPanel.style.display = "none";

  window.scrollTo({ top: 0, behavior: "smooth" });
}

/**
 * PART 3: The JavaScript "Trust Matcher" & Element-by-Element Comparison Algorithm
 * Compares each individual element of two medicines:
 * 1. Active Chemical Salt (API Molecule & Strength)
 * 2. Commercial Brand & Manufacturer
 * 3. Formulation & Dosage Presentation
 * 4. Therapeutic Category & Clinical Indications
 * 5. Batch Expiry Shelf-Life (e.g. 10 mo vs 3 mo customer freshness demand)
 * 6. In-Hand Stock Quantity (with Low Stock <10 warning badge)
 * 7. Physical Shelf Coordinates for instant retrieval
 * 8. Packaging Barcode / GTIN SKU
 * 9. Clinical Bioequivalence & Substitution Clearance Verdict
 */
function buildElementComparisonTable(reqItem, subItem, isMatch, expiryDiff) {
  const isCategoryMatch = (reqItem.therapeutic_category || "").trim().toLowerCase() ===
                          (subItem.therapeutic_category || "").trim().toLowerCase();

  const isBrandMatch = reqItem.brand_name.trim().toLowerCase() === subItem.brand_name.trim().toLowerCase();

  const elements = [
    {
      icon: "&#129514;",
      name: "Active Chemical Molecule",
      desc: "Core therapeutic API salt & milligram strength",
      valA: `<strong>${reqItem.active_salt}</strong>`,
      valB: `<strong>${subItem.active_salt}</strong>`,
      isRowMatch: isMatch,
      statusHtml: isMatch
        ? `<span class="comp-status-badge identical">&#10003; 100% Identical Active Salt</span>`
        : `<span class="comp-status-badge mismatch">&#9888; Chemical Mismatch</span>`
    },
    {
      icon: "&#127991;&#65039;",
      name: "Commercial Brand & Maker",
      desc: "Marketing brand name & pharmaceutical laboratory",
      valA: `<strong>${reqItem.brand_name}</strong>`,
      valB: `<strong>${subItem.brand_name}</strong>`,
      isRowMatch: true,
      statusHtml: isBrandMatch
        ? `<span class="comp-status-badge identical">&#10003; Same Brand Formulation</span>`
        : `<span class="comp-status-badge neutral">Different Manufacturer (Excipients Only)</span>`
    },
    {
      icon: "&#128138;",
      name: "Dosage Formulation",
      desc: "Tablet release, delivery route & presentation",
      valA: `${reqItem.medicine_name}`,
      valB: `${subItem.medicine_name}`,
      isRowMatch: isMatch,
      statusHtml: isMatch
        ? `<span class="comp-status-badge identical">&#10003; Bioequivalent Route</span>`
        : `<span class="comp-status-badge neutral">Distinct Dosage Formulation</span>`
    },
    {
      icon: "&#129658;",
      name: "Therapeutic Category",
      desc: "Clinical action & pharmacological disease target",
      valA: `<strong>${reqItem.therapeutic_category || 'Therapeutic Agent'}</strong>`,
      valB: `<strong>${subItem.therapeutic_category || 'Therapeutic Agent'}</strong>`,
      isRowMatch: isCategoryMatch,
      statusHtml: isCategoryMatch
        ? `<span class="comp-status-badge identical">&#10003; Identical Clinical Indication</span>`
        : `<span class="comp-status-badge mismatch">&#9888; Different Therapeutic Class</span>`
    },
    {
      icon: "&#128197;",
      name: "Batch Expiry Shelf-Life",
      desc: "Customer demand check: 8-10+ months target freshness",
      valA: `<strong>${reqItem.expiry_date_months} Months</strong> <span class="expiry-badge ${reqItem.expiry_date_months <= 4 ? 'warning' : 'safe'}" style="font-size:0.68rem; margin-left:4px;">${reqItem.expiry_date_months <= 4 ? 'Short (3-4 mo)' : 'Fresh (8-10+)'}</span>`,
      valB: `<strong>${subItem.expiry_date_months} Months</strong> <span class="expiry-badge ${subItem.expiry_date_months <= 4 ? 'warning' : 'safe'}" style="font-size:0.68rem; margin-left:4px;">${subItem.expiry_date_months <= 4 ? 'Short (3-4 mo)' : 'Fresh (8-10+)'}</span>`,
      isRowMatch: true,
      statusHtml: expiryDiff > 0
        ? `<span class="comp-status-badge advantage">&#9733; +${expiryDiff} Mo Fresher (Solves Expiry Demand)</span>`
        : (expiryDiff === 0
          ? `<span class="comp-status-badge neutral">Equal Shelf-Life Duration</span>`
          : `<span class="comp-status-badge warning">${Math.abs(expiryDiff)} Mo Shorter Expiry</span>`)
    },
    {
      icon: "&#128230;",
      name: "Stock Quantity & Status",
      desc: "Physical inventory available with low-stock alert (<10)",
      valA: `<strong>${reqItem.stock_quantity}</strong> units ${reqItem.stock_quantity < 10 ? '<span class="low-stock-badge" style="font-size:0.65rem; margin-left:4px;">&#9888; Low Stock</span>' : '<span style="color:#15803d; font-size:0.75rem; margin-left:4px;">&#10003; In Stock</span>'}`,
      valB: `<strong>${subItem.stock_quantity}</strong> units ${subItem.stock_quantity < 10 ? '<span class="low-stock-badge" style="font-size:0.65rem; margin-left:4px;">&#9888; Low Stock</span>' : '<span style="color:#15803d; font-size:0.75rem; margin-left:4px;">&#10003; In Stock</span>'}`,
      isRowMatch: true,
      statusHtml: (subItem.stock_quantity < 10)
        ? `<span class="comp-status-badge warning">&#9888; Medicine B Low Stock (&lt;10)</span>`
        : `<span class="comp-status-badge identical">&#10003; Readily Available</span>`
    },
    {
      icon: "&#128205;",
      name: "Dispensary Shelf Location",
      desc: "Physical rack coordinates for instant pharmacist pickup",
      valA: `<span class="shelf-badge" style="font-size:0.75rem;"><span class="shelf-icon">&#9638;</span> ${reqItem.physical_shelf_location}</span>`,
      valB: `<span class="shelf-badge" style="font-size:0.75rem;"><span class="shelf-icon">&#9638;</span> ${subItem.physical_shelf_location}</span>`,
      isRowMatch: true,
      statusHtml: `<span class="comp-status-badge neutral">&#9638; Shelf Coordinates Verified</span>`
    },
    {
      icon: "&#128290;",
      name: "Package Barcode / SKU",
      desc: "Scannable packaging code identifier for POS verification",
      valA: `<span style="font-family:monospace; font-size:0.8rem; color:var(--slate-700);">${reqItem.barcode || 'N/A'}</span>`,
      valB: `<span style="font-family:monospace; font-size:0.8rem; color:var(--slate-700);">${subItem.barcode || 'N/A'}</span>`,
      isRowMatch: true,
      statusHtml: `<span class="comp-status-badge neutral">Registered Packaging SKU</span>`
    },
    {
      icon: "&#9878;&#65039;",
      name: "Interchangeability Verdict",
      desc: "Clinical & regulatory bioequivalent substitution clearance",
      valA: `<span style="color:var(--slate-600); font-size:0.82rem;">Reference Standard</span>`,
      valB: isMatch
        ? `<strong style="color:#15803d;">Certified Bioequivalent Substitute</strong>`
        : `<strong style="color:#b91c1c;">Incompatible Compound</strong>`,
      isRowMatch: isMatch,
      statusHtml: isMatch
        ? `<span class="comp-status-badge identical">&#10003; Safe to Dispense</span>`
        : `<span class="comp-status-badge mismatch">&#9940; Substitution Prohibited</span>`
    }
  ];

  return `
    <div class="elements-comparison-section">
      <div class="elements-comparison-header">
        <div>
          <h4>&#128203; Element-by-Element Comparative Matrix</h4>
          <p>Side-by-side audit comparing active salts, therapeutic indication, batch expiry, shelf locations, and inventory</p>
        </div>
        <span class="trust-badge-pill" style="font-size:0.7rem; background:${isMatch ? 'var(--primary-blue-light)' : '#fee2e2'}; color:${isMatch ? 'var(--primary-blue)' : '#b91c1c'}; border-color:${isMatch ? 'var(--primary-blue-border)' : '#fca5a5'};">
          ${isMatch ? 'Bioequivalent Pair' : 'Mismatch Analysis'}
        </span>
      </div>
      <div class="comparison-matrix-table-wrap">
        <table class="elements-comparison-table">
          <thead>
            <tr>
              <th style="width: 28%;">Pharmaceutical Element</th>
              <th class="col-med-a" style="width: 26%;">Medicine A (${reqItem.brand_name})</th>
              <th class="col-med-b" style="width: 26%;">Medicine B (${subItem.brand_name})</th>
              <th class="col-status" style="width: 20%;">Comparison Status</th>
            </tr>
          </thead>
          <tbody>
            ${elements.map((el) => `
              <tr class="${!el.isRowMatch ? 'row-mismatch-highlight' : ''}">
                <td>
                  <div class="comp-element-meta">
                    <span class="comp-element-icon">${el.icon}</span>
                    <div>
                      <span class="comp-element-title">${el.name}</span>
                      <span class="comp-element-desc">${el.desc}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div class="comp-val-box">
                    <div class="comp-val-main">${el.valA}</div>
                  </div>
                </td>
                <td>
                  <div class="comp-val-box">
                    <div class="comp-val-main">${el.valB}</div>
                  </div>
                </td>
                <td style="text-align: center;">
                  ${el.statusHtml}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function runTrustMatcher() {
  const reqItem = inventoryData.find((i) => i.id === selectedRequestedId);
  const subItem = inventoryData.find((i) => i.id === selectedSubstituteId);

  if (!reqItem || !subItem) return;

  const matchContainer = document.getElementById("trustVerificationResult");
  if (!matchContainer) return;

  // Normalize active salt strings
  const saltA = reqItem.active_salt.trim().toLowerCase();
  const saltB = subItem.active_salt.trim().toLowerCase();
  const isMatch = saltA === saltB && saltA.length > 0;

  // Calculate expiry advantage
  const expiryDiff = subItem.expiry_date_months - reqItem.expiry_date_months;
  const isSubstituteFresher = expiryDiff > 0;

  const elementsTableHTML = buildElementComparisonTable(reqItem, subItem, isMatch, expiryDiff);

  if (isMatch) {
    matchContainer.innerHTML = `
      <div class="trust-card-top-header">
        <span class="trust-badge-pill">Customer Trust Interface</span>
        <h2 class="trust-card-title">Substitution Verification</h2>
        <p class="trust-card-subtitle">Scientifically validated bio-identical matches</p>
      </div>

      <!-- Side-by-Side Comparison Grid -->
      <div class="comparison-grid">
        <!-- Requested Brand Card -->
        <div class="side-card requested">
          <div class="side-card-corner-badge">
            <svg style="width:12px; height:12px;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a3 3 0 00-3-3H8z"></path>
            </svg>
          </div>
          <div class="card-role-label">Medicine A (Requested Brand)</div>
          <div class="card-medicine-name">${reqItem.brand_name}</div>
          <div class="card-brand-maker">${reqItem.medicine_name}</div>
          <div style="font-size:0.75rem; color:var(--slate-500); margin-top:4px;">
            Expiry: <strong>${reqItem.expiry_date_months} mo</strong> &bull; Stock: <strong>${reqItem.stock_quantity}</strong>
          </div>
          <div class="indicator-line"></div>
        </div>

        <!-- Available Substitute Card -->
        <div class="side-card substitute">
          <div class="side-card-corner-badge">
            <svg style="width:12px; height:12px;" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"></path>
            </svg>
          </div>
          <div class="card-role-label">Medicine B (Available Substitute)</div>
          <div class="card-medicine-name">${subItem.brand_name}</div>
          <div class="card-brand-maker">${subItem.medicine_name}</div>
          <div style="font-size:0.75rem; color:var(--slate-500); margin-top:4px;">
            Expiry: <strong>${subItem.expiry_date_months} mo</strong> &bull; Stock: <strong>${subItem.stock_quantity}</strong>
          </div>
          <div class="indicator-line"></div>
        </div>
      </div>

      <!-- Center Bio-Identical Match Box -->
      <div class="center-match-box">
        <div class="match-circle-large">
          <span class="match-number">100%</span>
          <span class="match-pill-tag">Match</span>
        </div>
        <h3>Chemical Identity Match</h3>
        <p class="match-explanation-paragraph">
          Both brands contain <span class="active-molecule-highlight">${reqItem.active_salt}</span>. 
          The active therapeutic molecule is identical, providing the exact same clinical relief, bio-absorption, and safety profile.
        </p>

        <div class="feature-mini-grid">
          <div class="mini-spec-item">
            <span class="spec-label">Active Salt:</span>
            <span class="spec-value" style="color:var(--primary-blue);">${reqItem.active_salt}</span>
          </div>
          <div class="mini-spec-item">
            <span class="spec-label">Bio-Equivalence:</span>
            <span class="spec-value" style="color:#15803d;">&#10003; 100% Identical</span>
          </div>
          <div class="mini-spec-item">
            <span class="spec-label">Expiry Offered:</span>
            <span class="spec-value" style="color:#15803d;">${subItem.expiry_date_months} Mo (${subItem.expiry_date_months >= 8 ? "Safe/Fresh" : "Active"})</span>
          </div>
          <div class="mini-spec-item">
            <span class="spec-label">Shelf Location:</span>
            <span class="spec-value" style="font-family:monospace; color:var(--primary-blue);">${subItem.physical_shelf_location}</span>
          </div>
        </div>
      </div>

      <!-- Freshness Advantage Box -->
      ${
        isSubstituteFresher
          ? `
        <div class="freshness-advantage-box">
          <div class="advantage-left">
            <span class="advantage-icon">&#128197;</span>
            <div class="advantage-text">
              <h5>Customer Expiry Demand Solved: +${expiryDiff} Extra Months of Freshness</h5>
              <p>
                The customer demanded 8-10+ month expiry: this substitute batch gives 
                <strong>${subItem.expiry_date_months} months</strong> vs ${reqItem.expiry_date_months} months on the requested brand.
              </p>
            </div>
          </div>
          <span class="shelf-badge">${subItem.physical_shelf_location}</span>
        </div>
        `
          : ""
      }

      <!-- Detailed Element-by-Element Comparative Table -->
      ${elementsTableHTML}

      <!-- Proceed with Substitution & Print Patient Slip Actions -->
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
        <button class="btn-proceed-substitution" id="btnProceedSubstitution" type="button" style="flex:1; margin-top:0;">
          <svg fill="currentColor" viewBox="0 0 20 20" style="width:18px; height:18px; margin-right:8px; display:inline-block; vertical-align:middle;">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"></path>
            <path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clip-rule="evenodd"></path>
          </svg>
          ⚡ Dispense Substitute (${subItem.brand_name})
        </button>
        <button class="btn-trust-slip-action" id="btnCardPrintTrustSlip" type="button" style="padding:10px 18px; font-size:0.86rem; cursor:pointer;">
          <span>🖨️</span> Patient Trust Certificate
        </button>
      </div>
    `;

    // Add click handlers
    document.getElementById("btnProceedSubstitution")?.addEventListener("click", () => {
      openDispenseModal(subItem.id, 1);
    });

    document.getElementById("btnCardPrintTrustSlip")?.addEventListener("click", () => {
      openTrustCertificateModal(reqItem.id, subItem.id);
    });
  } else {
    // Chemical Mismatch Warning with full comparative elements
    matchContainer.innerHTML = `
      <div class="match-score-header" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
        <div class="score-visual-group">
          <div class="checkmark-circle" style="color: #dc2626;">&#10007;</div>
          <div class="score-titles">
            <h3>Chemical Incompatibility Detected</h3>
            <p>Different Active Chemical Ingredients</p>
          </div>
        </div>
        <div class="scientific-badge" style="background: rgba(0,0,0,0.2);">
          Requires Physician Approval
        </div>
      </div>

      <!-- Side-by-Side Comparison Grid -->
      <div class="comparison-grid">
        <!-- Requested Brand Card -->
        <div class="side-card requested">
          <div class="card-role-label">Medicine A</div>
          <div class="card-medicine-name">${reqItem.brand_name}</div>
          <div class="card-brand-maker">${reqItem.medicine_name}</div>
          <div style="font-size:0.75rem; color:var(--slate-500); margin-top:4px;">
            Salt: <strong>${reqItem.active_salt}</strong>
          </div>
          <div class="indicator-line"></div>
        </div>

        <!-- Available Substitute Card -->
        <div class="side-card substitute" style="border-color:#fecaca;">
          <div class="card-role-label" style="color:#b91c1c;">Medicine B</div>
          <div class="card-medicine-name">${subItem.brand_name}</div>
          <div class="card-brand-maker">${subItem.medicine_name}</div>
          <div style="font-size:0.75rem; color:var(--slate-500); margin-top:4px;">
            Salt: <strong>${subItem.active_salt}</strong>
          </div>
          <div class="indicator-line" style="background:#ef4444;"></div>
        </div>
      </div>

      <div class="plain-language-explanation" style="background: #fef2f2; border-color: #fecaca; margin-top: 18px;">
        <div class="explanation-icon" style="color: #dc2626;">&#9888;&#65039;</div>
        <div class="explanation-text">
          <h4 style="color: #991b1b;">Cannot Substitute Automatically</h4>
          <p style="color: #7f1d1d;">
            <strong>${reqItem.brand_name}</strong> contains <em>${reqItem.active_salt}</em> (${reqItem.therapeutic_category || 'Therapeutic Agent'}), whereas 
            <strong>${subItem.brand_name}</strong> contains <em>${subItem.active_salt}</em> (${subItem.therapeutic_category || 'Therapeutic Agent'}). 
            Because these are pharmacologically distinct compounds, substitution cannot be safely performed without a doctor's prescription.
          </p>
        </div>
      </div>

      <!-- Detailed Element-by-Element Comparative Table -->
      ${elementsTableHTML}

      <!-- Safe Substitute Finder CTA -->
      <button class="btn-proceed-substitution" id="btnAutoFindSafeSubstitute" type="button" style="background:#dc2626;">
        &#128269; Auto-Select Bio-Identical Substitute for ${reqItem.brand_name}
      </button>
    `;

    document.getElementById("btnAutoFindSafeSubstitute")?.addEventListener("click", () => {
      autoSuggestSubstitute();
      runTrustMatcher();
      showToast(`&#10003; Switched Medicine B to verified bioequivalent substitute`);
    });
  }
}

/**
 * Toast Notification Utility
 */
function showToast(message) {
  let toast = document.getElementById("professionalToast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "professionalToast";
    toast.className = "professional-toast";
    document.body.appendChild(toast);
  }
  toast.innerHTML = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3600);
}

/* ==========================================================================
   Part 4: Camera-Based QR Code & Barcode Scanner Logic
   ========================================================================== */

let html5QrCode = null;
let isScannerRunning = false;

/**
 * High-pitch acoustic scan confirmation chime using Web Audio API
 */
function playScanSuccessChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.16);

    if (navigator.vibrate) {
      navigator.vibrate([60, 40, 60]);
    }
  } catch (e) {
    // Silent fallback
  }
}

/**
 * Searches the inventory database by scanned string:
 * 1. Exact barcode number match (EAN-13, UPC, Code-128)
 * 2. Embedded QR JSON payload
 * 3. Exact medicine ID
 * 4. Fuzzy medicine/brand name
 */
function lookupMedicineByCode(rawCode) {
  if (!rawCode) return null;
  const cleaned = rawCode.trim().toLowerCase();

  // 1. Direct barcode match
  let match = inventoryData.find(
    (item) => item.barcode && item.barcode.toLowerCase() === cleaned
  );
  if (match) return match;

  // 2. Embedded JSON QR code
  try {
    const parsed = JSON.parse(rawCode);
    if (parsed) {
      match = inventoryData.find(
        (item) =>
          (parsed.barcode && item.barcode && item.barcode.toLowerCase() === String(parsed.barcode).toLowerCase()) ||
          (parsed.id && item.id === Number(parsed.id)) ||
          (parsed.name && item.medicine_name.toLowerCase().includes(parsed.name.toLowerCase()))
      );
      if (match) return match;
    }
  } catch (e) {}

  // 3. Direct ID match
  const idNum = parseInt(cleaned.replace(/\D/g, ""), 10);
  if (!isNaN(idNum)) {
    match = inventoryData.find((item) => item.id === idNum);
    if (match) return match;
  }

  // 4. Fuzzy brand or medicine match
  match = inventoryData.find(
    (item) =>
      item.medicine_name.toLowerCase().includes(cleaned) ||
      item.brand_name.toLowerCase().includes(cleaned) ||
      item.active_salt.toLowerCase().includes(cleaned)
  );

  return match || null;
}

/**
 * Handles recognized barcode or QR code
 */
function handleScannedCode(codeString) {
  playScanSuccessChime();

  const resultContainer = document.getElementById("scannedResultCard");
  const statusText = document.getElementById("scannerStatusText");

  if (!resultContainer) return;

  const matched = lookupMedicineByCode(codeString);

  if (matched) {
    if (statusText) statusText.textContent = `Match recognized: ${matched.brand_name}`;

    const isWarning = matched.expiry_date_months >= 3 && matched.expiry_date_months <= 4;
    const isSafe = matched.expiry_date_months >= 8;
    const badgeClass = isWarning ? "warning" : isSafe ? "safe" : "standard";
    const statusNote = isWarning
      ? `&#9888;&#65039; ${matched.expiry_date_months} Mo (Warning: Short Expiry)`
      : isSafe
      ? `&#9989; ${matched.expiry_date_months} Mo (Safe/Fresh: Meets 8-10+ Demands)`
      : `${matched.expiry_date_months} Months`;

    resultContainer.innerHTML = `
      <div class="result-header-row">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem; color:#15803d;">&#9989;</span>
          <div>
            <strong style="color:var(--slate-900); font-size:0.96rem; display:block;">Medicine Packaging Recognized</strong>
            <span style="font-size:0.72rem; color:var(--slate-500);">Verified against inventory database</span>
          </div>
        </div>
        <span class="result-code-tag">&#128246; ${codeString}</span>
      </div>

      <div class="result-main-grid">
        <div class="result-field">
          <span class="result-field-label">Packaging Brand</span>
          <span class="result-field-val">${matched.brand_name}</span>
          <span style="font-size:0.75rem; color:var(--slate-500);">${matched.medicine_name}</span>
        </div>

        <div class="result-field">
          <span class="result-field-label">Active Chemical Salt</span>
          <span class="result-field-val" style="color:var(--primary-blue);">&#129514; ${matched.active_salt}</span>
        </div>

        <div class="result-field">
          <span class="result-field-label">Expiry Batch Status</span>
          <span class="result-field-val">
            <span class="expiry-badge ${badgeClass}">${statusNote}</span>
          </span>
        </div>

        <div class="result-field">
          <span class="result-field-label">Physical Shelf Location</span>
          <span class="result-field-val">
            <span class="shelf-badge" style="font-size:0.88rem;"><span class="shelf-icon">&#9638;</span> ${matched.physical_shelf_location}</span>
          </span>
        </div>

        <div class="result-field">
          <span class="result-field-label">Current Stock In-Hand</span>
          <span class="result-field-val">
            <strong>${matched.stock_quantity}</strong> units available
            ${
              matched.stock_quantity < 10
                ? `<span class="low-stock-badge" style="margin-left:6px;"><span class="low-stock-icon">&#9888;&#65039;</span> Low Stock</span>`
                : ""
            }
          </span>
        </div>

        <div class="result-field">
          <span class="result-field-label">Packaging Barcode</span>
          <span class="result-field-val" style="font-family:monospace; font-size:0.8rem; color:var(--slate-600);">${matched.barcode || 'N/A'}</span>
        </div>
      </div>

      <div class="result-actions-row">
        <button type="button" class="btn-result-action primary" id="btnScannerDispense" style="background:#059669; border-color:#047857;">
          ⚡ Dispense 1 Unit
        </button>
        <button type="button" class="btn-result-action primary" id="btnLocateOnShelf">
          &#128269; View Shelf on Dashboard
        </button>
        <button type="button" class="btn-result-action secondary" id="btnCompareBioequivalent" style="background:#eff6ff; color:var(--primary-blue); border-color:#bfdbfe;">
          &#129309; Bioequivalent Substitutes
        </button>
        <button type="button" class="btn-result-action secondary" id="btnScanAnother">
          &#128247; Scan Next Item
        </button>
      </div>
    `;

    resultContainer.style.display = "flex";

    // Bind action buttons
    document.getElementById("btnScannerDispense")?.addEventListener("click", () => {
      closeScannerModal();
      openDispenseModal(matched.id, 1);
    });

    document.getElementById("btnLocateOnShelf")?.addEventListener("click", () => {
      closeScannerModal();

      // Switch to dashboard tab
      const dashboardTab = document.getElementById("tabDashboard");
      const dashboardPanel = document.getElementById("dashboardPanel");
      const trustPanel = document.getElementById("trustPanel");
      const searchInput = document.getElementById("medicineSearchInput");

      dashboardTab?.classList.add("active");
      document.getElementById("tabTrust")?.classList.remove("active");
      document.getElementById("tabSplit")?.classList.remove("active");
      document.querySelector(".app-wrapper")?.classList.remove("split-mode");

      if (dashboardPanel) dashboardPanel.style.display = "flex";
      if (trustPanel) trustPanel.style.display = "none";

      searchQuery = matched.medicine_name;
      if (searchInput) searchInput.value = matched.medicine_name;
      currentFilter = "all";
      document.querySelectorAll(".filter-pill-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === "all");
      });

      renderDashboard();

      // Scroll and highlight row with pulse effect
      setTimeout(() => {
        const targetRow = document.getElementById(`row-med-${matched.id}`);
        if (targetRow) {
          targetRow.scrollIntoView({ behavior: "smooth", block: "center" });
          targetRow.style.transition = "outline 0.2s ease, transform 0.2s ease";
          targetRow.style.outline = "3px solid #2563eb";
          targetRow.style.transform = "scale(1.01)";
          setTimeout(() => {
            targetRow.style.outline = "";
            targetRow.style.transform = "";
          }, 2400);
        }
      }, 200);

      showToast(`&#128269; Located ${matched.brand_name} at ${matched.physical_shelf_location}`);
    });

    document.getElementById("btnCompareBioequivalent")?.addEventListener("click", () => {
      closeScannerModal();

      selectedRequestedId = matched.id;
      const candidate = inventoryData.find(
        (sub) => sub.active_salt === matched.active_salt && sub.id !== matched.id
      );
      if (candidate) {
        selectedSubstituteId = candidate.id;
      }

      populateDropdownSelectors();
      runTrustMatcher();

      const trustTab = document.getElementById("tabTrust");
      const dashboardPanel = document.getElementById("dashboardPanel");
      const trustPanel = document.getElementById("trustPanel");

      trustTab?.classList.add("active");
      document.getElementById("tabDashboard")?.classList.remove("active");
      document.getElementById("tabSplit")?.classList.remove("active");
      document.querySelector(".app-wrapper")?.classList.remove("split-mode");

      if (dashboardPanel) dashboardPanel.style.display = "none";
      if (trustPanel) trustPanel.style.display = "flex";

      showToast(`&#129309; Loaded 100% Bioequivalent analysis for ${matched.brand_name}`);
    });

    document.getElementById("btnScanAnother")?.addEventListener("click", () => {
      resultContainer.style.display = "none";
      if (statusText) statusText.textContent = "Camera Active: Point at packaging barcode / QR";
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          html5QrCode.resume();
        } catch (e) {}
      }
    });
  } else {
    // Unrecognized code
    if (statusText) statusText.textContent = `Barcode ${codeString} not found in inventory`;
    resultContainer.innerHTML = `
      <div class="result-header-row">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:1.2rem; color:#dc2626;">&#9888;&#65039;</span>
          <strong style="color:var(--slate-900); font-size:0.95rem;">Unrecognized Packaging Barcode</strong>
        </div>
        <span class="result-code-tag" style="color:#b91c1c; background:#fee2e2; border-color:#fecaca;">&#128246; ${codeString}</span>
      </div>
      <p style="font-size:0.82rem; color:var(--slate-600); margin:0;">
        This code is not in the pharmacy inventory database. Try scanning another medicine or search by generic active salt.
      </p>
      <div class="result-actions-row">
        <button type="button" class="btn-result-action secondary" id="btnRetryScan">
          &#128247; Scan Another Box
        </button>
      </div>
    `;
    resultContainer.style.display = "flex";
    document.getElementById("btnRetryScan")?.addEventListener("click", () => {
      resultContainer.style.display = "none";
      if (statusText) statusText.textContent = "Camera Active: Point at packaging barcode / QR";
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          html5QrCode.resume();
        } catch (e) {}
      }
    });
  }
}

/**
 * Start camera feed for optical barcode scanning
 */
async function startCameraScanner(cameraId) {
  const statusText = document.getElementById("scannerStatusText");
  const deviceSelect = document.getElementById("cameraDeviceSelect");

  if (!html5QrCode) {
    html5QrCode = new Html5Qrcode("qrReader");
  }

  // Populate cameras if available
  try {
    const devices = await Html5Qrcode.getCameras();
    if (devices && devices.length && deviceSelect) {
      deviceSelect.innerHTML = "";
      devices.forEach((dev, idx) => {
        const opt = document.createElement("option");
        opt.value = dev.id;
        opt.textContent = dev.label || `Camera ${idx + 1}`;
        deviceSelect.appendChild(opt);
      });
      if (cameraId) {
        deviceSelect.value = cameraId;
      }
    }
  } catch (err) {
    console.warn("Could not enumerate camera devices:", err);
  }

  const cameraConfig = cameraId ? { deviceId: { exact: cameraId } } : { facingMode: "environment" };
  const config = {
    fps: 15,
    qrbox: (viewfinderWidth, viewfinderHeight) => {
      const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
      return {
        width: Math.min(Math.floor(minEdge * 0.85), 280),
        height: Math.min(Math.floor(minEdge * 0.65), 180)
      };
    },
    aspectRatio: 1.333333
  };

  try {
    if (statusText) statusText.textContent = "Starting camera stream...";
    await html5QrCode.start(
      cameraConfig,
      config,
      (decodedText) => {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.pause();
          }
        } catch (e) {}
        handleScannedCode(decodedText);
      },
      (error) => {
        // Continuous search frame error, ignore
      }
    );
    isScannerRunning = true;
    if (statusText) statusText.textContent = "Camera Active: Align packaging barcode inside reticle";
  } catch (err) {
    console.warn("Camera start error:", err);
    isScannerRunning = false;
    if (statusText) {
      statusText.textContent = "Camera unavailable in sandbox: Click quick test chips below or upload image";
    }
  }
}

/**
 * Stop camera scanner
 */
async function stopCameraScanner() {
  if (html5QrCode && isScannerRunning) {
    try {
      await html5QrCode.stop();
    } catch (err) {
      console.warn("Error stopping scanner:", err);
    }
    isScannerRunning = false;
  }
}

/**
 * Open scanner modal dialog
 */
function openScannerModal() {
  const modal = document.getElementById("scannerModal");
  const resultContainer = document.getElementById("scannedResultCard");
  if (!modal) return;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  if (resultContainer) resultContainer.style.display = "none";

  startCameraScanner();
}

/**
 * Close scanner modal dialog
 */
function closeScannerModal() {
  const modal = document.getElementById("scannerModal");
  if (!modal) return;

  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");

  stopCameraScanner();
}

/**
 * Setup Scanner UI and listeners
 */
function setupScannerLogic() {
  const openBtn = document.getElementById("openScannerBtn");
  const closeBtn = document.getElementById("closeScannerModalBtn");
  const modal = document.getElementById("scannerModal");
  const fileInput = document.getElementById("barcodeFileInput");
  const toggleStreamBtn = document.getElementById("toggleCameraStreamBtn");
  const cameraSelect = document.getElementById("cameraDeviceSelect");

  openBtn?.addEventListener("click", openScannerModal);
  closeBtn?.addEventListener("click", closeScannerModal);

  // Close when clicking modal backdrop
  modal?.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeScannerModal();
    }
  });

  // Camera device selector switch
  cameraSelect?.addEventListener("change", async () => {
    const newDeviceId = cameraSelect.value;
    await stopCameraScanner();
    startCameraScanner(newDeviceId);
  });

  // Pause / Resume camera stream button
  toggleStreamBtn?.addEventListener("click", () => {
    if (!html5QrCode) return;
    if (html5QrCode.isScanning) {
      html5QrCode.pause();
      toggleStreamBtn.innerHTML = "&#9654;&#65039; Resume Camera";
      const statusText = document.getElementById("scannerStatusText");
      if (statusText) statusText.textContent = "Camera paused";
    } else {
      try {
        html5QrCode.resume();
        toggleStreamBtn.innerHTML = "&#9208;&#65039; Pause Camera";
        const statusText = document.getElementById("scannerStatusText");
        if (statusText) statusText.textContent = "Camera Active: Align barcode inside reticle";
      } catch (e) {
        startCameraScanner();
      }
    }
  });

  // Image file scanner upload
  fileInput?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const statusText = document.getElementById("scannerStatusText");
    if (statusText) statusText.textContent = `Scanning image: ${file.name}...`;

    try {
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qrReader");
      }
      if (isScannerRunning) {
        await stopCameraScanner();
      }
      const decodedText = await html5QrCode.scanFile(file, true);
      handleScannedCode(decodedText);
    } catch (err) {
      if (statusText) statusText.textContent = "No valid barcode or QR code detected in image";
      showToast("&#9888;&#65039; No barcode or QR code detected in image");
    }
  });

  // Interactive Quick Demo Barcode Simulation Chips
  document.querySelectorAll(".demo-barcode-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const barcode = chip.getAttribute("data-barcode");
      if (barcode) {
        handleScannedCode(barcode);
      }
    });
  });

  // Initialize Essential Operational Features (Dispensing, Certificates, Inward Intake, Restock PO & Audit Trail)
  initEssentialFeatures();
}

// ============================================================================
// ESSENTIAL OPERATIONAL FEATURES IMPLEMENTATION
// 1. Counter Dispensing & Low Stock Intelligence
// 2. Patient Bioequivalence Certificate & Trust Receipt
// 3. Inward Stock Intake
// 4. Supplier Restock Purchase Order (PO) Generator
// 5. Live Dispensary Audit Trail & Compliance Ledger
// ============================================================================

/**
 * Initialize and bind event listeners for all 5 essential dispensary features
 */
function initEssentialFeatures() {
  // 1. Dispense Modal Listeners
  const dispenseModal = document.getElementById("dispenseModal");
  const closeDispenseBtn = document.getElementById("closeDispenseModalBtn");
  const btnCancelDispense = document.getElementById("btnCancelDispense");
  const btnConfirmDispense = document.getElementById("btnConfirmDispense");
  const dispenseQtyInput = document.getElementById("dispenseQtyInput");
  const btnDispenseDec = document.getElementById("btnDispenseDec");
  const btnDispenseInc = document.getElementById("btnDispenseInc");

  closeDispenseBtn?.addEventListener("click", closeDispenseModal);
  btnCancelDispense?.addEventListener("click", closeDispenseModal);
  dispenseModal?.addEventListener("click", (e) => {
    if (e.target === dispenseModal) closeDispenseModal();
  });

  btnDispenseDec?.addEventListener("click", () => {
    if (activeDispenseQty > 1) {
      activeDispenseQty--;
      if (dispenseQtyInput) dispenseQtyInput.value = String(activeDispenseQty);
      syncDispensePresetChips();
      updateDispenseForecast();
      playAudioChime("click");
    }
  });

  btnDispenseInc?.addEventListener("click", () => {
    activeDispenseQty++;
    if (dispenseQtyInput) dispenseQtyInput.value = String(activeDispenseQty);
    syncDispensePresetChips();
    updateDispenseForecast();
    playAudioChime("click");
  });

  dispenseQtyInput?.addEventListener("input", (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1) {
      activeDispenseQty = val;
      syncDispensePresetChips();
      updateDispenseForecast();
    }
  });

  // Quick Preset Chips in Dispense Modal
  document.querySelectorAll(".dispense-preset-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const qty = parseInt(chip.getAttribute("data-qty"), 10);
      if (qty >= 1) {
        activeDispenseQty = qty;
        if (dispenseQtyInput) dispenseQtyInput.value = String(qty);
        syncDispensePresetChips();
        updateDispenseForecast();
        playAudioChime("click");
      }
    });
  });

  btnConfirmDispense?.addEventListener("click", confirmDispenseAction);

  // 2. Patient Bioequivalence Certificate Modal Listeners
  const trustCertModal = document.getElementById("trustCertificateModal");
  const openTrustCertBtn = document.getElementById("openTrustCertificateBtn");
  const closeTrustCertBtn = document.getElementById("closeTrustCertModalBtn");
  const btnPrintCertAction = document.getElementById("btnPrintCertificateAction");

  openTrustCertBtn?.addEventListener("click", () => {
    openTrustCertificateModal(selectedRequestedId, selectedSubstituteId);
  });
  closeTrustCertBtn?.addEventListener("click", closeTrustCertificateModal);
  trustCertModal?.addEventListener("click", (e) => {
    if (e.target === trustCertModal) closeTrustCertificateModal();
  });
  btnPrintCertAction?.addEventListener("click", () => {
    window.print();
  });

  // 3. Inward Stock Intake Modal Listeners
  const inwardModal = document.getElementById("inwardStockModal");
  const openInwardBtn = document.getElementById("openInwardStockBtn");
  const closeInwardBtn = document.getElementById("closeInwardModalBtn");
  const btnCancelInward = document.getElementById("btnCancelInward");
  const inwardForm = document.getElementById("inwardStockForm");

  openInwardBtn?.addEventListener("click", openInwardModal);
  closeInwardBtn?.addEventListener("click", closeInwardModal);
  btnCancelInward?.addEventListener("click", closeInwardModal);
  inwardModal?.addEventListener("click", (e) => {
    if (e.target === inwardModal) closeInwardModal();
  });

  // Quick Preset Chips in Inward Modal
  document.querySelectorAll(".inward-preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const name = btn.getAttribute("data-name") || "";
      const salt = btn.getAttribute("data-salt") || "";
      const brand = btn.getAttribute("data-brand") || "";
      const shelf = btn.getAttribute("data-shelf") || "";
      const cat = btn.getAttribute("data-cat") || "";

      const nameInput = document.getElementById("inwardMedName");
      const brandInput = document.getElementById("inwardBrandName");
      const saltInput = document.getElementById("inwardActiveSalt");
      const shelfInput = document.getElementById("inwardShelfLocation");
      const catInput = document.getElementById("inwardTherapeuticCat");

      if (nameInput) nameInput.value = name;
      if (brandInput) brandInput.value = brand;
      if (saltInput) saltInput.value = salt;
      if (shelfInput) shelfInput.value = shelf;
      if (catInput) catInput.value = cat;

      playAudioChime("click");
      showToast(`⚡ Filled inward preset template: ${name}`);
    });
  });

  inwardForm?.addEventListener("submit", handleInwardSubmit);

  // 4. Supplier Purchase Order (PO) Generator Listeners
  const poModal = document.getElementById("purchaseOrderModal");
  const openPoBtn = document.getElementById("openPurchaseOrderBtn");
  const closePoBtn = document.getElementById("closePoModalBtn");
  const btnCopyPo = document.getElementById("btnCopyPoClipboard");
  const btnPrintPo = document.getElementById("btnPrintPoSheet");
  const btnMarkPo = document.getElementById("btnMarkPoOrdered");

  openPoBtn?.addEventListener("click", openPurchaseOrderModal);
  closePoBtn?.addEventListener("click", closePurchaseOrderModal);
  poModal?.addEventListener("click", (e) => {
    if (e.target === poModal) closePurchaseOrderModal();
  });

  btnCopyPo?.addEventListener("click", copyPoToClipboard);
  btnPrintPo?.addEventListener("click", () => window.print());
  btnMarkPo?.addEventListener("click", markPoAsOrdered);

  // 5. Dispensary Audit Trail Ledger Listeners
  const auditModal = document.getElementById("auditLogModal");
  const openAuditBtn = document.getElementById("headerAuditLogBtn");
  const closeAuditBtn = document.getElementById("closeAuditModalBtn");
  const btnExportCsv = document.getElementById("btnExportAuditCsv");

  openAuditBtn?.addEventListener("click", () => openAuditLogModal());
  closeAuditBtn?.addEventListener("click", closeAuditLogModal);
  auditModal?.addEventListener("click", (e) => {
    if (e.target === auditModal) closeAuditLogModal();
  });

  document.querySelectorAll(".audit-tab-btn").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".audit-tab-btn").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      const filter = tab.getAttribute("data-filter") || "all";
      renderAuditTimeline(filter);
    });
  });

  btnExportCsv?.addEventListener("click", exportAuditCsv);

  // 6. Header Audio Chime Toggle
  const audioToggleBtn = document.getElementById("headerAudioToggleBtn");
  audioToggleBtn?.addEventListener("click", toggleAudioChime);

  // Update initial badge counters
  updateEssentialFeatureBadges();
}

/**
 * Toggle dispensary sound effects
 */
function toggleAudioChime() {
  audioMuted = !audioMuted;
  const audioBtn = document.getElementById("headerAudioToggleBtn");
  if (audioBtn) {
    if (audioMuted) {
      audioBtn.innerHTML = `<span>&#128263;</span> Audio Off`;
      audioBtn.classList.add("muted");
      audioBtn.title = "Audio chimes muted - click to enable dispensary sounds";
      showToast("🔇 Dispensary audio chimes muted");
    } else {
      audioBtn.innerHTML = `<span>&#128266;</span> Audio On`;
      audioBtn.classList.remove("muted");
      audioBtn.title = "Audio chimes active - click to mute";
      playAudioChime("dispense");
      showToast("🔊 Dispensary audio chimes activated");
    }
  }
}

/**
 * Update dynamic header and toolbar badges
 */
function updateEssentialFeatureBadges() {
  const lowStockOrShortExpiry = inventoryData.filter((i) => isLowStock(i) || i.expiry_date_months <= 4);
  const toolbarPoBadge = document.getElementById("toolbarPoBadge");
  if (toolbarPoBadge) toolbarPoBadge.textContent = String(lowStockOrShortExpiry.length);

  const headerAuditBadge = document.getElementById("headerAuditBadge");
  if (headerAuditBadge) headerAuditBadge.textContent = String(dispensaryAuditLog.length);
}

// ----------------------------------------------------------------------------
// FEATURE 1: DISPENSE MODAL WORKFLOW
// ----------------------------------------------------------------------------

function openDispenseModal(medicineId, defaultQty = 1) {
  const item = inventoryData.find((i) => i.id === medicineId);
  if (!item) {
    showToast("⚠️ Medicine record not found");
    return;
  }

  activeDispenseMedicine = item;
  activeDispenseQty = Math.max(1, defaultQty);

  const modal = document.getElementById("dispenseModal");
  const summaryContainer = document.getElementById("dispenseItemSummary");
  const qtyInput = document.getElementById("dispenseQtyInput");
  const patientInput = document.getElementById("dispensePatientName");
  const rxInput = document.getElementById("dispenseRxRef");

  if (qtyInput) qtyInput.value = String(activeDispenseQty);
  if (patientInput) patientInput.value = "";
  if (rxInput) rxInput.value = "";

  // Render item summary card
  if (summaryContainer) {
    const isCritical = item.expiry_date_months <= 1;
    const isLow = isLowStock(item);
    const threshold = getLowStockThreshold(item);

    summaryContainer.innerHTML = `
      <div class="dispense-item-top">
        <div>
          <div class="dispense-item-brand">${item.brand_name}</div>
          <div class="dispense-item-name">${item.medicine_name}</div>
          <div class="dispense-item-salt">&#129514; ${item.active_salt}</div>
        </div>
        <div style="text-align: right;">
          <span class="shelf-badge" style="font-size: 0.82rem;">
            <span class="shelf-icon">&#9638;</span> ${item.physical_shelf_location}
          </span>
          <div style="margin-top: 6px;">
            <span class="expiry-badge ${isCritical ? 'critical-urgent' : item.expiry_date_months <= 4 ? 'warning' : 'safe'}" style="font-size: 0.76rem;">
              ${item.expiry_date_months} Months Expiry
            </span>
          </div>
        </div>
      </div>
      <div class="dispense-item-meta-row">
        <span>Current Available Stock: <strong style="font-size: 1.05rem; color: ${isLow ? 'var(--rose-600)' : 'var(--slate-800)'};">${item.stock_quantity} units</strong></span>
        ${
          isLow
            ? `<span class="low-stock-badge"><span class="low-stock-icon">&#9888;&#65039;</span> Low Stock (&lt; ${threshold} units)</span>`
            : `<span style="font-size: 0.75rem; color: var(--emerald-600); font-weight: 600;">&#10003; Healthy Threshold</span>`
        }
      </div>
    `;
  }

  syncDispensePresetChips();
  updateDispenseForecast();

  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeDispenseModal() {
  const modal = document.getElementById("dispenseModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
  activeDispenseMedicine = null;
}

function syncDispensePresetChips() {
  document.querySelectorAll(".dispense-preset-chip").forEach((chip) => {
    const qty = parseInt(chip.getAttribute("data-qty"), 10);
    chip.classList.toggle("active", qty === activeDispenseQty);
  });
}

function updateDispenseForecast() {
  if (!activeDispenseMedicine) return;

  const currentStock = activeDispenseMedicine.stock_quantity;
  const afterStock = currentStock - activeDispenseQty;
  const threshold = getLowStockThreshold(activeDispenseMedicine);

  const banner = document.getElementById("stockForecastBanner");
  const textEl = document.getElementById("stockForecastText");
  const confirmBtn = document.getElementById("btnConfirmDispense");

  if (!banner || !textEl) return;

  banner.classList.remove("will-be-low-stock", "out-of-stock-alert");

  if (afterStock < 0) {
    // Insufficient stock
    banner.classList.add("out-of-stock-alert");
    textEl.innerHTML = `⚠️ <strong>Insufficient Inventory:</strong> Requested ${activeDispenseQty} units, but only ${currentStock} units available on shelf.`;
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.style.opacity = "0.5";
      confirmBtn.style.cursor = "not-allowed";
    }
  } else if (afterStock < threshold) {
    // Will drop into low stock
    banner.classList.add("will-be-low-stock");
    textEl.innerHTML = `Current: <strong>${currentStock} units</strong> &rarr; After Dispense: <strong style="color:var(--rose-700);">${afterStock} units</strong> (⚠️ <em>Will activate Low Stock Alert &lt; ${threshold} units</em>)`;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.style.cursor = "pointer";
    }
  } else {
    // Healthy stock remaining
    textEl.innerHTML = `Current: <strong>${currentStock} units</strong> &rarr; After Dispense: <strong>${afterStock} units</strong> (Inventory Healthy)`;
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.style.opacity = "1";
      confirmBtn.style.cursor = "pointer";
    }
  }
}

function confirmDispenseAction() {
  if (!activeDispenseMedicine) return;
  const currentStock = activeDispenseMedicine.stock_quantity;
  if (activeDispenseQty > currentStock) {
    showToast("❌ Cannot dispense: requested quantity exceeds shelf stock");
    return;
  }

  // Deduct stock
  activeDispenseMedicine.stock_quantity -= activeDispenseQty;

  // Sync to branch data
  if (BRANCH_DATA[activeBranchId]) {
    const branchItem = BRANCH_DATA[activeBranchId].find((i) => i.id === activeDispenseMedicine.id);
    if (branchItem) {
      branchItem.stock_quantity = activeDispenseMedicine.stock_quantity;
    }
  }

  const patientName = document.getElementById("dispensePatientName")?.value.trim() || "";
  const rxRef = document.getElementById("dispenseRxRef")?.value.trim() || "";

  // Log in dispensary audit ledger
  const auditEntry = {
    id: Date.now(),
    type: "dispense",
    title: `Dispensed: ${activeDispenseMedicine.brand_name} (${activeDispenseQty} Units)`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Today",
    timestamp: Date.now(),
    detail: `${patientName ? `Patient: <strong>${patientName}</strong> &bull; ` : ""}${rxRef ? `Rx/Bill #<strong>${rxRef}</strong> &bull; ` : ""}Shelf: <code>${activeDispenseMedicine.physical_shelf_location}</code>. Remaining balance: <strong>${activeDispenseMedicine.stock_quantity} units</strong>.`,
    tags: ["Counter-01", `Branch: ${BRANCH_METADATA[activeBranchId]?.name || "Dispensary"}`]
  };
  dispensaryAuditLog.unshift(auditEntry);

  // Sound chime
  playAudioChime("dispense");

  // Notifications
  showToast(`⚡ Dispensed ${activeDispenseQty} units of ${activeDispenseMedicine.brand_name}. Shelf balance: ${activeDispenseMedicine.stock_quantity}`);
  if (isLowStock(activeDispenseMedicine)) {
    setTimeout(() => {
      playAudioChime("alert");
      showToast(`⚠️ Low Stock Alert: ${activeDispenseMedicine.brand_name} is now down to ${activeDispenseMedicine.stock_quantity} units (Threshold: ${getLowStockThreshold(activeDispenseMedicine)})`);
    }, 600);
  }

  closeDispenseModal();

  // Re-render
  renderDashboard();
  renderExpiryD3Chart();
  updateEssentialFeatureBadges();
}

// ----------------------------------------------------------------------------
// FEATURE 2: PATIENT BIOEQUIVALENCE CERTIFICATE & TRUST SLIP
// ----------------------------------------------------------------------------

function openTrustCertificateModal(reqId, subId) {
  const reqItem = inventoryData.find((i) => i.id === reqId) || inventoryData[0];
  const subItem = inventoryData.find((i) => i.id === subId) || inventoryData[1] || reqItem;

  const certNumber = "CERT-" + Math.floor(100000 + Math.random() * 900000);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const sheet = document.getElementById("certificatePrintableSheet");
  if (!sheet) return;

  const isExactSaltMatch = reqItem.active_salt.trim().toLowerCase() === subItem.active_salt.trim().toLowerCase();

  // Estimate pricing & financial benefit
  const reqEstimatePrice = Math.round(95 + (reqItem.id % 7) * 22);
  const subEstimatePrice = Math.round(52 + (subItem.id % 5) * 14);
  const savings = Math.max(0, reqEstimatePrice - subEstimatePrice);
  const savingsPercent = Math.round((savings / reqEstimatePrice) * 100);

  sheet.innerHTML = `
    <!-- Top Trust Verification Header -->
    <div class="cert-slip-header">
      <div>
        <div class="cert-dispensary-name">PHARMATRUST DISPENSARY HEALTHCARE SYSTEM</div>
        <div class="cert-dispensary-meta">
          Licence #DL-TN-CBE-2026-88390 &bull; ${BRANCH_METADATA[activeBranchId]?.name || "Avinashi Road Main Dispensary"} &bull; GS1 / CDSCO Verified
        </div>
      </div>
      <div class="cert-doc-id-box">
        <div class="cert-doc-id-title">BIOEQUIVALENCE VERIFICATION SLIP</div>
        <div class="cert-doc-num">${certNumber}</div>
        <div class="cert-doc-date">${dateStr} &bull; ${timeStr}</div>
      </div>
    </div>

    <!-- Official Patient Notice -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px;">
      <div style="font-size: 0.88rem; color: #1e293b; font-weight: 600;">
        Official Clinical &amp; Chemical Equivalence Certificate for Patient Reference
      </div>
      <div style="font-size: 0.78rem; color: #475569; margin-top: 4px; line-height: 1.5;">
        This document certifies under certified Pharmacopeial standards that the substitute pharmaceutical brand dispensed below contains <strong>identical therapeutic active pharmaceutical ingredients (API)</strong>, strength, and clinical efficacy as the requested commercial reference brand.
      </div>
    </div>

    <!-- Side-by-Side Brand Comparison Box -->
    <div class="cert-comparison-grid">
      <div class="cert-item-card requested">
        <div class="cert-card-tag req-tag">&#128196; Reference / Requested Brand</div>
        <div class="cert-med-title">${reqItem.brand_name}</div>
        <div class="cert-med-sub">${reqItem.medicine_name}</div>
        <div class="cert-med-salt">&#129514; ${reqItem.active_salt}</div>
        <div class="cert-card-meta">
          <div>Expiry Date: <strong>${reqItem.expiry_date_months} Months</strong></div>
          <div>Reference MRP: <strong>&#8377;${reqEstimatePrice}.00</strong></div>
        </div>
      </div>

      <div class="cert-match-arrow">
        <div class="cert-arrow-circle">&#10003;</div>
        <div class="cert-arrow-text">100% Salt<br/>Bioequivalent</div>
      </div>

      <div class="cert-item-card substituted">
        <div class="cert-card-tag sub-tag">&#9989; Dispensed Bioequivalent Substitute</div>
        <div class="cert-med-title">${subItem.brand_name}</div>
        <div class="cert-med-sub">${subItem.medicine_name}</div>
        <div class="cert-med-salt">&#129514; ${subItem.active_salt}</div>
        <div class="cert-card-meta">
          <div>Expiry Date: <strong style="color:var(--emerald-700);">${subItem.expiry_date_months} Months (${subItem.expiry_date_months >= reqItem.expiry_date_months ? 'Fresher Batch' : 'Approved Shelf'})</strong></div>
          <div>Dispensed Price: <strong style="color:var(--emerald-700);">&#8377;${subEstimatePrice}.00</strong></div>
        </div>
      </div>
    </div>

    <!-- Scientific Compliance Matrix -->
    <table class="cert-matrix-table">
      <thead>
        <tr>
          <th>Equivalence Dimension</th>
          <th>Requested Reference</th>
          <th>Dispensed Substitute</th>
          <th>Clinical Verification Result</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>Active API Chemical Molecule</strong></td>
          <td>${reqItem.active_salt}</td>
          <td>${subItem.active_salt}</td>
          <td><span style="color: #166534; font-weight: 700;">&#9989; 100% Identical Chemical Salt</span></td>
        </tr>
        <tr>
          <td><strong>Therapeutic Drug Category</strong></td>
          <td>${reqItem.therapeutic_category}</td>
          <td>${subItem.therapeutic_category}</td>
          <td><span style="color: #166534; font-weight: 700;">&#9989; Same Therapeutic Indication</span></td>
        </tr>
        <tr>
          <td><strong>Bioavailability Rate &amp; Cmax</strong></td>
          <td>Reference Standard (100%)</td>
          <td>99.4% (Within &plusmn;5% USFDA limit)</td>
          <td><span style="color: #166534; font-weight: 700;">&#9989; Clinically Bioequivalent</span></td>
        </tr>
        <tr>
          <td><strong>Dispensary Physical Shelf &amp; Batch</strong></td>
          <td>${reqItem.physical_shelf_location}</td>
          <td>${subItem.physical_shelf_location}</td>
          <td><code>Verified from Shelf</code></td>
        </tr>
      </tbody>
    </table>

    <!-- Financial Savings & Patient Benefit Highlight -->
    ${
      savings > 0
        ? `
        <div class="cert-savings-box">
          <div class="cert-savings-icon">&#128176;</div>
          <div>
            <div class="cert-savings-title">DIRECT PATIENT BENEFIT: &#8377;${savings}.00 (${savingsPercent}% SAVINGS)</div>
            <div class="cert-savings-desc">
              By accepting the verified bioequivalent substitute (${subItem.brand_name}), the patient receives identical therapeutic cure while saving &#8377;${savings}.00 per course.
            </div>
          </div>
        </div>
        `
        : ""
    }

    <!-- Sign-off Seal & Legal Verification Footer -->
    <div class="cert-footer-row">
      <div class="cert-qr-graphic">
        <div class="cert-qr-box">&#9632;&#9632;&#9632;&#9632;&#9632;<br/>&#9632;&nbsp;&nbsp;&nbsp;&nbsp;&#9632;<br/>&#9632;&nbsp;&#9632;&nbsp;&#9632;<br/>&#9632;&#9632;&#9632;&#9632;&#9632;</div>
        <div class="cert-qr-text">Scan for digital verifiable clinical proof</div>
      </div>

      <div class="cert-stamp-box">
        <div class="cert-stamp-circle">
          <div>PHARMATRUST</div>
          <div style="font-size: 0.62rem; font-weight: 700; color: #166534;">VERIFIED</div>
          <div style="font-size: 0.55rem;">BIOEQUIVALENT</div>
        </div>
        <div class="cert-stamp-pharmacist">
          <strong>Dispensing Pharmacist Sign-Off</strong><br/>
          Reg. Pharmacist ID: <code>PH-TN-88210</code><br/>
          Terminal: ${BRANCH_METADATA[activeBranchId]?.terminal || "Counter-01"}
        </div>
      </div>
    </div>
  `;

  const modal = document.getElementById("trustCertificateModal");
  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }

  playAudioChime("click");
}

function closeTrustCertificateModal() {
  const modal = document.getElementById("trustCertificateModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

// ----------------------------------------------------------------------------
// FEATURE 3: INWARD STOCK INTAKE WORKFLOW
// ----------------------------------------------------------------------------

function openInwardModal() {
  const modal = document.getElementById("inwardStockModal");
  const form = document.getElementById("inwardStockForm");
  if (form) form.reset();

  // Set default shelf & expiry
  const shelfInput = document.getElementById("inwardShelfLocation");
  if (shelfInput) shelfInput.value = "Rack B2 - Shelf 1";

  const expiryInput = document.getElementById("inwardExpiryMonths");
  if (expiryInput) expiryInput.value = "12";

  const qtyInput = document.getElementById("inwardStockQty");
  if (qtyInput) qtyInput.value = "50";

  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeInwardModal() {
  const modal = document.getElementById("inwardStockModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function handleInwardSubmit(e) {
  e.preventDefault();

  const medName = document.getElementById("inwardMedName")?.value.trim();
  const brandName = document.getElementById("inwardBrandName")?.value.trim();
  const activeSalt = document.getElementById("inwardActiveSalt")?.value.trim();
  const cat = document.getElementById("inwardTherapeuticCat")?.value.trim() || "General Medicine";
  const shelfLoc = document.getElementById("inwardShelfLocation")?.value.trim();
  const expiryMonths = parseFloat(document.getElementById("inwardExpiryMonths")?.value) || 12;
  const qty = parseInt(document.getElementById("inwardStockQty")?.value, 10) || 50;
  const barcode = document.getElementById("inwardBarcode")?.value.trim() || ("890103038" + Math.floor(2000 + Math.random() * 7000));

  if (!medName || !brandName || !activeSalt || !shelfLoc) {
    showToast("⚠️ Please fill in all required fields");
    return;
  }

  // Generate unique ID
  const maxId = inventoryData.reduce((max, item) => Math.max(max, item.id || 0), 0);
  const newId = maxId + 1;

  const newItem = {
    id: newId,
    medicine_name: medName,
    brand_name: brandName,
    active_salt: activeSalt,
    therapeutic_category: cat,
    expiry_date_months: expiryMonths,
    expiry_days_remaining: Math.round(expiryMonths * 30),
    stock_quantity: qty,
    low_stock_threshold: 5,
    physical_shelf_location: shelfLoc,
    barcode: barcode
  };

  // Add to active inventory
  inventoryData.unshift(newItem);

  // Add to current branch dataset
  if (BRANCH_DATA[activeBranchId]) {
    BRANCH_DATA[activeBranchId].unshift(newItem);
  }

  // Log in dispensary audit trail
  const auditEntry = {
    id: Date.now(),
    type: "inward",
    title: `Inward Intake: ${brandName} (${qty} Units)`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Today",
    timestamp: Date.now(),
    detail: `Arrived distributor batch. Assigned shelf: <code>${shelfLoc}</code>. Expiry runway: <strong>${expiryMonths} Months</strong>. Barcode: <code>${barcode}</code>.`,
    tags: ["Inward Intake", `Branch: ${BRANCH_METADATA[activeBranchId]?.name || "Dispensary"}`]
  };
  dispensaryAuditLog.unshift(auditEntry);

  // Sound chime
  playAudioChime("inward");

  showToast(`📦 Inward Stock Recorded: Added ${qty} units of ${brandName} to shelf ${shelfLoc}`);
  closeInwardModal();

  // Re-populate dropdowns, dashboard and charts
  populateDropdownSelectors();
  renderDashboard();
  renderExpiryD3Chart();
  updateEssentialFeatureBadges();

  // Highlight the newly created row in the table
  setTimeout(() => {
    highlightTableRow(newId);
  }, 250);
}

// ----------------------------------------------------------------------------
// FEATURE 4: SUPPLIER PURCHASE ORDER (PO) GENERATOR WORKFLOW
// ----------------------------------------------------------------------------

function openPurchaseOrderModal() {
  const modal = document.getElementById("purchaseOrderModal");
  const tableBody = document.getElementById("poTableBody");
  const poRefBadge = document.getElementById("poRefNumberBadge");

  // Generate PO reference number
  const poRef = "PO-2026-NM-" + Math.floor(100 + Math.random() * 900);
  if (poRefBadge) poRefBadge.innerHTML = `PO Ref: <strong>${poRef}</strong>`;

  // Find all items that are either low stock (< 5) OR critical short expiry (<= 4 months)
  const restockItems = inventoryData.filter((i) => isLowStock(i) || i.expiry_date_months <= 4);

  if (!tableBody) return;
  tableBody.innerHTML = "";

  let totalBatches = restockItems.length;
  let totalUnits = 0;
  let totalEstValue = 0;

  if (restockItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align:center; padding: 36px; color: var(--slate-500);">
          <span style="font-size: 1.8rem; display:block; margin-bottom:8px;">&#9989;</span>
          All inventory items currently maintain healthy stock levels (&ge;5 units) and safe expiry horizons (&gt;4 months). No urgent procurement required!
        </td>
      </tr>
    `;
  } else {
    restockItems.forEach((item, index) => {
      const isLow = isLowStock(item);
      const isShortExpiry = item.expiry_date_months <= 4;
      const threshold = getLowStockThreshold(item);

      // Recommended reorder quantity: 50 units for low stock, 100 units for short expiry
      let recommendedReorder = 50;
      if (item.stock_quantity === 0) recommendedReorder = 100;
      else if (isLow) recommendedReorder = 50;
      else if (isShortExpiry) recommendedReorder = 60;

      // Estimated price based on medicine
      const unitPrice = Math.round(45 + (item.id % 6) * 18);
      const lineTotal = recommendedReorder * unitPrice;

      totalUnits += recommendedReorder;
      totalEstValue += lineTotal;

      let urgencyBadge = "";
      if (isLow && isShortExpiry) {
        urgencyBadge = `<span class="po-urgency-chip critical">⚠️ Low Stock + Short Expiry</span>`;
      } else if (isLow) {
        urgencyBadge = `<span class="po-urgency-chip low">⚠️ Low Stock (&lt;${threshold} units)</span>`;
      } else {
        urgencyBadge = `<span class="po-urgency-chip warning">&#9200; Critical Expiry (${item.expiry_date_months} mo)</span>`;
      }

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><strong>${index + 1}</strong></td>
        <td>
          <div style="font-weight:700; color:var(--slate-800);">${item.brand_name}</div>
          <div style="font-size:0.75rem; color:var(--slate-500);">${item.medicine_name}</div>
        </td>
        <td><span style="font-size:0.78rem; color:#1d4ed8; font-weight:600;">&#129514; ${item.active_salt}</span></td>
        <td><strong style="color:${isLow ? 'var(--rose-600)' : 'var(--slate-700)'};">${item.stock_quantity} units</strong></td>
        <td>${urgencyBadge}</td>
        <td>
          <input type="number" class="po-reorder-input" data-id="${item.id}" data-price="${unitPrice}" value="${recommendedReorder}" min="10" max="1000" step="10" style="width:75px; padding:4px 8px; border:1px solid #cbd5e1; border-radius:6px; font-weight:700; text-align:center;" />
        </td>
        <td>&#8377;${unitPrice}.00</td>
        <td><strong class="po-line-total">&#8377;${lineTotal.toLocaleString("en-IN")}.00</strong></td>
      `;
      tableBody.appendChild(tr);
    });
  }

  // Update summary stats
  const totalBatchesEl = document.getElementById("poTotalBatchesCount");
  const totalUnitsEl = document.getElementById("poTotalUnitsCount");
  const totalValueEl = document.getElementById("poTotalEstimatedValue");

  if (totalBatchesEl) totalBatchesEl.textContent = String(totalBatches);
  if (totalUnitsEl) totalUnitsEl.textContent = `${totalUnits} units`;
  if (totalValueEl) totalValueEl.textContent = `₹${totalEstValue.toLocaleString("en-IN")}.00`;

  // Attach input listener to update line totals and grand totals dynamically
  document.querySelectorAll(".po-reorder-input").forEach((input) => {
    input.addEventListener("input", recalculatePoTotals);
  });

  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }

  playAudioChime("click");
}

function recalculatePoTotals() {
  let grandUnits = 0;
  let grandValue = 0;

  document.querySelectorAll(".po-reorder-input").forEach((input) => {
    const qty = parseInt(input.value, 10) || 0;
    const price = parseFloat(input.getAttribute("data-price")) || 0;
    const lineTotal = qty * price;
    grandUnits += qty;
    grandValue += lineTotal;

    const row = input.closest("tr");
    const lineTotalEl = row?.querySelector(".po-line-total");
    if (lineTotalEl) {
      lineTotalEl.textContent = `₹${lineTotal.toLocaleString("en-IN")}.00`;
    }
  });

  const totalUnitsEl = document.getElementById("poTotalUnitsCount");
  const totalValueEl = document.getElementById("poTotalEstimatedValue");

  if (totalUnitsEl) totalUnitsEl.textContent = `${grandUnits} units`;
  if (totalValueEl) totalValueEl.textContent = `₹${grandValue.toLocaleString("en-IN")}.00`;
}

function closePurchaseOrderModal() {
  const modal = document.getElementById("purchaseOrderModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function copyPoToClipboard() {
  const distributorSelect = document.getElementById("poDistributorSelect");
  const distributorText = distributorSelect?.options[distributorSelect.selectedIndex]?.text || "Pharma Distributor";
  const poRefBadge = document.getElementById("poRefNumberBadge");
  const poRef = poRefBadge?.textContent || "PO-2026-NM-042";

  let poText = `=========================================\n`;
  poText += `PHARMATRUST DISPENSARY - PURCHASE ORDER\n`;
  poText += `${poRef} | Date: ${new Date().toLocaleDateString("en-IN")}\n`;
  poText += `Distributor: ${distributorText}\n`;
  poText += `Branch: ${BRANCH_METADATA[activeBranchId]?.name || "Main Dispensary"}\n`;
  poText += `=========================================\n\n`;
  poText += `ITEMS TO RESTOCK:\n`;

  let count = 1;
  document.querySelectorAll("#poTableBody tr").forEach((tr) => {
    const brand = tr.querySelector("td:nth-child(2) div:first-child")?.textContent.trim();
    const salt = tr.querySelector("td:nth-child(3)")?.textContent.trim();
    const stock = tr.querySelector("td:nth-child(4)")?.textContent.trim();
    const reorderInput = tr.querySelector(".po-reorder-input");
    const qty = reorderInput ? reorderInput.value : "50";
    if (brand) {
      poText += `${count}. ${brand} (${salt})\n   Current Stock: ${stock} | Reorder: ${qty} units\n\n`;
      count++;
    }
  });

  const totalUnitsEl = document.getElementById("poTotalUnitsCount");
  const totalValueEl = document.getElementById("poTotalEstimatedValue");
  poText += `-----------------------------------------\n`;
  poText += `Total Units: ${totalUnitsEl?.textContent || "N/A"}\n`;
  poText += `Estimated Value: ${totalValueEl?.textContent || "N/A"}\n`;
  poText += `Urgency: High (Includes Low Stock & FEFO Batches)\n`;
  poText += `=========================================\n`;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(poText).then(() => {
      playAudioChime("dispense");
      showToast("📋 Purchase Order copied to clipboard! Ready to paste into WhatsApp or Email.");
    }).catch(() => {
      showToast("📋 PO generated! Use Print button to export.");
    });
  } else {
    showToast("📋 PO generated! Use Print button to export.");
  }
}

function markPoAsOrdered() {
  const poRefBadge = document.getElementById("poRefNumberBadge");
  const poRef = poRefBadge?.textContent.replace("PO Ref:", "").trim() || "PO-2026-NM-042";
  const totalUnitsEl = document.getElementById("poTotalUnitsCount");
  const totalValueEl = document.getElementById("poTotalEstimatedValue");

  // Log in dispensary audit ledger
  const auditEntry = {
    id: Date.now(),
    type: "po",
    title: `Purchase Order Transmitted: ${poRef}`,
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " Today",
    timestamp: Date.now(),
    detail: `Transmitted order for ${totalUnitsEl?.textContent || "restock lines"} (${totalValueEl?.textContent || "₹0"}) to wholesale distributor. Status: In Transit.`,
    tags: ["PO Transmitted", `Branch: ${BRANCH_METADATA[activeBranchId]?.name || "Dispensary"}`]
  };
  dispensaryAuditLog.unshift(auditEntry);

  playAudioChime("inward");
  showToast(`✅ ${poRef} marked as ordered & logged in Dispensary Audit Trail!`);
  closePurchaseOrderModal();
  updateEssentialFeatureBadges();
}

// ----------------------------------------------------------------------------
// FEATURE 5: LIVE DISPENSING AUDIT TRAIL LEDGER WORKFLOW
// ----------------------------------------------------------------------------

function openAuditLogModal(filter = "all") {
  const modal = document.getElementById("auditLogModal");
  renderAuditTimeline(filter);

  if (modal) {
    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
  }
}

function closeAuditLogModal() {
  const modal = document.getElementById("auditLogModal");
  if (modal) {
    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
  }
}

function renderAuditTimeline(filter = "all") {
  const container = document.getElementById("auditTimelineContainer");
  if (!container) return;

  // Filter items
  const filtered = dispensaryAuditLog.filter((entry) => {
    if (filter === "all") return true;
    return entry.type === filter;
  });

  // Update count badges on filter tabs
  const allCount = dispensaryAuditLog.length;
  const dispenseCount = dispensaryAuditLog.filter((e) => e.type === "dispense").length;
  const inwardCount = dispensaryAuditLog.filter((e) => e.type === "inward").length;
  const poCount = dispensaryAuditLog.filter((e) => e.type === "po").length;

  const allCountEl = document.getElementById("auditAllCount");
  const dispCountEl = document.getElementById("auditDispenseCount");
  const inwCountEl = document.getElementById("auditInwardCount");
  const poCountEl = document.getElementById("auditPoCount");

  if (allCountEl) allCountEl.textContent = String(allCount);
  if (dispCountEl) dispCountEl.textContent = String(dispenseCount);
  if (inwCountEl) inwCountEl.textContent = String(inwardCount);
  if (poCountEl) poCountEl.textContent = String(poCount);

  container.innerHTML = "";

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center; padding: 40px; color: var(--slate-400);">
        <span style="font-size: 2rem; display:block; margin-bottom:8px;">&#128220;</span>
        No audit log events found for this filter.
      </div>
    `;
    return;
  }

  filtered.forEach((entry) => {
    const itemEl = document.createElement("div");
    itemEl.className = "audit-timeline-item";

    let iconSymbol = "&#9889;";
    let iconClass = "dispense";
    if (entry.type === "inward") {
      iconSymbol = "&#128230;";
      iconClass = "inward";
    } else if (entry.type === "po") {
      iconSymbol = "&#128221;";
      iconClass = "po";
    }

    const tagsHTML = entry.tags
      ? entry.tags.map((t) => `<span class="audit-tag">${t}</span>`).join(" ")
      : "";

    itemEl.innerHTML = `
      <div class="audit-icon-bullet ${iconClass}">
        ${iconSymbol}
      </div>
      <div class="audit-item-body">
        <div class="audit-item-header">
          <div class="audit-item-title">${entry.title}</div>
          <div class="audit-item-time">${entry.time}</div>
        </div>
        <div class="audit-item-detail">${entry.detail}</div>
        <div class="audit-item-tags">${tagsHTML}</div>
      </div>
    `;

    container.appendChild(itemEl);
  });
}

function exportAuditCsv() {
  if (dispensaryAuditLog.length === 0) {
    showToast("⚠️ No audit records to export");
    return;
  }

  let csvContent = "ID,Timestamp,Time,Event_Type,Title,Detail,Tags\n";

  dispensaryAuditLog.forEach((entry) => {
    const cleanDetail = (entry.detail || "").replace(/<[^>]*>?/gm, "").replace(/"/g, '""');
    const cleanTitle = (entry.title || "").replace(/"/g, '""');
    const tags = (entry.tags || []).join(" | ").replace(/"/g, '""');
    csvContent += `"${entry.id}","${entry.timestamp}","${entry.time}","${entry.type}","${cleanTitle}","${cleanDetail}","${tags}"\n`;
  });

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `PharmaTrust_Dispensary_Audit_Ledger_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  playAudioChime("click");
  showToast("💾 Dispensary Audit Trail exported to CSV successfully!");
}

// Start app on DOM load or immediately if DOM is already ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    initApp();
  });
} else {
  // DOM is already parsed and interactive/complete
  initApp();
}

