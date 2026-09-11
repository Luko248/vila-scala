/**
 * The site's entire client-side budget: theme persistence, the mobile menu,
 * a scroll reveal and an accessible image lightbox. No framework, no polyfills.
 */

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------- theme --- */

function initTheme() {
  const root = document.documentElement;
  const media = window.matchMedia('(prefers-color-scheme: dark)');

  const read = () => {
    try {
      return localStorage.getItem('vs-theme');
    } catch {
      return null;
    }
  };

  // Follow the OS until the visitor makes an explicit choice.
  media.addEventListener('change', (e) => {
    if (!read()) root.dataset.theme = e.matches ? 'dark' : 'light';
  });

  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
      root.dataset.theme = next;
      btn.setAttribute('aria-pressed', String(next === 'dark'));
      try {
        localStorage.setItem('vs-theme', next);
      } catch {
        /* private mode — the choice just will not persist */
      }
    });
    btn.setAttribute('aria-pressed', String(root.dataset.theme === 'dark'));
  });
}

/* --------------------------------------------------------- mobile menu --- */

function initMenu() {
  const dialog = document.querySelector<HTMLDialogElement>('#site-menu');
  const openBtn = document.querySelector<HTMLButtonElement>('[data-menu-open]');
  if (!dialog || !openBtn) return;

  const close = () => dialog.close();

  openBtn.addEventListener('click', () => {
    dialog.showModal();
    openBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  });

  dialog.querySelector('[data-menu-close]')?.addEventListener('click', close);
  dialog.addEventListener('close', () => {
    openBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    openBtn.focus();
  });

  // A link inside the menu navigates away; close first so history back is sane.
  dialog.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) close();
  });

  // Desktop breakpoint reached while open — the menu no longer applies.
  window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
    if (e.matches && dialog.open) close();
  });
}

/* --------------------------------------------------------- reveal ------- */

function initReveal() {
  const items = document.querySelectorAll<HTMLElement>('.reveal, .reveal-line');
  if (!items.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => (el.dataset.shown = 'true'));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        el.dataset.shown = 'true';
        el.style.transitionDelay = `${el.dataset.revealDelay ?? 0}ms`;
        io.unobserve(el);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
  );

  items.forEach((el) => io.observe(el));
}

/* -------------------------------------------------------- lightbox ------ */

interface Slide {
  src: string;
  alt: string;
  width: number;
  height: number;
}

function initLightbox() {
  const galleries = document.querySelectorAll<HTMLElement>('[data-gallery]');
  if (!galleries.length) return;

  const dialog = document.querySelector<HTMLDialogElement>('#lightbox');
  if (!dialog) return;

  const imgEl = dialog.querySelector<HTMLImageElement>('[data-lb-image]')!;
  const counterEl = dialog.querySelector<HTMLElement>('[data-lb-counter]')!;
  const captionEl = dialog.querySelector<HTMLElement>('[data-lb-caption]')!;
  const prevBtn = dialog.querySelector<HTMLButtonElement>('[data-lb-prev]')!;
  const nextBtn = dialog.querySelector<HTMLButtonElement>('[data-lb-next]')!;
  const counterTemplate = counterEl.dataset.template ?? '{current} / {total}';

  let slides: Slide[] = [];
  let index = 0;
  let opener: HTMLElement | null = null;

  const render = () => {
    const slide = slides[index];
    if (!slide) return;
    imgEl.src = slide.src;
    imgEl.alt = slide.alt;
    imgEl.width = slide.width;
    imgEl.height = slide.height;
    captionEl.textContent = slide.alt;
    counterEl.textContent = counterTemplate
      .replace('{current}', String(index + 1))
      .replace('{total}', String(slides.length));
    const single = slides.length < 2;
    prevBtn.hidden = single;
    nextBtn.hidden = single;
  };

  const go = (delta: number) => {
    index = (index + delta + slides.length) % slides.length;
    render();
  };

  const open = (gallery: HTMLElement, start: number, source: HTMLElement) => {
    slides = [...gallery.querySelectorAll<HTMLElement>('[data-lb-item]')].map((el) => ({
      src: el.dataset.lbSrc ?? '',
      alt: el.dataset.lbAlt ?? '',
      width: Number(el.dataset.lbWidth ?? 1600),
      height: Number(el.dataset.lbHeight ?? 1200),
    }));
    index = start;
    opener = source;
    render();
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  };

  galleries.forEach((gallery) => {
    gallery.querySelectorAll<HTMLElement>('[data-lb-item]').forEach((item, i) => {
      const trigger = item.querySelector<HTMLElement>('[data-lb-trigger]') ?? item;
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        open(gallery, i, trigger);
      });
    });
  });

  prevBtn.addEventListener('click', () => go(-1));
  nextBtn.addEventListener('click', () => go(1));
  dialog.querySelector('[data-lb-close]')?.addEventListener('click', () => dialog.close());

  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      go(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      go(-1);
    }
  });

  // Click on the backdrop (i.e. the dialog element itself) closes.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });

  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    imgEl.removeAttribute('src');
    opener?.focus();
    opener = null;
  });

  // Swipe between slides on touch, without hijacking vertical scrolling.
  let startX = 0;
  let startY = 0;
  dialog.addEventListener(
    'touchstart',
    (e) => {
      startX = e.changedTouches[0].clientX;
      startY = e.changedTouches[0].clientY;
    },
    { passive: true },
  );
  dialog.addEventListener(
    'touchend',
    (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
    },
    { passive: true },
  );
}


