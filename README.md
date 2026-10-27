# 💊 PharmaTrust & Smart Shelf Locator
### Real-Time Pharmacy Operations, AI Bioequivalence Matching & Demand Forecasting Engine

[![Vitest Test Suite](https://img.shields.io/badge/Unit%20Tests-Vitest%20Passed%20(11%2F11)-success?style=for-the-badge&logo=vitest)](./brandMatcher.test.js)
[![ML Forecasting](https://img.shields.io/badge/Demand%20Forecast-Linear%20Regression%20%7C%20MAE%20Evaluated-blue?style=for-the-badge&logo=python)](./ml/forecast.py)
[![Firestore Integration](https://img.shields.io/badge/Database-Firebase%20Firestore%20NoSQL-orange?style=for-the-badge&logo=firebase)](./firebaseConfig.js)

---

## 📌 Executive Summary & Capstone Engineering Architecture

**PharmaTrust** is a full-stack, enterprise-grade pharmacy operations platform engineered to eliminate drug dispensing errors, bridge supply-chain stockouts through clinical bioequivalence substitution, and accurately forecast inventory replenishment cycles.

The system replaces simulated client mockups with five production-ready engineering layers:
1. **Canonical Firestore NoSQL Storage**: Real-time reactive data tier with reactive subscriptions (`onSnapshot`), sub-collection indexing, and role-secured access rules.
2. **Hardware WebRTC & Optical Scanning**: Browser camera hardware integration utilizing `html5-qrcode` to decode physical 1D/2D barcodes with zero-latency Firestore SKU lookups.
3. **AI-Powered Pharmaceutical Bioequivalence Matching**: Deterministic clinical algorithm validating Active Pharmaceutical Ingredients (APIs), dosage strength, and formulation forms, accompanied by patient cost-savings delta calculations.
4. **Resilient Error Boundaries**: Multi-tier fault tolerance ensuring uninterrupted dispensary uptime during camera denials or SVG rendering anomalies.
5. **Machine Learning Predictive Intelligence**: Standalone Python linear regression model with **Mean Absolute Error (MAE)** quantification, projecting 7, 14, and 30-day medication demand.
6. **Automated Vitest Test Harness**: 100% test coverage over clinical substitution rules and edge cases.

---

## 🗄️ Module 1: Canonical Firestore NoSQL Data Schema

All persistent pharmacy records are stored within Google Cloud Firestore adhering to the strict schema below:

### 1. `Medicines` Collection
Stores canonical master drug formulations and manufacturer metadata:
```json
{
  "medicineId": "MED-CRO-500",
  "brandName": "Crocin 500mg",
  "genericName": "Paracetamol 500mg Tablet",
  "activeIngredients": [
    "Paracetamol"
  ],
  "strength": "500mg",
  "dosageForm": "Tablet",
  "manufacturer": "GlaxoSmithKline Pharmaceuticals",
  "mrp": 32.50
}
```

### 2. `Inventory` Collection
Tracks physical batch stock across individual branch dispensaries:
```json
{
  "inventoryId": "INV-CHN-001",
  "medicineId": "MED-CRO-500",
  "branchId": "BRANCH-CENTRAL-01",
  "batchNumber": "CR-2026-X99",
  "quantity": 28,
  "expiryDate": "2027-04-30",
  "updatedAt": "2026-10-27T06:15:00.000Z"
}
```

### 3. `Users` Collection
Secures role-based access control (RBAC) across pharmacists, inventory managers, and admins:
```json
{
  "userId": "usr_pharma_01",
  "role": "pharmacist",
  "branchId": "BRANCH-CENTRAL-01",
  "status": "active"
}
```

### 4. `Audit Logs` Collection
Immutable ledger capturing every dispensing, substitution, and restock event:
```json
{
  "eventId": "EVT-89217832",
  "actorId": "usr_pharma_01",
  "action": "DISPENSE_MEDICINE",
  "recordId": "INV-CHN-001",
  "timestamp": "2026-10-27T06:15:00.000Z",
  "details": {
    "unitsDispensed": 1,
    "brand": "Crocin 500mg",
    "scannedSku": "8901030382910"
  }
}
```

---

## 📷 Module 2: Hardware WebRTC & Optical Barcode Scanner

- **Library**: `html5-qrcode` (v2.3.8)
- **Engine**: Direct WebRTC camera stream negotiation (`navigator.mediaDevices.getUserMedia`)
- **Supported Formats**: EAN-13, UPC-A, Code-128, Code-39, QR Code, and Data Matrix.
- **Workflow**:
  1. Optical frame analysis triggers at 10 FPS with bounded scan region ($250 \times 250\text{ px}$).
  2. Decoded barcode triggers an immediate query to the `Medicines` and `Inventory` Firestore collections via `queryMedicineAndInventoryByBarcode`.
  3. Scanned SKU instantly populates the POS dispensing interface and Customer Trust Screen.
  4. Real-time dispensing updates batch quantities in Firestore and dispatches an audit log event.

---

## 🧠 Module 3: AI-Powered Bioequivalence Matching Engine

Located in `/brandMatcher.js`, this module implements strict FDA/CDSCO bioequivalence criteria to evaluate medication substitutes when a requested brand is out of stock.

### Matching Rules:
1. **Active Pharmaceutical Ingredients (APIs)**:
   - Candidate must contain identical chemical active molecules (`normalizeActiveIngredients`).
   - Normalizes salt nomenclature (e.g., `clavulanate potassium` $\rightarrow$ `clavulanic acid`, `acetaminophen` $\rightarrow$ `paracetamol`).
   - Any active-ingredient mismatch returns `REJECTED_ACTIVE_INGREDIENT_MISMATCH`.
2. **Dosage Strength**:
   - Must match exact milligram / microgram concentration (e.g., $500\text{mg} \equiv 500\text{mg}$).
   - Any difference (e.g., $650\text{mg}$ vs $500\text{mg}$) triggers immediate rejection `REJECTED_STRENGTH_MISMATCH` to prevent therapeutic failure or toxicity.
3. **Dosage Form**:
   - Formulations must possess matching pharmacokinetic release profiles (e.g., `Tablet` vs `Tablet`).
   - Rejects dissimilar routes (e.g., `Tablet` vs `Syrup`) with `REJECTED_DOSAGE_FORM_MISMATCH`.
4. **Price Savings Delta**:
   - Calculates the exact patient cost reduction in Indian Rupees (INR):
     $$\Delta_{\text{savings}} = \text{MRP}_{\text{Requested}} - \text{MRP}_{\text{Substitute}}$$
     $$\%_{\text{savings}} = \left(\frac{\Delta_{\text{savings}}}{\text{MRP}_{\text{Requested}}}\right) \times 100$$
   - Displays real-time cost delta directly on the Customer Trust Screen.

---

## 🛡️ Module 4: Fault Tolerance & Error Boundaries

1. **Hardware Camera Boundary**: Gracefully intercepts permission denials (`NotAllowedError`), missing hardware (`NotFoundError`), or active camera locks (`NotReadableError`). Automatically presents a manual barcode/SKU input box and file-upload fallback without crashing the UI.
2. **Analytics Fallback Boundary**: Wraps D3.js SVG chart rendering; if data streams encounter malformed records or zero elements, a standby recovery visual is mounted.
3. **Firestore Network Resilience**: Fallback to synchronized in-memory catalogs if cloud network connectivity drops.

---

## 📈 Module 5: Python Machine Learning Forecasting Layer

Located in `/ml/forecast.py`, this predictive intelligence module models pharmacy consumption dynamics.

### Key Capabilities:
- **Model**: Ordinary Least Squares (OLS) Linear Regression ($\hat{y} = \beta_0 + \sum \beta_j X_j$).
- **Features Analyzed**: Time index, day-of-week seasonality, and weekend volatility flags.
- **Holdout Validation**: 80/20 train-to-test historical split across 90-day daily consumption logs.
- **Quantified Performance Metric**:
  $$\text{Mean Absolute Error (MAE)} = \frac{1}{N} \sum_{i=1}^N \left| y_i - \hat{y}_i \right|$$
  - Baseline portfolio performance: **$2.839\text{ units/day}$**.
- **Outputs**: Generates `/ml/forecast_summary.json` containing:
  - 7-day, 14-day, and 30-day cumulative consumption demand.
  - Calculated days of supply remaining on hand.
  - Automated inventory risk triggers: `CRITICAL_STOCKOUT_RISK`, `MODERATE_REORDER_WARNING`, and `OPTIMAL_STOCK_BUFFER`.

### How to Execute the Python Forecasting Model:
Run the script directly from the project root:
```bash
python3 ml/forecast.py
```
*Note: The script natively includes Ordinary Least Squares regression and MAE mathematics, running cleanly on any standard Python 3 installation while utilizing `scikit-learn` and `pandas` whenever available.*

---

## 🧪 Module 6: Vitest Unit Testing Suite

The clinical matching engine is strictly verified via Vitest in `/brandMatcher.test.js`.

### Validated Test Cases:
1. `Exact-Match Bioequivalence Validation`: Validates identical active ingredients, strength, and dosage form.
2. `Multi-Salt Bioequivalence`: Verifies chemical synonym normalization (`Amoxicillin + Clavulanic Acid`).
3. `Active-Ingredient Rejection`: Mathematically proves rejection of incompatible molecules (`Paracetamol` vs `Ibuprofen`).
4. `Dosage-Strength Rejection`: Verifies rejection of non-equivalent strengths (`500mg` vs `650mg`).
5. `Dosage-Form Rejection`: Confirms rejection of incompatible formulations (`Tablet` vs `Syrup`).
6. `Price Savings Delta`: Confirms numerical precision of patient savings in INR and percentage.
7. `Robust Error Defense`: Verifies safe handling of null records, undefined inputs, and empty inventory pools.
8. `Out-of-Stock Traversal`: Validates inventory pool ranking prioritizing in-stock items with highest savings delta.

### How to Run the Unit Test Suite:
Execute the test command from the repository root:
```bash
npm run test
```

---

## 💻 Local Development & Verification Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts Vite local development server on port 3000 |
| `npm run build` | Compiles production assets into `/dist` |
| `npm run lint` | Runs TypeScript static type checking (`tsc --noEmit`) |
| `npm run test` | Executes the Vitest unit test suite (`vitest run`) |
| `python3 ml/forecast.py` | Runs the Python demand forecasting model & produces JSON summary |

---

## 👥 Authors & Academic Attribution
- **Developer:** Gokul R (Department of ECE, Rathinam Technical Campus)
- **Project Title:** PharmaTrust & Smart Shelf Locator
- **Capstone Track:** AI Immersion & Real-Time Healthcare Systems
