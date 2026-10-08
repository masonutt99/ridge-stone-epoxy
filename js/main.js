/* Ridge & Stone Epoxy Floors — site scripts (no dependencies) */
(function () {
  'use strict';

  // Set to your Formspree endpoint (e.g. 'https://formspree.io/f/abcdwxyz') to send the
  // quote form directly instead of opening the visitor's email app. Leave empty for mailto.
  var FORMSPREE_ENDPOINT = '';
  var QUOTE_EMAIL = 'landonikonik@gmail.com';

  var doc = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  doc.classList.add('js');

  // Footer year
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Sticky header shadow
  var header = document.querySelector('.site-header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Mobile menu
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('primary-nav');
  var mq = window.matchMedia('(max-width: 900px)');

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('is-open', open);
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Menu';
  }
  toggle.addEventListener('click', function () {
    setMenu(toggle.getAttribute('aria-expanded') !== 'true');
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('a') && mq.matches) setMenu(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) { setMenu(false); toggle.focus(); }
  });
  document.addEventListener('click', function (e) {
    if (nav.classList.contains('is-open') && !e.target.closest('.site-header')) setMenu(false);
  });
  mq.addEventListener('change', function (e) { if (!e.matches) setMenu(false); });

  // Highlight current section in nav
  var navLinks = Array.prototype.slice.call(nav.querySelectorAll('ul a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          if (a.getAttribute('href') === '#' + entry.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var s = document.querySelector(a.getAttribute('href'));
      if (s) sectionObs.observe(s);
    });

    // Reveal on scroll
    if (!reduceMotion) {
      var revealEls = document.querySelectorAll('.section-head, .card, .step, .g-item, .faq-item, .about-inner > *, .quote-form, .warranty-inner > *');
      var revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-visible'); revealObs.unobserve(entry.target); }
        });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
      revealEls.forEach(function (el) { el.classList.add('reveal'); revealObs.observe(el); });
    }
  }

  // Gallery lightbox
  var lightbox = document.getElementById('lightbox');
  if (lightbox && typeof lightbox.showModal === 'function') {
    var lbImg = document.getElementById('lightbox-img');
    var lbCap = document.getElementById('lightbox-caption');
    var lastTrigger = null;
    document.querySelectorAll('.g-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var thumb = btn.querySelector('img');
        lastTrigger = btn;
        lbImg.src = btn.getAttribute('data-full');
        lbImg.alt = thumb ? thumb.alt : '';
        lbCap.textContent = btn.getAttribute('data-caption') || '';
        lightbox.showModal();
      });
    });
    lightbox.querySelector('.lightbox-close').addEventListener('click', function () { lightbox.close(); });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) lightbox.close(); });
    lightbox.addEventListener('close', function () { if (lastTrigger) lastTrigger.focus(); });
  }

  // Quote form
  var form = document.getElementById('quote-form');
  if (!form) return;
  var status = document.getElementById('form-status');

  var rules = {
    name: function (v) { return v.trim().length >= 2 ? '' : 'Please enter your name.'; },
    phone: function (v) {
      var digits = v.replace(/\D/g, '');
      if (!digits) return 'Please enter a phone number so we can reach you.';
      return (digits.length === 10 || (digits.length === 11 && digits[0] === '1')) ? '' : 'Please enter a valid 10-digit phone number.';
    },
    email: function (v) {
      if (!v.trim()) return '';
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address, or leave it blank.';
    },
    town: function (v) { return v.trim() ? '' : 'Please tell us what town the project is in.'; },
    project_type: function (v) { return v ? '' : 'Please choose a project type.'; },
    square_feet: function (v) {
      if (!v.trim()) return '';
      var n = Number(v);
      return (isFinite(n) && n > 0) ? '' : 'Please enter a positive number, or leave it blank.';
    }
  };

  function validateField(field) {
    var rule = rules[field.name];
    if (!rule) return true;
    var msg = rule(field.value);
    var errEl = document.getElementById(field.id + '-err');
    if (errEl) errEl.textContent = msg;
    if (msg) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
    return !msg;
  }

  Object.keys(rules).forEach(function (name) {
    var field = form.elements[name];
    if (!field) return;
    field.addEventListener('blur', function () { if (field.value || field.hasAttribute('aria-invalid')) validateField(field); });
    field.addEventListener('input', function () { if (field.hasAttribute('aria-invalid')) validateField(field); });
    field.addEventListener('change', function () { if (field.hasAttribute('aria-invalid')) validateField(field); });
  });

  function buildBody(data) {
    var lines = [
      'New quote request from the Ridge & Stone website',
      '',
      'Name: ' + data.name,
      'Phone: ' + data.phone,
      'Email: ' + (data.email || '(not provided)'),
      'Town: ' + data.town,
      'Project type: ' + data.project_type,
      'Approx. square feet: ' + (data.square_feet || '(not provided)'),
      '',
      'Project details:',
      data.message || '(none)'
    ];
    return lines.join('\r\n');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form-status';
    status.textContent = '';

    var firstInvalid = null;
    Object.keys(rules).forEach(function (name) {
      var field = form.elements[name];
      if (field && !validateField(field) && !firstInvalid) firstInvalid = field;
    });
    if (firstInvalid) {
      status.classList.add('is-error');
      status.textContent = 'Please fix the highlighted fields and try again.';
      firstInvalid.focus();
      return;
    }

    var data = {};
    ['name', 'phone', 'email', 'town', 'project_type', 'square_feet', 'message'].forEach(function (n) {
      data[n] = (form.elements[n].value || '').trim();
    });

    if (FORMSPREE_ENDPOINT) {
      var btn = form.querySelector('button[type="submit"]');
      btn.disabled = true;
      fetch(FORMSPREE_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('Request failed');
          form.reset();
          status.classList.add('is-success');
          status.textContent = 'Thanks! Your quote request was sent. We\u2019ll be in touch soon.';
        })
        .catch(function () {
          status.classList.add('is-error');
          status.innerHTML = 'Sorry, something went wrong. Please call <a href="tel:+18128815449">(812) 881-5449</a> or email <a href="mailto:' + QUOTE_EMAIL + '">' + QUOTE_EMAIL + '</a>.';
        })
        .then(function () { btn.disabled = false; });
      return;
    }

    var subject = 'Free quote request: ' + data.project_type + ' (' + data.town + ')';
    var href = 'mailto:' + QUOTE_EMAIL + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(buildBody(data));
    form.setAttribute('data-mailto', href); // exposed for testing
    window.location.href = href;

    status.classList.add('is-success');
    status.innerHTML = 'Your email app should open with your request filled in &mdash; just hit send. ' +
      'If nothing opened, email <a href="mailto:' + QUOTE_EMAIL + '">' + QUOTE_EMAIL + '</a> or call <a href="tel:+18128815449">(812) 881-5449</a>.';
  });
})();
