/**
 * Atmosphere layer: animated film grain and scroll-triggered reveals.
 * Everything here is decorative and self-disabling under prefers-reduced-motion.
 */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Film grain --------------------------------------------------------
     A small noise tile is generated once, then redrawn at a few random
     offsets per second. Cheap, and it reads as real film grain rather than
     a static texture. */
  const grain = document.querySelector('canvas.grain');

  if (grain) {
    const ctx = grain.getContext('2d', { alpha: true });
    const TILE = 128;
    const tile = document.createElement('canvas');
    tile.width = TILE;
    tile.height = TILE;

    const tileCtx = tile.getContext('2d');
    const image = tileCtx.createImageData(TILE, TILE);

    for (let i = 0; i < image.data.length; i += 4) {
      const value = 128 + (Math.random() - 0.5) * 255;
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = 255;
    }

    tileCtx.putImageData(image, 0, 0);

    const pattern = ctx.createPattern(tile, 'repeat');
    let width = 0;
    let height = 0;

    const resize = () => {
      width = grain.clientWidth;
      height = grain.clientHeight;
      grain.width = width;
      grain.height = height;
      ctx.fillStyle = pattern;
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      // Jitter the pattern origin so the grain crawls instead of sitting still.
      ctx.translate(Math.floor(Math.random() * TILE) - TILE, Math.floor(Math.random() * TILE) - TILE);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, width + TILE * 2, height + TILE * 2);
      ctx.restore();
    };

    resize();
    window.addEventListener('resize', resize);

    if (reduceMotion) {
      paint(); // Static grain, no animation.
    } else {
      let timer = null;
      const loop = () => {
        paint();
        timer = setTimeout(() => requestAnimationFrame(loop), 1000 / 12);
      };
      loop();

      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          clearTimeout(timer);
        } else {
          clearTimeout(timer);
          loop();
        }
      });
    }
  }

  /* ---- Scroll reveals ----------------------------------------------------
     Elements fade and rise once as they enter the viewport. Children of a
     [data-reveal-group] are staggered by their index. */
  const revealables = document.querySelectorAll('[data-reveal], [data-reveal-group] > *');

  if (revealables.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealables.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    revealables.forEach((el) => el.classList.add('will-reveal'));

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        const group = el.parentElement?.hasAttribute('data-reveal-group')
          ? [...el.parentElement.children].indexOf(el)
          : 0;

        el.style.transitionDelay = `${Math.min(group, 6) * 90}ms`;
        el.classList.add('is-revealed');
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    revealables.forEach((el) => observer.observe(el));

    // Safety net: content must never stay invisible because the observer
    // failed to deliver (background/throttled rendering has been seen to
    // suspend it). Reveal anything still hidden after a few seconds.
    setTimeout(() => {
      revealables.forEach((el) => el.classList.add('is-revealed'));
    }, 4000);
  }
})();
