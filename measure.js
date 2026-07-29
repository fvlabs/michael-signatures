const { chromium } = require('playwright-core');
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true });
  const p = await b.newPage();
  await p.goto('file:///home/kevin-farias/michael-signatures/kevin-signature-fixed.html', { waitUntil: 'networkidle' });
  const data = await p.evaluate(() => {
    const r = el => { const b = el.getBoundingClientRect(); return { top: Math.round(b.top), bottom: Math.round(b.bottom), h: Math.round(b.height), w: Math.round(b.width) }; };
    const rows = [...document.querySelectorAll('tr')];
    const imgs = [...document.querySelectorAll('img')];
    const photoTd = imgs[0].closest('td');
    const textTd = photoTd.nextElementSibling;
    const lastText = textTd.querySelector('p:last-of-type');
    return {
      row1: r(rows[0]), row1_styleHeight: rows[0].getAttribute('style'),
      row2: r(rows[1]),
      photo: r(imgs[0]), photoTd: r(photoTd),
      textTd: r(textTd), lastTextLine: r(lastText),
      banner: r(imgs[1]),
      gap_photoBottom_to_banner: r(imgs[1]).top - r(imgs[0]).bottom,
      gap_lastText_to_banner: r(imgs[1]).top - r(lastText).bottom,
      gap_row1Bottom_to_bannerTop: r(imgs[1]).top - r(rows[0]).bottom,
    };
  });
  console.log(JSON.stringify(data, null, 2));
  await b.close();
})();
