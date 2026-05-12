// PositiveBacklink Auth Helper v2 (localStorage bootstrap)
(function() {
  "use strict";

  var SUPABASE_URL = "https://hsgxsxiwwkuplcedfhxq.supabase.co";

  function readAnonKey() {
    try {
      var ls = localStorage.getItem("PB_SUPABASE_ANON_KEY");
      if (ls && ls.length > 50) return ls.trim();
    } catch (e) {}
    if (window.PB_CONFIG && window.PB_CONFIG.SUPABASE_ANON_KEY) return window.PB_CONFIG.SUPABASE_ANON_KEY;
    return "__SUPABASE_ANON_KEY__";
  }

  var SUPABASE_ANON_KEY = readAnonKey();
  var clientPromise = null;

  function loadSdk() {
    return new Promise(function(resolve, reject) {
      if (window.supabase && window.supabase.createClient) return resolve(window.supabase);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      s.async = true;
      s.onload = function() { resolve(window.supabase); };
      s.onerror = function() { reject(new Error("Supabase SDK failed to load")); };
      document.head.appendChild(s);
    });
  }

  function getClient() {
    if (clientPromise) return clientPromise;
    SUPABASE_ANON_KEY = readAnonKey();
    if (SUPABASE_ANON_KEY === "__SUPABASE_ANON_KEY__") {
      console.warn("[pbAuth] Anon key not configured. Visit /setup to configure.");
    }
    clientPromise = loadSdk().then(function(sb) {
      return sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    });
    return clientPromise;
  }

  function isConfigured() { return readAnonKey() !== "__SUPABASE_ANON_KEY__"; }

  async function getSession() {
    try { var c = await getClient(); var r = await c.auth.getSession(); return r.data ? r.data.session : null; }
    catch (e) { console.warn("[pbAuth] getSession err", e); return null; }
  }

  async function getCurrentUser() { var s = await getSession(); return s ? s.user : null; }

  async function signInWithPassword(email, password) {
    var c = await getClient(); return c.auth.signInWithPassword({ email: email, password: password });
  }
  async function signInWithMagicLink(email, redirectTo) {
    var c = await getClient(); return c.auth.signInWithOtp({ email: email, options: { emailRedirectTo: redirectTo || (location.origin + "/dashboard") } });
  }
  async function signInWithGoogle(redirectTo) {
    var c = await getClient(); return c.auth.signInWithOAuth({ provider: "google", options: { redirectTo: redirectTo || (location.origin + "/dashboard") } });
  }
  async function signUp(email, password, redirectTo) {
    var c = await getClient(); return c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: redirectTo || (location.origin + "/dashboard") } });
  }
  async function resetPassword(email) {
    var c = await getClient(); return c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/reset-password" });
  }
  async function updatePassword(newPassword) {
    var c = await getClient(); return c.auth.updateUser({ password: newPassword });
  }
  async function signOut() { var c = await getClient(); await c.auth.signOut(); location.href = "/"; }

  async function requireAuth(loginPath) {
    if (!isConfigured()) {
      console.warn("[pbAuth] Not configured - skipping requireAuth guard");
      return null;
    }
    var s = await getSession();
    if (!s) { location.href = (loginPath || "/login") + "?redirect=" + encodeURIComponent(location.pathname); return null; }
    return s.user;
  }

  async function applyNavAuthState() {
    var s = isConfigured() ? await getSession() : null;
    var signed = !!s;
    document.querySelectorAll("[data-auth-hide-when=\"signed-in\"]").forEach(function(el) { el.classList.toggle("hidden", signed); });
    document.querySelectorAll("[data-auth-show-when=\"signed-in\"]").forEach(function(el) { el.classList.toggle("hidden", !signed); });
  }

  document.addEventListener("DOMContentLoaded", function() {
    var btn = document.getElementById("pbnav-logout");
    if (btn) btn.addEventListener("click", signOut);
    applyNavAuthState();
  });

  window.pbAuth = {
    getClient: getClient, getSession: getSession, getCurrentUser: getCurrentUser,
    signInWithPassword: signInWithPassword, signInWithMagicLink: signInWithMagicLink, signInWithGoogle: signInWithGoogle,
    signUp: signUp, resetPassword: resetPassword, updatePassword: updatePassword,
    signOut: signOut, requireAuth: requireAuth, applyNavAuthState: applyNavAuthState,
    isConfigured: isConfigured, readAnonKey: readAnonKey,
    setAnonKey: function(k) { localStorage.setItem("PB_SUPABASE_ANON_KEY", k); SUPABASE_ANON_KEY = k; clientPromise = null; }
  };
})();