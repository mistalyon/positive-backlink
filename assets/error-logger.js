// /assets/error-logger.js
// Tiny client-side error capture - send to /api/log-error
// Include with: <script src="/assets/error-logger.js" defer></script>
(function(){
  var SENT = 0, MAX = 5;
  function send(payload){
    if (SENT >= MAX) return;
    SENT++;
    try {
      navigator.sendBeacon && navigator.sendBeacon('/api/log-error', new Blob([JSON.stringify(payload)],{type:'application/json'}))
        || fetch('/api/log-error',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(function(){});
    } catch(e){}
  }
  window.addEventListener('error', function(e){
    send({
      url: location.href,
      message: (e && e.message) || 'unknown',
      stack: (e && e.error && e.error.stack) || '',
      source: (e && e.filename) || '',
      lineno: (e && e.lineno) || 0,
      colno: (e && e.colno) || 0,
      severity: 'error'
    });
  });
  window.addEventListener('unhandledrejection', function(e){
    var reason = e && e.reason;
    send({
      url: location.href,
      message: 'unhandledrejection: ' + (reason && reason.message ? reason.message : String(reason)),
      stack: (reason && reason.stack) || '',
      severity: 'error'
    });
  });
  // Register service worker (PWA)
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', function(){
      navigator.serviceWorker.register('/service-worker.js').catch(function(){});
    });
  }
})();
