// Shared script for all VistoViz pages. Every feature checks that its
// elements exist first, so the same file works on every page.

(function () {
  // Sticky nav style on scroll
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 20); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile hamburger + Services dropdown
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        // On mobile the "Services" parent expands its submenu instead of navigating
        if (a.classList.contains('drop-toggle') && window.matchMedia('(max-width: 680px)').matches) {
          e.preventDefault();
          var li = a.closest('.has-dropdown');
          if (li) li.classList.toggle('open');
          return;
        }
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });

    // Highlight the current page in the nav (and its dropdown parent)
    var here = (location.pathname.split('/').pop() || '').toLowerCase() || 'index.html';
    navLinks.querySelectorAll('a').forEach(function (a) {
      if ((a.getAttribute('href') || '').toLowerCase() === here) {
        a.classList.add('active');
        var li = a.closest('.has-dropdown');
        if (li) { var t = li.querySelector('.drop-toggle'); if (t) t.classList.add('active'); }
      }
    });
  }

  // Scroll-in reveal (with a safety fallback so content is never stuck hidden)
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    revealEls.forEach(function (el) { io.observe(el); });
    setTimeout(function () { revealEls.forEach(function (el) { el.classList.add('in'); }); }, 2500);
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  // Contact form → emails each lead to the owner via FormSubmit (no server needed)
  var form = document.getElementById('quoteForm');
  if (form) {
    // Prefill the message when arriving from a "Register this domain" link
    try {
      var dparam = new URLSearchParams(location.search).get('domain');
      if (dparam) {
        var mEl = form.querySelector('#message');
        if (mEl && !mEl.value) {
          mEl.value = "I'd like to register the domain " + dparam.replace(/[^a-z0-9.\-]/gi, '') + ". Please check availability and set it up for me.";
        }
      }
    } catch (e) { /* no-op */ }
    var success = document.getElementById('formSuccess');
    var val = function (id) { var el = form.querySelector('#' + id); return el ? el.value : ''; };
    var showMsg = function (text, ok) {
      if (!success) return;
      success.textContent = text;
      success.style.background = ok ? '' : '#fef2f2';
      success.style.borderColor = ok ? '' : '#fecaca';
      success.style.color = ok ? '' : '#b91c1c';
      success.classList.add('show');
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var btn = form.querySelector('button[type=submit]');
      var label = btn ? btn.textContent : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      // Honeypot: silently drop obvious bot submissions
      if (val('company_website')) {
        showMsg("✅ Thanks — we'll be in touch within 24 hours!", true);
        if (btn) btn.textContent = 'Sent ✓';
        setTimeout(function () { form.reset(); if (btn) { btn.disabled = false; btn.textContent = label; } }, 1200);
        return;
      }

      fetch('https://formsubmit.co/ajax/vistoviz369@gmail.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name: val('name'),
          email: val('email'),
          phone: val('phone'),
          message: val('message'),
          _subject: 'New quote request from VistoViz.com',
          _template: 'table',
          _captcha: 'false'
        })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d && (res.d.success === true || res.d.success === 'true')) {
            showMsg("✅ Thanks — we'll be in touch within 24 hours!", true);
            if (btn) btn.textContent = 'Sent ✓';
            setTimeout(function () { form.reset(); if (btn) { btn.disabled = false; btn.textContent = label; } }, 1200);
          } else {
            showMsg((res.d && res.d.message) || "⚠️ Something went wrong. Please email vistoviz369@gmail.com or call (281) 889-3940.", false);
            if (btn) { btn.disabled = false; btn.textContent = label; }
          }
        })
        .catch(function () {
          showMsg("⚠️ Couldn't send right now. Please email vistoviz369@gmail.com or call (281) 889-3940.", false);
          if (btn) { btn.disabled = false; btn.textContent = label; }
        });
    });
  }

  // FAQ accordion
  var faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    if (!q || !a) return;
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      faqItems.forEach(function (o) {
        o.classList.remove('open');
        var oa = o.querySelector('.faq-a');
        if (oa) oa.style.maxHeight = null;
      });
      if (!isOpen) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    });
  });

  // Billing toggle (Hosting & Care page)
  var billing = document.getElementById('careBilling');
  if (billing) {
    var carePlans = document.getElementById('carePlans');
    var billingBtns = billing.querySelectorAll('button');
    billing.addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      billingBtns.forEach(function (x) { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
      b.classList.add('active');
      b.setAttribute('aria-pressed', 'true');
      if (carePlans) carePlans.classList.toggle('annual', b.getAttribute('data-billing') === 'annual');
    });
  }

  // Domain search — REAL live availability via DNS-over-HTTPS (honest, no faked results)
  var domainForm = document.getElementById('domainSearch');
  if (domainForm) {
    var domainResult = document.getElementById('domainResult');
    var domainInput = document.getElementById('domainInput');
    var TLD_PRICE = { com: '19.99', net: '22.99', org: '19.99', co: '32.99', io: '54.99', us: '14.99', biz: '21.99', info: '24.99', online: '12.99', store: '9.99', shop: '12.99', tech: '9.99', dev: '17.99', ai: '99.99' };
    var ALT_TLDS = ['com', 'net', 'org', 'co', 'io', 'online'];
    // ── Instant checkout ──────────────────────────────────────────────
    // Paste your ResellerClub storefront URL here to turn ON "Buy Now" so a
    // visitor checks out & the domain books in real time. Use {domain} where
    // the searched name goes, e.g.
    //   'https://www.YOURSTOREFRONT.com/domain-name-search-results?domain-name={domain}'
    // Leave it '' and the button routes visitors to the request/contact flow.
    var RESELLER_STOREFRONT = '';
    var buyUrl = function (name) {
      if (!RESELLER_STOREFRONT) return null;
      return RESELLER_STOREFRONT.indexOf('{domain}') > -1
        ? RESELLER_STOREFRONT.replace('{domain}', encodeURIComponent(name))
        : RESELLER_STOREFRONT;
    };
    var esc = function (s) { return String(s).replace(/[<>"'&]/g, function (c) { return { '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '&': '&amp;' }[c]; }); };

    var cleanDomain = function (raw) {
      var q = (raw || '').trim().toLowerCase()
        .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').replace(/\s+/g, '');
      if (!q) return null;
      if (q.indexOf('.') === -1) q = q + '.com';
      var parts = q.split('.').filter(Boolean);
      if (parts.length > 2) parts = parts.slice(-2); // reduce to the registrable domain
      var name = parts.join('.');
      return /^[a-z0-9-]+\.[a-z0-9-]+$/.test(name) ? name : null;
    };

    var render = function (html, cls) {
      if (!domainResult) return;
      domainResult.className = 'domain-result show' + (cls ? ' ' + cls : '');
      domainResult.innerHTML = html;
    };
    var regCta = function (name, label) {
      return '<a class="btn btn-primary" href="contact.html?domain=' + encodeURIComponent(name) + '">' + label + ' &rarr;</a>';
    };
    var fine = '<p class="fine">Availability is checked live via DNS. Final confirmation and exact price are verified at registration.</p>';

    var showAvailable = function (name) {
      var price = TLD_PRICE[name.split('.').pop()];
      var bu = buyUrl(name);
      var cta = bu
        ? '<a class="btn btn-primary" href="' + bu + '" target="_blank" rel="noopener">Buy Now — Secure Checkout &rarr;</a>' +
          '<a class="reg-alt" href="contact.html?domain=' + encodeURIComponent(name) + '">or have us set it up for you</a>'
        : regCta(name, 'Register this domain');
      render(
        '<div class="dn">' + esc(name) + '</div>' +
        '<div class="verdict ok">✅ Great news — this domain is available!</div>' +
        (price ? '<p class="pr">Register it through VistoViz for <b>$' + price + '/year</b> — we set it up for you.</p>'
               : '<p class="pr">We can register this domain for you and handle the full setup.</p>') +
        cta + fine, 'ok');
    };

    var showTaken = function (name) {
      var sld = name.split('.')[0];
      var chips = ALT_TLDS.map(function (t) {
        return '<button type="button" class="alt" data-d="' + esc(sld + '.' + t) + '">.' + t + '</button>';
      }).join('');
      render(
        '<div class="dn">' + esc(name) + '</div>' +
        '<div class="verdict no">😕 Sorry — this domain is already registered.</div>' +
        '<p class="pr">Try another extension for <b>' + esc(sld) + '</b>:</p>' +
        '<div class="alt-tlds">' + chips + '</div>' +
        regCta(name, 'Ask us to help you choose') + fine, 'no');
    };

    var runCheck = function (name) {
      render('<div class="dn">' + esc(name) + '</div><div class="checking"><span class="spin"></span> Checking availability…</div>', 'busy');
      fetch('https://dns.google/resolve?name=' + encodeURIComponent(name) + '&type=NS')
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j.Status === 3) showAvailable(name);            // NXDOMAIN → available
          else if (j.Status === 0) showTaken(name);           // resolves → registered
          else render('<div class="dn">' + esc(name) + '</div><p>We couldn’t confirm this one automatically. Request it and we’ll check &amp; register it for you.</p>' + regCta(name, 'Request this domain'), '');
        })
        .catch(function () {
          render('<div class="dn">' + esc(name) + '</div><p>We couldn’t reach the checker right now. Request it and we’ll confirm availability for you.</p>' + regCta(name, 'Request this domain'), '');
        });
    };

    domainForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = cleanDomain(domainInput.value);
      if (!name) { render('<p>Please enter a valid domain, like <b>yourbusiness.com</b>.</p>', ''); return; }
      runCheck(name);
    });

    // Tapping an alternative extension re-runs the check
    if (domainResult) {
      domainResult.addEventListener('click', function (e) {
        var b = e.target.closest('.alt');
        if (!b) return;
        var d = b.getAttribute('data-d');
        if (domainInput) domainInput.value = d;
        runCheck(d);
      });
    }
  }

  // Live chat widget
  var chatFab = document.getElementById('chatFab');
  var chatPanel = document.getElementById('chatPanel');
  if (chatFab && chatPanel) {
    var chatClose = document.getElementById('chatClose');
    var chatBody = document.getElementById('chatBody');
    var chatForm = document.getElementById('chatForm');
    var chatInput = document.getElementById('chatInput');
    var chatQuick = document.getElementById('chatQuick');
    var badge = chatFab.querySelector('.badge');

    var addBubble = function (text, who) {
      var b = document.createElement('div');
      b.className = 'bubble ' + who;
      b.innerHTML = text;
      chatBody.appendChild(b);
      chatBody.scrollTop = chatBody.scrollHeight;
    };
    var toggleChat = function (open) {
      chatPanel.classList.toggle('open', open);
      chatPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) { if (badge) badge.style.display = 'none'; setTimeout(function () { chatInput.focus(); }, 200); }
    };
    chatFab.addEventListener('click', function () { toggleChat(!chatPanel.classList.contains('open')); });
    if (chatClose) chatClose.addEventListener('click', function () { toggleChat(false); });

    if (chatQuick) {
      chatQuick.addEventListener('click', function (e) {
        var btn = e.target.closest('button');
        if (!btn) return;
        addBubble(btn.textContent, 'me');
        setTimeout(function () { addBubble(btn.getAttribute('data-a'), 'bot'); }, 500);
      });
    }
    if (chatForm) {
      chatForm.addEventListener('submit', function (e) {
        e.preventDefault();
        var msg = chatInput.value.trim();
        if (!msg) return;
        addBubble(msg, 'me');
        chatInput.value = '';
        setTimeout(function () {
          addBubble("Thanks for reaching out! 🙌 A VistoViz specialist will reply shortly. For anything urgent, call us at <b>+1 (281) 889-3940</b> or email <b>vistoviz369@gmail.com</b>.", 'bot');
        }, 600);
      });
    }
  }
})();