/* ------------------------------------------------------------- header --- */

/**
 * Flags the header once the page has scrolled, so a header sitting over a
 * hero can fade into its normal surface. A sentinel beats a scroll listener:
 * no work on the main thread while scrolling.
 */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-site-header]');
  if (!header) return;

  const setState = (scrolled: boolean) => {
    header.dataset.scrolled = String(scrolled);
  };

  if (!('IntersectionObserver' in window)) {
    setState(true);
    return;
  }

  const sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:60vh;pointer-events:none';
  document.body.prepend(sentinel);

  new IntersectionObserver(([entry]) => setState(!entry.isIntersecting), {
    threshold: 0,
  }).observe(sentinel);
}

/* ---------------------------------------------------------- hero video --- */

/**
 * The poster image is what paints (and what LCP measures). The loop is only
 * fetched afterwards, and only when the visitor has not asked for reduced
 * motion, is not on Save-Data, and is not on a slow connection.
 */
function initHeroVideo() {
  const video = document.querySelector<HTMLVideoElement>('[data-hero-video]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-hero-toggle]');
  if (!video) return;

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } })
    .connection;
  const frugal =
    conn?.saveData === true || ['slow-2g', '2g'].includes(conn?.effectiveType ?? '');

  if (prefersReducedMotion() || frugal) return;

  const narrow = window.matchMedia('(max-width: 900px)').matches;
  video.src = (narrow ? video.dataset.srcNarrow : video.dataset.srcWide) ?? '';
  video.load();

  video.addEventListener(
    'canplay',
    () => {
      video.dataset.ready = 'true';
      void video.play().catch(() => {
        /* Autoplay refused (iOS low-power mode): the poster stays, which is fine. */
      });
    },
    { once: true },
  );

  if (!toggle) return;

  const pauseIcon = toggle.querySelector<HTMLElement>('[data-icon-pause]')!;
  const playIcon = toggle.querySelector<HTMLElement>('[data-icon-play]')!;
  const label = toggle.querySelector<HTMLElement>('[data-hero-toggle-label]')!;
  const labels = {
    pause: toggle.dataset.labelPause ?? '',
    play: toggle.dataset.labelPlay ?? '',
  };

  const sync = () => {
    const playing = !video.paused;
    pauseIcon.hidden = !playing;
    playIcon.hidden = playing;
    label.textContent = playing ? labels.pause : labels.play;
  };

  video.addEventListener('playing', () => {
    toggle.hidden = false;
    sync();
  });
  video.addEventListener('pause', sync);

  toggle.addEventListener('click', () => {
    if (video.paused) void video.play();
    else video.pause();
    sync();
  });

  // Nothing decodes while the hero is off screen or the tab is hidden.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) video.pause();
        else if (toggle.dataset.userPaused !== 'true') void video.play().catch(() => {});
      },
      { threshold: 0.05 },
    ).observe(video);

    toggle.addEventListener('click', () => {
      toggle.dataset.userPaused = String(video.paused);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) video.pause();
    else if (toggle.dataset.userPaused !== 'true') void video.play().catch(() => {});
  });
}

/* ------------------------------------------------------------ marquee ---- */

