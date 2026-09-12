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

  // Mobile hamburger
  var hamburger = document.getElementById('hamburger');
  var navLinks = document.getElementById('navLinks');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
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

  // Contact form → posts leads to the MongoDB-backed /api/lead endpoint
  var form = document.getElementById('quoteForm');
  if (form) {
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

      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: val('name'),
          email: val('email'),
          phone: val('phone'),
          message: val('message'),
          company_website: val('company_website')
        })
      })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (res.ok && res.d && res.d.ok) {
            showMsg("✅ Thanks — we'll be in touch within 24 hours!", true);
            if (btn) btn.textContent = 'Sent ✓';
            setTimeout(function () { form.reset(); if (btn) { btn.disabled = false; btn.textContent = label; } }, 1200);
          } else {
            showMsg((res.d && res.d.error) || "⚠️ Something went wrong. Please email vistoviz369@gmail.com or call (281) 889-3940.", false);
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
