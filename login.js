/**
 * PharmaTrust - AI-Powered Inventory & Brand Matching Engine
 * Login Script (login.js)
 * Vanilla JavaScript (ES6)
 */

document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const loginForm = document.getElementById("loginForm");
  const usernameInput = document.getElementById("usernameInput");
  const passwordInput = document.getElementById("passwordInput");
  const togglePasswordBtn = document.getElementById("togglePasswordBtn");
  const eyeIcon = document.getElementById("eyeIcon");
  const eyeOffIcon = document.getElementById("eyeOffIcon");
  const loginBtn = document.getElementById("loginBtn");
  const loginBtnText = document.getElementById("loginBtnText");
  const demoLoginBtn = document.getElementById("demoLoginBtn");
  const statusBanner = document.getElementById("statusBanner");
  const statusIcon = document.getElementById("statusIcon");
  const statusMessage = document.getElementById("statusMessage");
  const forgotPasswordLink = document.getElementById("forgotPasswordLink");

  // Optional: Web Audio API tactile feedback
  function playAudioTone(type = "click") {
    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.07);
      }
    } catch {
      // Non-blocking browser fallback
    }
  }

  // Display status notification
  function showStatus(message, type = "info") {
    if (!statusBanner) return;
    statusBanner.className = `login-status-banner ${type}`;
    if (statusIcon) {
      statusIcon.textContent = type === "error" ? "⚠️" : type === "success" ? "✅" : "ℹ️";
    }
    if (statusMessage) {
      statusMessage.textContent = message;
    }
    statusBanner.style.display = "flex";
  }

  function hideStatus() {
    if (statusBanner) {
      statusBanner.style.display = "none";
    }
  }

  // 1. Password Visibility Toggle
  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener("click", () => {
      playAudioTone("click");
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";

      if (eyeIcon && eyeOffIcon) {
        eyeIcon.style.display = isPassword ? "none" : "block";
        eyeOffIcon.style.display = isPassword ? "block" : "none";
      }

      togglePasswordBtn.setAttribute(
        "aria-label",
        isPassword ? "Hide password" : "Show password"
      );
      passwordInput.focus();
    });
  }

  // 2. Primary Login Submission (Simulated 1.5s Network Request)
  if (loginForm) {
    loginForm.addEventListener("submit", (e) => {
      // Prevent default form submission
      e.preventDefault();
      hideStatus();

      const username = usernameInput?.value.trim() || "";
      const password = passwordInput?.value.trim() || "";

      // Optional quick validation
      if (!username) {
        showStatus("Please enter your work email or pharmacist ID.", "error");
        usernameInput?.focus();
        return;
      }
      if (!password) {
        showStatus("Please enter your security password.", "error");
        passwordInput?.focus();
        return;
      }

      playAudioTone("click");

      // Set Loading State
      if (loginBtn) {
        loginBtn.classList.add("loading");
        loginBtn.disabled = true;
      }
      if (loginBtnText) {
        loginBtnText.textContent = "Authenticating...";
      }
      if (demoLoginBtn) {
        demoLoginBtn.disabled = true;
        demoLoginBtn.style.opacity = "0.5";
      }

      // Store authenticated session details
      try {
        sessionStorage.setItem("pharmaTrustUser", JSON.stringify({
          email: username,
          role: "Chief Dispensing Pharmacist",
          authTime: Date.now(),
          isDemo: false
        }));
      } catch {
        // Safe storage fallback
      }

      // Simulate 1.5 second authentication network request
      setTimeout(() => {
        playAudioTone("success");
        if (loginBtnText) {
          loginBtnText.textContent = "Access Granted ✓";
        }
        // Redirect to original white dashboard (index.html)
        window.location.href = "index.html";
      }, 1500);
    });
  }

  // 3. Demo Login Button (Immediate redirection, skips delay)
  if (demoLoginBtn) {
    demoLoginBtn.addEventListener("click", (e) => {
      // Prevent default action
      e.preventDefault();

      playAudioTone("success");

      // Auto-populate demo credentials for polished visual feedback
      if (usernameInput) usernameInput.value = "demo.pharmacist@pharmatrust.ai";
      if (passwordInput) passwordInput.value = "ClinicalDemo2026";

      // Store Demo Session
      try {
        sessionStorage.setItem("pharmaTrustUser", JSON.stringify({
          email: "demo.pharmacist@pharmatrust.ai",
          role: "Guest Senior Pharmacist",
          authTime: Date.now(),
          isDemo: true
        }));
      } catch {
        // Safe storage fallback
      }

      // Skip simulated authentication delay and immediately redirect to original white dashboard (index.html)
      window.location.href = "index.html";
    });
  }

  // 4. Forgot password helper
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", (e) => {
      e.preventDefault();
      showStatus("Password recovery instructions sent to system administrator.", "info");
      playAudioTone("click");
    });
  }
});
