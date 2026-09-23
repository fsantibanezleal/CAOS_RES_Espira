// Screenshot helpers for the browser gates. Not a gate itself: CI runs `e2e/*.mjs`, and this lives one
// directory down.
//
// Shell 0.6.8 makes <body>, not the window, the page's scroll container (known defect 1 in CAOS_MANAGE
// conventions/shell-known-defects.md): <html> stays one viewport tall and <body> scrolls inside it. A
// Playwright `fullPage` screenshot sizes its canvas from the document and paints what the viewport
// shows, so every capture these gates took came out one viewport of real page followed by thousands of
// pixels of empty background. Since 0.15.004 the product carries the register's override and the
// document scrolls; this helper stays because it captures correctly either way, and a shell upgrade
// that regressed the override would otherwise silently blank the evidence again.

/**
 * Capture the whole page as a reader would scroll through it.
 *
 * Lets the document grow to its content for the length of one screenshot, then puts the shell's
 * layout back, so nothing measured afterwards in the same page sees the change.
 */
export async function capturePage(page, path) {
  const saved = await page.evaluate(() => {
    const html = document.documentElement;
    const body = document.body;
    const before = {
      htmlHeight: html.style.height,
      htmlOverflow: html.style.overflow,
      bodyHeight: body.style.height,
      bodyOverflow: body.style.overflow,
      scrollTop: body.scrollTop,
    };
    html.style.height = 'auto';
    html.style.overflow = 'visible';
    body.style.height = 'auto';
    body.style.overflow = 'visible';
    return before;
  });
  // A sticky header is painted at the scroll position the page is left at, so a page still scrolled
  // from an earlier check came out with its header drawn across the middle of the capture.
  const scrolledTo = await page.evaluate(() => {
    const y = window.scrollY;
    window.scrollTo(0, 0);
    return y;
  });
  try {
    await page.screenshot({ path, fullPage: true });
  } finally {
    await page.evaluate((y) => window.scrollTo(0, y), scrolledTo);
    await page.evaluate((before) => {
      const html = document.documentElement;
      const body = document.body;
      html.style.height = before.htmlHeight;
      html.style.overflow = before.htmlOverflow;
      body.style.height = before.bodyHeight;
      body.style.overflow = before.bodyOverflow;
      body.scrollTop = before.scrollTop;
    }, saved);
  }
}

/**
 * Scroll the page the way a reader does, with the mouse wheel, and report whether the last block of
 * content ends up on screen. A page whose container clipped its own overflow would still pass every
 * text and layout check while the reader could never reach its end; this is the check that sees it.
 */
export async function lastBlockReachable(page, { notches = 60, step = 600 } = {}) {
  const viewport = page.viewportSize();
  await page.mouse.move(viewport.width / 2, viewport.height / 2);
  for (let i = 0; i < notches; i += 1) await page.mouse.wheel(0, step);
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const article = document.querySelector('main article') ?? document.querySelector('main');
    if (!article) return { found: false };
    const blocks = Array.from(article.children).filter((el) => {
      const box = el.getBoundingClientRect();
      return box.height > 0 && box.width > 0;
    });
    const last = blocks[blocks.length - 1];
    if (!last) return { found: false };
    const box = last.getBoundingClientRect();
    return {
      found: true,
      tag: last.tagName.toLowerCase(),
      top: Math.round(box.top),
      bottom: Math.round(box.bottom),
      viewport: window.innerHeight,
      visible: box.top < window.innerHeight && box.bottom > 0,
    };
  });
}
