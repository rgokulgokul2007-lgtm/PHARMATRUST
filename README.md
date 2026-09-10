# 💊 PharmaTrust: AI Inventory & Brand Matching Engine

![Live Deployment](https://img.shields.io/badge/Status-Live_on_Vercel-success?style=for-the-badge&logo=vercel)
![Architecture](https://img.shields.io/badge/Architecture-Two--Screen_Client_Gateway-blue?style=for-the-badge)

**Live Application Portal:** [pharmatrust-six.vercel.app/login.html](https://pharmatrust-six.vercel.app/login.html)

## 🎓 Academic Context
* **Developer:** Gokul R
* **Department:** Electronics and Communication Engineering (ECE)
* **Institution:** Rathinam Technical Campus
* **Project:** AI Immersion Project (Pathway A - The Continuation Track)

## 📖 What is PharmaTrust?
* An enterprise-grade clinical pharmacy management system built to solve critical retail supply chain frictions.
* Bridges the gap between stock management, dynamic demand forecasting, and intelligent brand substitutions.
* Uses an automated, predictive digital workflow to eliminate manual tracking errors.

## 🚨 The Core Problems We Are Solving
* **Brand Substitute Rejection:** Customers frequently reject identical generic or alternative brands out of brand skepticism. PharmaTrust introduces an objective, patient-facing visual bioequivalence verification screen.
* **Expiry Wastage & Dead Stock:** Manual tracking of drug expiry dates leads to expired batches being thrown away, causing massive financial losses. The system uses proactive First-Expired, First-Out (FEFO) analytics to prevent write-offs.
* **Dynamic Demand Volatility:** Traditional systems rely on static data, causing frequent stockouts of critical medicines or overstocking of low-demand drugs.

## 🏗️ System Architecture & Workflow

[ User Lands on App ] 
         │
         ▼
[ Screen 1: Dark Clinical Gateway (login.html) ] 
         │
         ├── Enter Clinical ID / Password
         └── OR Click "👉 Try Demo Login" (Bypasses delay)
         │
         ▼ (Session Validation & sessionStorage write)
[ Screen 2: High-Density White Analytics Dashboard (index.html) ]
         │
         ├── Multi-Branch Switcher (Avinashi Main vs. Hubs)
         ├── D3.js Expiry Horizon Analytics (Interactive Filtering)
         ├── 1D/2D Barcode & QR Scanner Engine (Scan-to-Shelf)
         ├── AI Brand Matcher (API Salt Equivalence Search)
         ├── Customer Trust Screen (Dual-Card Patient View)
         └── Audit Trail & 1-Click CSV Export

## 💡 Comprehensive Feature List
* **Smart Brand Matching Engine:** Instantly cross-references active pharmaceutical ingredients (APIs) and therapeutic classes when a prescribed drug is out of stock to suggest safe, FDA/CDSCO-approved alternatives.
* **Interactive D3.js Expiry Chart:** Visualizes active medication stock grouped by expiry horizons (Urgent <30 days, Critical 31-90 days, Safe >180 days) with interactive filtering brushes.
* **Barcode & QR Code Scanner:** Integrates webcam and simulated optical sensor triggers to instantly map scanned inventory items to physical rack coordinates (e.g., Rack A-02, Shelf 1).
* **Multi-Branch Pharmacy Switcher:** Allows seamless navigation across different retail locations (e.g., Avinashi Main vs. Hubs) to monitor decentralized stock levels.
* **Customer Trust Screen:** A patient-facing dual-card comparison that displays 100% salt match indicators, pricing transparency, and direct cost savings without exposing internal backend data.
* **Regulatory Audit Trail & CSV Export:** Automatically logs dispensing actions and stock intakes with exact timestamps, featuring a 1-click CSV report generator for regulatory compliance.
* **Web Audio Feedback:** Uses native Web Audio API synthesized chimes for success confirmations, dispense actions, and critical expiry warnings.

## 🚧 System Status & Roadmap
* **Completed:** System architecture mapped, UI designed for the two-screen workflow, and deployed live on Vercel.
* **Upcoming (Phase 2):** Establishing cloud database synchronization (Firebase Firestore) for multi-branch persistent storage.
* **Upcoming (Phase 3):** Writing the Python machine learning algorithms for advanced predictive demand forecasting.

## 🛠️ Technology Stack
* **Frontend:** Vanilla JavaScript (ES6 Modules), HTML5, CSS3, Vite
* **Visual Analytics:** D3.js (v7)
* **Hardware Integration:** HTML5-QRCode Scanner Library
* **Deployment & Hosting:** Vercel

## 🚀 How to Run Locally
1. Clone the repository: 
   `git clone https://github.com/rgokulgokul2007-lgtm/PHARMATRUST.git`
2. Navigate into the folder: 
   `cd PHARMATRUST`
3. Install dependencies: 
   `bun install` (or `npm install`)
4. Start the local development server: 
   `bun run dev` (or `npm run dev`)

---
*Architecting tangible interventions, one daily friction at a time.*
