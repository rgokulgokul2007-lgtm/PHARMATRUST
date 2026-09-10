/**
 * ============================================================================
 * PharmaTrust - Firebase Modular Initialization
 * File: /firebase.js
 * ============================================================================
 * Initializes Firebase App, Cloud Firestore (db), and Firebase Auth (auth)
 * using Vite's client-side environment variables (`import.meta.env.VITE_*`).
 * 
 * Includes defensive fallback handling to prevent browser runtime crashes
 * (e.g. `auth/invalid-api-key`) when environment variables are not yet configured.
 * ============================================================================
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Safely access environment variables across Vite browser and Node/SSR environments
const env =
  typeof import.meta !== "undefined" && import.meta && import.meta.env
    ? import.meta.env
    : typeof process !== "undefined" && process && process.env
    ? process.env
    : {};

// List of required Vite Firebase environment variables
const REQUIRED_ENV_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
];

// Error handling: Check for missing or empty environment variables
const missingEnvVars = REQUIRED_ENV_VARS.filter(
  (envKey) => !env[envKey] || String(env[envKey]).trim() === ""
);

export const isFirebaseConfigured = missingEnvVars.length === 0;

if (missingEnvVars.length > 0) {
  console.warn(
    `[Firebase Warning] The following required Firebase environment variables are missing or empty in your Vite configuration:\n` +
    missingEnvVars.map((key) => `  ⚠️  ${key}`).join("\n") +
    `\nEnsure these are defined in your root '.env' file and prefixed with 'VITE_'. Standby local mode is active.`
  );
}

// Retrieve raw API key from environment
const rawApiKey = (env.VITE_FIREBASE_API_KEY || "").trim();
const hasCustomApiKey =
  rawApiKey.length > 0 &&
  !rawApiKey.startsWith("YOUR_") &&
  !rawApiKey.includes("MY_");

// Firebase configuration object populated from Vite environment variables,
// with safe standby fallbacks to prevent `auth/invalid-api-key` initialization errors
const firebaseConfig = {
  apiKey: hasCustomApiKey ? rawApiKey : "AIzaSyPharmaTrustDemoStandbyApiKey000",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "pharmatrust-demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "pharmatrust-demo",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "pharmatrust-demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789012",
  appId: env.VITE_FIREBASE_APP_ID || "1:123456789012:web:demoabcdef012345"
};

// Initialize Firebase App (re-use existing instance if already initialized)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize and export Cloud Firestore safely
let dbInstance = null;
try {
  dbInstance = getFirestore(app);
} catch (err) {
  console.warn("[Firebase Firestore] Firestore initialization standby:", err?.message);
}
export const db = dbInstance;

// Initialize and export Firebase Authentication safely with fallback to prevent auth/invalid-api-key crashes
let authInstance = null;
try {
  authInstance = getAuth(app);
} catch (err) {
  console.warn("[Firebase Auth] Auth initialization standby (missing or unconfigured API key):", err?.message);
  authInstance = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      try {
        if (typeof callback === "function") callback(null);
      } catch (_) {}
      return () => {};
    },
    signInWithEmailAndPassword: async () => {
      throw new Error("Firebase Auth requires a valid VITE_FIREBASE_API_KEY in your environment configuration.");
    },
    createUserWithEmailAndPassword: async () => {
      throw new Error("Firebase Auth requires a valid VITE_FIREBASE_API_KEY in your environment configuration.");
    },
    signOut: async () => {}
  };
}
export const auth = authInstance;

export default app;
