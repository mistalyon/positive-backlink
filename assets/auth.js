// PositiveBacklink Auth Helper v1
// Loads Supabase JS SDK on demand, exposes window.pbAuth API
(function() {
  "use strict";

  // CONFIG: filled in via window.PB_CONFIG or read from <meta>
  var SUPABASE_URL = "https://hsgxsxiwwkuplcedfhxq.supabase.co";
  var SUPABASE_ANON_KEY = (window.PB_CONFIG && window.PB_CONFIG.SUPABASE_ANON_KEY) || "__SUPABASE_ANON_KEY__";

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
    clientPromise = loadSdk().then(function(sb) {
      if (SUPABASE_ANON_KEY === "__SUPABASE_ANON_KEY__") {
        console.warn("[pbAuth] SUPABASE_ANON_KEY placeholder not replaced — auth disabled");
      }
      return sb.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
    });
    return clientPromise;
  }

  async function getSession() {
    try {
      var client = await getClient();
      var res = await client.auth.getSession();
      return res.data ? res.data.session : null;
    } catch (e) { console.warn("[pbAuth] getSession err", e); return null; }
  }

  async function getCurrentUser() {
    var session = await getSession();
    return session ? session.user : null;
  }

  async function signInWithPassword(email, password) {
    var client = await getClient();
    return client.auth.signInWithPassword({ email: email, password: password });
  }

  async function signInWithMagicLink(email, redirectTo) {
    var client = await getClient();
    return client.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: redirectTo || (location.origin + "/dashboard") }
    });
  }

  async function signInWithGoogle(redirectTo) {
    var client = await getClient();
    return client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo || (location.origin + "/dashboard") }
    });
  }

  async function signUp(email, password, redirectTo) {
    var client = await getClient();
    return client.auth.signUp({
      email: email, password: password,
      options: { emailRedirectTo: redirectTo || (location.origin + "/dashboard") }
    });
  }

  async function resetPassword(email) {
    var client = await getClient();
    return client.auth.resetPasswordForEmail(email, {
      redirectTo: location.origin + "/reset-password"
    });
  }

  async function updatePassword(newPassword) {
    var client = await getClient();
    return client.auth.updateUser({ password: newPassword });
  }

  async function signOut() {
    var client = await getClient();
    await client.auth.signOut();
    location.href = "/";
  }

  async function requireAuth(loginPath) {
    var session = await getSession();
    if (!session) {
      location.href = (loginPath || "/login") + "?redirect=" + encodeURIComponent(location.pathname);
      return null;
    }
    return session.user;
  }

  async function applyNavAuthState() {
    var session = await getSession();
    var signed = !!session;
    document.querySelectorAll("[data-auth-hide-when=\"signed-in\"]").forEach(function(el) {
      el.classList.toggle("hidden", signed);
    });
    document.querySelectorAll("[data-auth-show-when=\"signed-in\"]").forEach(function(el) {
      el.classList.toggle("hidden", !signed);
    });
  }

  // Wire global logout button if present
  document.addEventListener("DOMContentLoaded", function() {
    var btn = document.getElementById("pbnav-logout");
    if (btn) btn.addEventListener("click", signOut);
    applyNavAuthState();
  });

  window.pbAuth = {
    getClient: getClient,
    getSession: getSession,
    getCurrentUser: getCurrentUser,
    signInWithPassword: signInWithPassword,
    signInWithMagicLink: signInWithMagicLink,
    signInWithGoogle: signInWithGoogle,
    signUp: signUp,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    signOut: signOut,
    requireAuth: requireAuth,
    applyNavAuthState: applyNavAuthState
  };
})();