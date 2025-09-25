/**
 * WhatsApp Redirect Controller
 */

import WhatsAppIntent from '../models/WhatsAppIntent.js';

const buildWaUrl = (rawNumber, prefilledText) => {
  const sanitizedNumber = String(rawNumber).replace(/[^\d]/g, '');
  const base = `https://wa.me/${sanitizedNumber}`;
  if (prefilledText && prefilledText.trim().length > 0) {
    const text = encodeURIComponent(prefilledText.trim());
    return `${base}?text=${text}`;
  }
  return base;
};

export const redirectToWhatsApp = async (req, res, next) => {
  try {
    const targetNumber = req.query.number;
    const prefilledText = req.query.text;
    const source = req.query.source;

    // Persist minimal intent log
    await WhatsAppIntent.create({
      targetNumber,
      prefilledText,
      source,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer')
    });

    const waUrl = buildWaUrl(targetNumber, prefilledText);
    return res.redirect(302, waUrl);
  } catch (error) {
    next(error);
  }
};

// Render a lightweight HTML page that auto-opens primary WhatsApp link
// and offers a visible backup link after a short countdown
export const smartRedirectPage = async (req, res, next) => {
  try {
    const targetNumber = req.query.number; // required
    let backup = req.query.backup; // optional (string or array)
    const prefilledText = req.query.text; // optional
    const source = req.query.source; // optional
    const timeoutMs = Math.min(Math.max(parseInt(req.query.timeoutMs || '3000'), 1000), 10000);

    // Persist minimal intent log
    await WhatsAppIntent.create({
      targetNumber,
      prefilledText,
      source,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      referer: req.get('referer')
    });

    // Normalize backups: accept repeatable params or single string; else fallback to env list
    let backupNumbers = [];
    if (Array.isArray(backup)) {
      backupNumbers = backup;
    } else if (typeof backup === 'string' && backup.trim().length > 0) {
      backupNumbers = [backup];
    } else if (process.env.WHATSAPP_NUMBERS) {
      backupNumbers = process.env.WHATSAPP_NUMBERS.split(',').map(n => n.trim()).filter(Boolean).filter(n => n !== targetNumber);
    }

    const primaryUrl = buildWaUrl(targetNumber, prefilledText);
    const backupUrls = backupNumbers.map(n => buildWaUrl(n, prefilledText));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Opening WhatsApp…</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:24px;background:#fff;color:#111}
    .card{max-width:640px;margin:40px auto;padding:24px;border:1px solid #eee;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.06)}
    h1{font-size:20px;margin:0 0 12px}
    p{margin:8px 0;color:#444}
    .btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:8px;text-decoration:none}
    .primary{background:#25D366;color:#fff}
    .secondary{background:#f1f5f9;color:#111}
    .muted{color:#666;font-size:14px}
  </style>
  <script>
    function openUrl(u){ try{ window.location.href = u; }catch(e){ console.error(e); } }
    document.addEventListener('DOMContentLoaded', function(){
      var primary = ${JSON.stringify(primaryUrl)};
      var backups = ${JSON.stringify(backupUrls)};
      var timeoutMs = ${timeoutMs};
      var countdownEl = document.getElementById('countdown');
      var remaining = Math.floor(timeoutMs/1000);
      countdownEl.textContent = remaining;
      var tick = setInterval(function(){ remaining--; if(remaining<=0){ clearInterval(tick); } countdownEl.textContent = Math.max(remaining,0); }, 1000);
      // Immediately attempt primary
      openUrl(primary);
      // After timeout, reveal backup CTA if available
      setTimeout(function(){
        var backupCta = document.getElementById('backup-cta');
        if(backupCta && backups && backups.length){ backupCta.style.display = 'block'; }
      }, timeoutMs);
    });
  </script>
  <noscript>
    <meta http-equiv="refresh" content="0;url=${primaryUrl}">
  </noscript>
  <meta http-equiv="refresh" content="10;url=${primaryUrl}">
</head>
<body>
  <div class="card">
    <h1>Opening WhatsApp…</h1>
    <p class="muted">If WhatsApp doesn't open automatically, use the buttons below.</p>
    <p><a class="btn primary" href="${primaryUrl}">Open primary WhatsApp</a></p>
    ${backupUrls.length ? `<div id="backup-cta" style="display:none">
      <p>Didn't open in <span id="countdown"></span>s?</p>
      ${backupUrls.map((u, i) => `<p><a class=\"btn secondary\" href=\"${u}\">Try backup #${i+1}</a></p>`).join('')}
    </div>` : `<p class="muted">No backup number configured.</p>`}
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);
  } catch (error) {
    next(error);
  }
};


