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

  // Contact form (front-end only)
  var form = document.getElementById('quoteForm');
  if (form) {
    var success = document.getElementById('formSuccess');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      if (success) success.classList.add('show');
      var btn = form.querySelector('button[type=submit]');
      if (btn) btn.textContent = 'Sent ✓';
      setTimeout(function () { form.reset(); }, 400);
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
          addBubble("Thanks for reaching out! 🙌 A VistoViz specialist will reply shortly. For anything urgent, call us at <b>+1 (281) 889-3840</b> or email <b>order@vistoviz.com</b>.", 'bot');
        }, 600);
      });
    }
  }
})();
