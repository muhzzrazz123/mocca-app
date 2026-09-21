# MOCCA GENTS & BOYS COLLECTIONS

[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Dexie.js](https://img.shields.io/badge/Database-Dexie.js%20(IndexedDB)-D4AF37)](https://dexie.org/)

A production-grade retail store management and POS application built for **MOCCA GENTS & BOYS COLLECTIONS** (Men's & Boys' Clothing Retail).

---

## 🌟 Key Capabilities

* **Retail POS Billing**: Barcode scanning, apparel size/color variant matrix, multi-payment options (Cash, UPI, Card, Split), 80mm thermal receipts, and A4 tax invoices.
* **Cascading Transactions**: Automatic inventory decrements, COGS calculations, real-time gross/net profit updates, customer purchase logs, and dashboard sync.
* **Staff Attendance & Automated Salary**: Calendar attendance tracking with automated per-day salary cuts for absent and leave days, overtime/bonus allowances, advance tracking, and printable MOCCA pay slips.
* **Inventory Control**: Live stock valuation (Cost vs Retail), low-stock reorder warnings, stock adjustments, and full unit movement audit logs.
* **Business Intelligence Dashboard**: 10 instant business KPI cards, period filters (Today, 7D, 30D, Month, Year, Custom), interactive Recharts (sales trends, category revenue, top sellers), and real-time alert banners.
* **MOCCA Insights**: AI telemetry generated dynamically from database records.
* **Official Branding**: Features the official circular gold-on-dark-wood MOCCA brand logo across all screens, receipts, and invoices.
* **Role-Based Access Control**: Separate permission-guarded roles for Store Owner (Mashboob - Admin), Manager, and Cashier (hides financial margins and salaries).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

### 3. Build for Production
```bash
npm run build
```

---

## 🏬 Default Store Configuration
* **Owner**: Mashboob (Store Owner)
* **Store Name**: MOCCA GENTS & BOYS COLLECTIONS
* **Currency**: INR (₹)
* **Database**: Decentralized offline-first IndexedDB via Dexie.js with 1-click JSON backup & restore.