/** Keyboard users get the same pause that hover gives a mouse user. */
function initMarquee() {
  document.querySelectorAll<HTMLElement>('[data-marquee]').forEach((el) => {
    const stop = () => (el.dataset.paused = 'true');
    const go = () => (el.dataset.paused = 'false');
    el.addEventListener('focusin', stop);
    el.addEventListener('focusout', go);
    document.addEventListener('visibilitychange', () =>
      document.hidden ? stop() : go(),
    );
  });
}

/* ------------------------------------------------------------- forms ---- */

function initContactForm() {
  const form = document.querySelector<HTMLFormElement>('[data-contact-form]');
  if (!form) return;

  const summary = form.querySelector<HTMLElement>('[data-form-errors]');
  const summaryList = form.querySelector<HTMLElement>('[data-form-errors-list]');
  const status = form.querySelector<HTMLElement>('[data-form-status]');

  const setFieldError = (field: HTMLInputElement | HTMLTextAreaElement, message: string | null) => {
    const errorEl = form.querySelector<HTMLElement>(`[data-error-for="${field.name}"]`);
    field.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (errorEl) {
      errorEl.textContent = message ?? '';
      errorEl.hidden = !message;
    }
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const name = String(data.get('name') ?? '').trim();
    const email = String(data.get('email') ?? '').trim();
    const phone = String(data.get('phone') ?? '').trim();
    const unit = String(data.get('unit') ?? '').trim();
    const message = String(data.get('message') ?? '').trim();

    const errors: { field: string; message: string }[] = [];
    const check = (
      selector: string,
      valid: boolean,
      messageKey: 'name' | 'email' | 'message',
    ) => {
      const field = form.querySelector<HTMLInputElement>(`[name="${selector}"]`);
      if (!field) return;
      const msg = valid ? null : (form.dataset[`err${messageKey[0].toUpperCase()}${messageKey.slice(1)}`] ?? '');
      setFieldError(field, msg);
      if (msg) errors.push({ field: selector, message: msg });
    };

    check('name', name.length > 1, 'name');
    check('email', /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email), 'email');
    check('message', message.length > 4, 'message');

    if (summary && summaryList) {
      summaryList.innerHTML = '';
      summary.hidden = errors.length === 0;
      for (const err of errors) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#field-${err.field}`;
        a.textContent = err.message;
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          form.querySelector<HTMLElement>(`[name="${err.field}"]`)?.focus();
        });
        li.append(a);
        summaryList.append(li);
      }
    }

    if (errors.length) {
      summary?.focus();
      return;
    }

    const subject = form.dataset.subject ?? 'Vila SCALA';
    const bodyLines = [
      `${form.dataset.labelName}: ${name}`,
      `${form.dataset.labelEmail}: ${email}`,
      phone ? `${form.dataset.labelPhone}: ${phone}` : null,
      unit ? `${form.dataset.labelUnit}: ${unit}` : null,
      '',
      message,
    ].filter(Boolean);

    const href = `mailto:${form.dataset.to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyLines.join('\n'))}`;
    window.location.href = href;

    if (status) {
      status.hidden = false;
    }
  });
}

/* ------------------------------------------------------------ cookies --- */

function initCookieConsent() {
  const bar = document.querySelector<HTMLElement>('[data-cookie-bar]');
  if (!bar) return;

  const storageKey = 'vs-cookie-consent';
  const root = document.documentElement;

  const read = () => {
    try {
      return localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const open = () => {
    bar.hidden = false;
    root.dataset.cookieBar = 'open';
  };

  const close = () => {
    bar.hidden = true;
    delete root.dataset.cookieBar;
  };

  bar.querySelectorAll<HTMLButtonElement>('[data-cookie-choice]').forEach((button) => {
    button.addEventListener('click', () => {
      const choice = button.dataset.cookieChoice === 'all' ? 'all' : 'necessary';
      try {
        localStorage.setItem(storageKey, choice);
      } catch {
        /* The choice still applies for this page view when storage is unavailable. */
      }
      document.dispatchEvent(new CustomEvent('vs:cookie-consent', { detail: choice }));
      close();
    });
  });

  document.querySelectorAll<HTMLButtonElement>('[data-cookie-settings]').forEach((button) => {
    button.addEventListener('click', open);
  });

  if (!read()) open();
}

/* -------------------------------------------------------------- boot ---- */

const boot = () => {
  initTheme();
  initHeader();
  initMenu();
  initReveal();
  initLightbox();
  initHeroVideo();
  initMarquee();
  initContactForm();
  initCookieConsent();
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
