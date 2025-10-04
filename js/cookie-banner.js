
// Cookie Banner (IT) - prior consent for Google Analytics
(function () {
  var STORAGE_KEY = 'cookie_consent_v1';
  var consent = localStorage.getItem(STORAGE_KEY);

  function setConsent(value) {
    localStorage.setItem(STORAGE_KEY, value);
    if (value === 'accepted') {
      loadGA();
    } else {
      // Explicitly revoke consent for GA4 if already set
      if (window.gtag) {
        gtag('consent', 'update', { 'analytics_storage': 'denied' });
      }
    }
  }

  function loadGA() {
    if (window.__ga_loaded) return;
    window.__ga_loaded = true;
    // Replace G-XXXXXXXXXX with your GA4 Measurement ID
    var GA_ID = window.GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
    // Default consent denied until explicit grant
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} window.gtag = gtag;
    gtag('js', new Date());
    gtag('consent', 'default', { 'analytics_storage': 'denied' });
    gtag('config', GA_ID, { 'anonymize_ip': true });
    // After consent granted switch to granted
    gtag('consent', 'update', { 'analytics_storage': 'granted' });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }

  function renderBanner() {
    var banner = document.getElementById('cookie-banner');
    if (banner) return; // already rendered

    banner = document.createElement('div');
    banner.id = 'cookie-banner';
    banner.innerHTML = [
      '<div class="container">',
      '<p>Utilizziamo cookie tecnici e, previo consenso, cookie di analisi (Google Analytics) per migliorare l\'esperienza. ' +
      'Puoi <a href="/cookie-policy.html" rel="nofollow">leggere la Cookie Policy</a>. </p>',
      '<div class="actions">',
      '<button id="cookie-reject" type="button" aria-label="Rifiuta">Rifiuta</button>',
      '<button id="cookie-accept" type="button" aria-label="Accetta">Accetta</button>',
      '</div>',
      '</div>'
    ].join('');
    document.body.appendChild(banner);
    banner.classList.add('show');

    document.getElementById('cookie-accept').addEventListener('click', function () {
      setConsent('accepted');
      banner.remove();
    });
    document.getElementById('cookie-reject').addEventListener('click', function () {
      setConsent('rejected');
      banner.remove();
    });
  }

  // On load
  if (consent === 'accepted') {
    setConsent('accepted'); // ensures GA loads on subsequent visits
  } else if (consent === 'rejected') {
    // do nothing
  } else {
    // First visit or no choice yet
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderBanner);
    } else {
      renderBanner();
    }
  }
})();
