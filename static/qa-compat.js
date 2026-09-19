/* QA-only conservative browser shims for Safari/iOS 12 and older Android WebView. */
(function () {
  var qa = /(^|[.-])qa([.-]|$)/i.test(location.hostname) ||
           /[?&]qa=1(?:&|$)/.test(location.search);
  if (!qa) return;
  document.documentElement.classList.add('cd-qa-mode');
  var oldSafari = /(?:iPhone|iPad|iPod)/i.test(navigator.userAgent) &&
                  /OS 12[_\d]*/i.test(navigator.userAgent);
  if (oldSafari) document.documentElement.classList.add('cd-qa-legacy');
  if (typeof window.queueMicrotask !== 'function') {
    window.queueMicrotask = function (callback) {
      Promise.resolve().then(callback).catch(function (error) {
        setTimeout(function () { throw error; }, 0);
      });
    };
  }
  if (typeof String.prototype.replaceAll !== 'function') {
    Object.defineProperty(String.prototype, 'replaceAll', {
      configurable: true,
      writable: true,
      value: function (search, replacement) {
        if (search instanceof RegExp) {
          if (!search.global) throw new TypeError('RegExp must have global flag');
          return this.replace(search, replacement);
        }
        return this.split(String(search)).join(String(replacement));
      }
    });
  }
  if (typeof Object.fromEntries !== 'function') {
    Object.fromEntries = function (entries) {
      var result = {};
      entries.forEach(function (entry) { result[entry[0]] = entry[1]; });
      return result;
    };
  }
  if (!('requestIdleCallback' in window)) {
    window.requestIdleCallback = function (cb) {
      return setTimeout(function () {
        cb({ didTimeout: false, timeRemaining: function () { return 0; } });
      }, 1);
    };
    window.cancelIdleCallback = function (id) { clearTimeout(id); };
  }
  // Hidden, read-only launch diagnostic for the REAL installed QA icon.
  // It does not alter navigation, styling, production, or user data.
  // Hold the CineDesi header logo for two seconds to reveal the report.
  var qaDiagnosticVersion = 'qa-launch-check-20260919-v1';
  var qaStartedAt = Date.now();
  var qaEvents = ['script-loaded'];
  function qaLog(eventName) {
    qaEvents.push(eventName + ':' + (Date.now() - qaStartedAt) + 'ms');
    if (qaEvents.length > 12) qaEvents.shift();
  }
  document.addEventListener('visibilitychange', function () {
    qaLog(document.hidden ? 'hidden' : 'visible');
  });
  window.addEventListener('pageshow', function (event) {
    qaLog(event.persisted ? 'pageshow-bfcache' : 'pageshow');
  });
  window.addEventListener('focus', function () { qaLog('focus'); });
  function qaReport() {
    var standalone = navigator.standalone === true;
    var displayMode = !!(window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
    var element = document.getElementById('app-splash');
    var logo = element && element.querySelector('.splash-logo');
    var style = logo && window.getComputedStyle ? getComputedStyle(logo) : null;
    var startUrl = location.pathname + location.search;
    var queryString = '';
    try {
      var query = new URLSearchParams(location.search);
      queryString = ['qa','source','install-launch','returnY','preview'].filter(function (key) {
        return query.has(key);
      }).map(function (key) { return key + '=' + query.get(key); }).join('&');
    } catch (e) {}
    return [
      'CineDesi QA Launch Check ' + qaDiagnosticVersion,
      'route=' + location.pathname,
      'query=' + queryString,
      'host_is_qa=' + /(^|[.-])qa([.-]|$)/i.test(location.hostname),
      'navigator.standalone=' + String(standalone),
      'display-mode.standalone=' + String(displayMode),
      'top-level=' + String(window.top === window),
      'document.visibility=' + document.visibilityState,
      'launch-class=' + document.documentElement.classList.contains('cd-qa-standalone'),
      'splash-node=' + String(!!element),
      'logo-animation=' + String(style ? style.animationName : 'none'),
      'service-worker-controlled=' + String(!!(navigator.serviceWorker && navigator.serviceWorker.controller)),
      'events=' + qaEvents.join(', '),
      'early-launch=' + (function(){try{return sessionStorage.getItem('cinedesi-qa-last-launch-check')||'none'}catch(e){return 'unavailable'}})()
    ].join('\n');
  }
  function showQaDiagnostic() {
    if (document.getElementById('qa-launch-check-panel')) return;
    qaLog('report-open');
    var panel = document.createElement('div');
    panel.id = 'qa-launch-check-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-label','CineDesi QA launch check');
    panel.style.cssText = 'position:fixed;inset:0;z-index:2147483600;background:#070708;color:#fff;display:flex;flex-direction:column;gap:12px;padding:24px 18px max(18px,env(safe-area-inset-bottom));overflow:auto;font:14px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif';
    var heading = document.createElement('h2');
    heading.textContent='CineDesi · Installed App Check';
    heading.style.cssText='margin:0;font-size:19px';
    var explanation = document.createElement('p');
    explanation.textContent='Yeh report sirf QA app ke launch ka hai. Screenshot bhej dein; koi personal account information shamil nahin.';
    explanation.style.cssText='margin:0;color:#b7b7bb;font-size:12px';
    var report = document.createElement('pre');
    report.id='qa-launch-check-text';
    report.textContent=qaReport();
    report.style.cssText='margin:0;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;background:#161618;border:1px solid #303034;border-radius:8px;color:#f1f1f1;font:11px/1.6 monospace';
    var close=document.createElement('button');
    close.type='button';close.textContent='Back to CineDesi';
    close.style.cssText='min-height:46px;border:0;border-radius:8px;background:#eee;color:#09090b;font-weight:750;font-size:14px';
    close.onclick=function(){ panel.remove(); };
    panel.appendChild(heading);panel.appendChild(explanation);panel.appendChild(report);panel.appendChild(close);
    document.body.appendChild(panel);
  }
  document.addEventListener('DOMContentLoaded',function(){
    var logo=document.querySelector('.catalog-header a.logo');
    if(!logo)return;
    var timer=0,activated=false;
    function cancel(){if(timer)clearTimeout(timer);timer=0;}
    function start(){
      activated=false;cancel();
      timer=setTimeout(function(){activated=true;showQaDiagnostic();timer=0;},1450);
    }
    logo.addEventListener('touchstart',start,{passive:true});
    logo.addEventListener('touchend',cancel,{passive:true});
    logo.addEventListener('touchcancel',cancel,{passive:true});
    logo.addEventListener('mousedown',function(event){if(event.button===0&&!('ontouchstart' in window))start();});
    logo.addEventListener('mouseup',cancel);
    logo.addEventListener('mouseleave',cancel);
    // iPhone may show the native link menu before a long press completes.
    // Suppress the header logo's context menu only in this private QA app.
    var taps=0,lastTap=0;
    logo.addEventListener('click',function(event){
      var now=Date.now();
      taps=(now-lastTap<950)?taps+1:1;
      lastTap=now;
      // Clicking the logo while on the home screen is a no-op anyway.
      // Prevent a full-page reload between taps on older iPhones.
      if(activated||taps<=3)event.preventDefault();
      if(activated){activated=false;taps=0;return;}
      if(taps===3){taps=0;cancel();showQaDiagnostic();}
    },true);
    logo.addEventListener('contextmenu',function(event){event.preventDefault();});
  });

})();
