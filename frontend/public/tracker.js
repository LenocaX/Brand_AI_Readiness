/**
 * Canopy Analytics Tracker SDK v1.0
 * Lightweight, privacy-first website analytics & engagement tracking.
 * Zero external dependencies (< 4KB).
 */
(function () {
  'use strict';

  // Find the executing script tag to extract data-site-id
  var currentScript =
    document.currentScript ||
    (function () {
      var scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

  var siteId = currentScript ? currentScript.getAttribute('data-site-id') : null;
  if (!siteId) {
    console.warn('[Canopy] Tracker initialized without data-site-id.');
    return;
  }

  // Derive API endpoint
  var scriptSrc = currentScript ? currentScript.src : '';
  var apiBase = '';
  if (scriptSrc && scriptSrc.indexOf('http') === 0) {
    var a = document.createElement('a');
    a.href = scriptSrc;
    apiBase = a.protocol + '//' + a.host;
  }

  // Persistent anonymous session ID (scoped to session storage)
  var SESSION_KEY = 'canopy_sid';
  var sessionId = '';
  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = 'cs_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
  } catch (e) {
    sessionId = 'cs_anon_' + Date.now().toString(36);
  }

  // Helper to parse UTM parameters
  function getUtmParams() {
    var params = {};
    try {
      var search = window.location.search.substring(1);
      if (search) {
        var pairs = search.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          var key = decodeURIComponent(pair[0]).toLowerCase();
          if (key.indexOf('utm_') === 0) {
            params[key] = decodeURIComponent(pair[1] || '');
          }
        }
      }
    } catch (e) {}
    return params;
  }

  // Device category detection
  function getDeviceCategory() {
    var width = window.innerWidth || screen.width;
    if (width < 640) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  // Determine traffic source
  function getTrafficSource(utm) {
    if (utm.utm_source) return 'campaign';
    var ref = document.referrer;
    if (!ref) return 'direct';
    var refLower = ref.toLowerCase();
    if (refLower.indexOf('google.') !== -1 || refLower.indexOf('bing.') !== -1 || refLower.indexOf('duckduckgo.') !== -1) {
      return 'organic_search';
    }
    if (refLower.indexOf('twitter.') !== -1 || refLower.indexOf('t.co') !== -1 || refLower.indexOf('linkedin.') !== -1 || refLower.indexOf('facebook.') !== -1 || refLower.indexOf('instagram.') !== -1) {
      return 'social';
    }
    return 'referral';
  }

  // Core event dispatch using sendBeacon or keepalive fetch
  function sendEvent(eventType, extraData) {
    var utm = getUtmParams();
    var payload = {
      website_id: siteId,
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href.split('#')[0],
      page_title: document.title || '',
      referrer: document.referrer || null,
      device_category: getDeviceCategory(),
      traffic_source: getTrafficSource(utm),
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      scroll_depth_pct: (extraData && extraData.scroll_depth_pct) || null,
      event_data: extraData || null,
    };

    var endpoint = (apiBase || '') + '/api/analytics/collect';
    var jsonStr = JSON.stringify(payload);

    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([jsonStr], { type: 'application/json' });
        navigator.sendBeacon(endpoint, blob);
        return;
      } catch (e) {}
    }

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  // 1. Track initial Pageview
  sendEvent('pageview');

  // 2. Scroll Depth tracking (milestones: 25%, 50%, 75%, 100%)
  var trackedDepths = {};
  var scrollDebounce = null;
  function handleScroll() {
    if (scrollDebounce) return;
    scrollDebounce = setTimeout(function () {
      scrollDebounce = null;
      var docElem = document.documentElement;
      var scrollTop = window.pageYOffset || docElem.scrollTop;
      var winHeight = window.innerHeight || docElem.clientHeight;
      var docHeight = Math.max(docElem.scrollHeight, document.body.scrollHeight);
      if (docHeight <= winHeight) return;

      var pct = Math.min(100, Math.round(((scrollTop + winHeight) / docHeight) * 100));
      var milestones = [25, 50, 75, 100];
      for (var i = 0; i < milestones.length; i++) {
        var m = milestones[i];
        if (pct >= m && !trackedDepths[m]) {
          trackedDepths[m] = true;
          sendEvent('scroll', { scroll_depth_pct: m });
        }
      }
    }, 250);
  }
  window.addEventListener('scroll', handleScroll, { passive: true });

  // 3. CTA & Outbound click tracking
  document.addEventListener('click', function (e) {
    try {
      var target = e.target;
      while (target && target !== document.body) {
        if (target.tagName === 'A') {
          var href = target.getAttribute('href') || '';
          if (href.indexOf('http') === 0 && href.indexOf(window.location.hostname) === -1) {
            sendEvent('outbound_link', { target_url: href, text: (target.innerText || '').slice(0, 60) });
          }
          break;
        }
        if (target.tagName === 'BUTTON' || target.getAttribute('role') === 'button' || (target.className && String(target.className).indexOf('cta') !== -1)) {
          sendEvent('click_cta', {
            button_text: (target.innerText || target.getAttribute('aria-label') || '').slice(0, 60),
            tag: target.tagName.toLowerCase(),
          });
          break;
        }
        target = target.parentElement;
      }
    } catch (err) {}
  });

  // Global Canopy object for custom conversion tracking
  window.canopy = {
    track: function (eventName, data) {
      sendEvent(eventName || 'conversion', data);
    },
    pageview: function () {
      sendEvent('pageview');
    },
  };
})();
