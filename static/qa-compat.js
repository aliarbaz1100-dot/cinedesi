/* QA-only conservative browser shims for Safari/iOS 12 and older Android WebView. */
(function () {
  var qa = /(^|[.-])qa([.-]|$)/i.test(location.hostname) ||
           /[?&]qa=1(?:&|$)/.test(location.search);
  if (!qa) return;
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
})();
