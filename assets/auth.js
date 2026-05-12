// PositiveBacklink Auth Helper v3
// Reads Supabase anon key from localStorage (PB_SUPABASE_ANON_KEY)
// Falls back to window.PB_CONFIG.anonKey, then placeholder.
// IMPORTANT: createClient is called ONCE after anon key is resolved.
(function(){
  var SUPABASE_URL = "https://hsgxsxiwwkuplcedfhxq.supabase.co";
  var STORAGE_KEY = "PB_SUPABASE_ANON_KEY";
  var PLACEHOLDER = "__SUPABASE_ANON_KEY__";

  function readAnonKey(){
    try{ var v = localStorage.getItem(STORAGE_KEY); if(v && v.length > 40) return v; }catch(e){}
    if(window.PB_CONFIG && window.PB_CONFIG.anonKey) return window.PB_CONFIG.anonKey;
    return PLACEHOLDER;
  }

  function isConfigured(){
    var k = readAnonKey();
    return !!(k && k !== PLACEHOLDER && k.length > 40);
  }

  function setAnonKey(k){
    try{ localStorage.setItem(STORAGE_KEY, k); }catch(e){}
    buildClient();
  }

  var client = null;
  function buildClient(){
    if(!window.supabase || !window.supabase.createClient) return null;
    var key = readAnonKey();
    client = window.supabase.createClient(SUPABASE_URL, key, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    });
    return client;
  }

  function getClient(){
    if(!client) buildClient();
    return client;
  }

  function notReadyError(){
    return { data:null, error:{ name:"NotConfigured", message:"Auth not configured. Visit /setup to paste anon key.", status:0 } };
  }

  function signUp(email, password, opts){
    if(!isConfigured()) return Promise.resolve(notReadyError());
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    var redirect = (opts && opts.redirectTo) || (location.origin + "/dashboard");
    return c.auth.signUp({ email: email, password: password, options: { emailRedirectTo: redirect } });
  }

  function signIn(email, password){
    if(!isConfigured()) return Promise.resolve(notReadyError());
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    return c.auth.signInWithPassword({ email: email, password: password });
  }

  function signInWithOAuth(provider){
    if(!isConfigured()) return Promise.resolve(notReadyError());
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    return c.auth.signInWithOAuth({ provider: provider, options: { redirectTo: location.origin + "/dashboard" } });
  }

  function signInWithMagicLink(email){
    if(!isConfigured()) return Promise.resolve(notReadyError());
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    return c.auth.signInWithOtp({ email: email, options: { emailRedirectTo: location.origin + "/dashboard" } });
  }

  function signOut(){
    var c = getClient(); if(!c) return Promise.resolve({ error:null });
    return c.auth.signOut();
  }

  function resetPassword(email){
    if(!isConfigured()) return Promise.resolve(notReadyError());
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    return c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/reset-password.html" });
  }

  function updatePassword(newPw){
    var c = getClient(); if(!c) return Promise.resolve(notReadyError());
    return c.auth.updateUser({ password: newPw });
  }

  function getSession(){
    var c = getClient(); if(!c) return Promise.resolve(null);
    return c.auth.getSession().then(function(r){ return r && r.data ? r.data.session : null; });
  }

  function requireAuth(redirect){
    if(!isConfigured()) return;
    getSession().then(function(s){
      if(!s){ location.href = redirect || "/login"; }
    });
  }

  function applyNavAuthState(){
    getSession().then(function(s){
      var on = !!s;
      document.querySelectorAll("[data-auth-show-when=\"in\"]").forEach(function(el){ el.style.display = on ? "" : "none"; });
      document.querySelectorAll("[data-auth-hide-when=\"in\"]").forEach(function(el){ el.style.display = on ? "none" : ""; });
    });
  }

  window.pbAuth = {
    readAnonKey: readAnonKey,
    setAnonKey: setAnonKey,
    isConfigured: isConfigured,
    getClient: getClient,
    signUp: signUp,
    signIn: signIn,
    signInWithOAuth: signInWithOAuth,
    signInWithMagicLink: signInWithMagicLink,
    signOut: signOut,
    resetPassword: resetPassword,
    updatePassword: updatePassword,
    getSession: getSession,
    requireAuth: requireAuth,
    applyNavAuthState: applyNavAuthState
  };

  // Eager init: if SDK already loaded, build client now
  if(window.supabase && window.supabase.createClient) buildClient();
  else { var iv = setInterval(function(){ if(window.supabase && window.supabase.createClient){ buildClient(); clearInterval(iv); } }, 50); }
})();