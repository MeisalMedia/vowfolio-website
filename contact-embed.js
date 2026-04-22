(function () {
  var script = document.currentScript ||
    (function () {
      var s = document.getElementsByTagName('script');
      return s[s.length - 1];
    })();

  var src = script.src || '';
  var match = src.match(/\/contact\/([^\/]+)\/embed/);
  if (!match) return;
  var formId = match[1];

  var iframe = document.createElement('iframe');
  iframe.src = 'https://vowfolio.com/contact/' + formId;
  iframe.style.cssText = [
    'width:100%',
    'border:none',
    'display:block',
    'overflow:hidden',
    'transition:height 0.2s ease'
  ].join(';');
  iframe.setAttribute('scrolling', 'no');
  iframe.setAttribute('allowtransparency', 'true');
  iframe.setAttribute('title', 'Kontaktskjema');

  // Grow iframe to match form content height via postMessage
  window.addEventListener('message', function (e) {
    if (e.data && typeof e.data.vowfolioHeight === 'number') {
      iframe.style.height = e.data.vowfolioHeight + 'px';
    }
  });

  // Fallback height while loading
  iframe.style.height = '600px';

  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
