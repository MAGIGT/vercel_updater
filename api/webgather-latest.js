'use strict';

const LATEST_YML_URL = 'https://github.com/MAGIGT/vercel_updater/releases/latest/download/latest.yml';

module.exports = async function handler(_request, response) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const upstream = await fetch(`${LATEST_YML_URL}?t=${Date.now()}`, {
      redirect: 'follow',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        Accept: 'application/octet-stream, text/yaml, text/plain, */*',
        'User-Agent': 'WebGather-Update-Page/1.0'
      }
    });

    if (!upstream.ok) {
      response.status(502).json({ ok: false, error: `GitHub HTTP ${upstream.status}` });
      return;
    }

    const body = Buffer.from(await upstream.arrayBuffer());
    if (!body.length || !/version\s*:/i.test(body.toString('utf8'))) {
      response.status(502).json({ ok: false, error: 'Invalid latest.yml response' });
      return;
    }

    response.setHeader('Content-Type', 'text/yaml; charset=utf-8');
    response.setHeader('Content-Disposition', 'inline; filename="latest.yml"');
    response.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.status(200).send(body);
  } catch (error) {
    const message = error?.name === 'AbortError' ? 'GitHub request timed out' : String(error?.message || error);
    response.status(502).json({ ok: false, error: message });
  } finally {
    clearTimeout(timeout);
  }
};
