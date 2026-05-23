import express from 'express';
import QRCode from 'qrcode';
import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg as any;
import fs from 'node:fs';

type SessionState =
  | { status: 'DISCONNECTED' }
  | { status: 'QR_REQUIRED'; qr?: string; qrDataUrl?: string; updatedAt: number }
  | { status: 'CONNECTED'; updatedAt: number }
  | { status: 'ERROR'; message: string; updatedAt: number };

const app = express();
app.use(express.json({ limit: '2mb' }));

const sessions = new Map<string, { client: any; state: SessionState; reconnectTimer?: ReturnType<typeof setTimeout> }>();

async function postToApi(path: string, body: unknown) {
  const base = process.env.API_BASE_URL;
  if (!base) return;
  const secret = process.env.WA_WORKER_SECRET;
  try {
    await fetch(`${base}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(secret ? { 'x-worker-secret': secret } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch {
    // Best-effort. Worker should never crash because API is temporarily down.
  }
}

function resolveChromePath(): string | undefined {
  const fromEnv = process.env.CHROME_PATH;
  if (fromEnv) return fromEnv;

  const candidates =
    process.platform === 'darwin'
      ? [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium',
          '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        ]
      : process.platform === 'linux'
        ? ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']
        : [];

  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) return p;
    } catch { /* ignore */ }
  }
  return undefined;
}

function scheduleReconnect(businessId: string, delayMs = 30_000) {
  const entry = sessions.get(businessId);
  if (!entry) return;
  if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer);
  entry.reconnectTimer = setTimeout(async () => {
    const current = sessions.get(businessId);
    if (!current || current.state.status === 'CONNECTED') return;
    console.log(`[wa-worker] Auto-reconnecting session for ${businessId}…`);
    try {
      await current.client?.initialize?.();
    } catch (e) {
      console.error(`[wa-worker] Reconnect failed for ${businessId}:`, e);
      scheduleReconnect(businessId, 60_000); // back-off to 60s
    }
  }, delayMs);
}

function getOrCreateClient(businessId: string) {
  const existing = sessions.get(businessId);
  if (existing) return existing;

  const chromePath = resolveChromePath();
  if (!chromePath) {
    const entry = {
      client: null as any,
      state: {
        status: 'ERROR',
        message:
          'Chrome/Chromium not found. Set CHROME_PATH or run the Docker worker image.',
        updatedAt: Date.now(),
      } as SessionState,
    };
    sessions.set(businessId, entry);
    return entry;
  }

  const client = new Client({
    authStrategy: new LocalAuth({ clientId: businessId, dataPath: 'sessions' }),
    puppeteer: {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: chromePath,
    },
  });

  const entry: typeof sessions extends Map<string, infer V> ? V : never = {
    client,
    state: { status: 'DISCONNECTED' } as SessionState,
  };
  sessions.set(businessId, entry);

  client.on('qr', async (qr: string) => {
    const qrDataUrl = await QRCode.toDataURL(qr);
    entry.state = { status: 'QR_REQUIRED', qr, qrDataUrl, updatedAt: Date.now() };
  });

  client.on('ready', () => {
    entry.state = { status: 'CONNECTED', updatedAt: Date.now() };
    if (entry.reconnectTimer) { clearTimeout(entry.reconnectTimer); entry.reconnectTimer = undefined; }
    postToApi('/wa/events', { type: 'connected', businessId });
  });

  client.on('authenticated', () => {
    // state stays as-is until 'ready'
  });

  client.on('disconnected', (reason: unknown) => {
    console.log(`[wa-worker] Session ${businessId} disconnected: ${String(reason)}`);
    entry.state = { status: 'DISCONNECTED' };
    postToApi('/wa/events', { type: 'disconnected', businessId });
    scheduleReconnect(businessId, 30_000);
  });

  client.on('auth_failure', (msg: unknown) => {
    entry.state = { status: 'ERROR', message: String(msg), updatedAt: Date.now() };
    scheduleReconnect(businessId, 60_000);
  });

  client.on('message', async (m: any) => {
    const fromPhone = typeof m?.from === 'string' ? m.from : undefined;
    const body = typeof m?.body === 'string' ? m.body.trim() : '';
    const waMessageId = m?.id?._serialized ?? m?.id?.id ?? undefined;
    if (!body) return;

    // Detect provider commands: "CONFIRM <bookingId>" or "CANCEL <bookingId>"
    const commandMatch = /^(CONFIRM|CANCEL)\s+(\S+)$/i.exec(body);
    if (commandMatch) {
      const action = commandMatch[1].toUpperCase() as 'CONFIRM' | 'CANCEL';
      const appointmentId = commandMatch[2];
      console.log(`[wa-worker] Command detected: ${action} ${appointmentId} from ${fromPhone}`);
      await postToApi('/wa/booking-action', { appointmentId, action, businessId });
    }

    await postToApi('/wa/events', {
      type: 'message',
      businessId,
      waMessageId,
      fromPhone,
      fromName: undefined,
      direction: 'IN',
      body,
      timestampMs: typeof m?.timestamp === 'number' ? m.timestamp * 1000 : Date.now(),
    });
  });

  return entry;
}

// ── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  const sessionCount = sessions.size;
  const connected = [...sessions.values()].filter((s) => s.state.status === 'CONNECTED').length;
  res.json({ ok: true, sessions: sessionCount, connected });
});

app.get('/sessions/:businessId/status', (req, res) => {
  const { businessId } = req.params;
  const entry = sessions.get(businessId);
  if (!entry) return res.json({ status: 'DISCONNECTED' });
  res.json(entry.state);
});

app.post('/sessions/:businessId/connect', async (req, res) => {
  const { businessId } = req.params;
  const entry = getOrCreateClient(businessId);
  if (!entry.client) return res.status(500).json(entry.state);
  try {
    await entry.client.initialize();
    res.json({ ok: true, ...entry.state });
  } catch (e) {
    entry.state = { status: 'ERROR', message: e instanceof Error ? e.message : 'Unknown error', updatedAt: Date.now() };
    res.status(500).json(entry.state);
  }
});

/** Send a WhatsApp message to a phone number. */
app.post('/sessions/:businessId/send', async (req, res) => {
  const { businessId } = req.params;
  const { to, message } = req.body as { to?: string; message?: string };

  if (!to || !message) {
    return res.status(400).json({ ok: false, error: 'to and message are required' });
  }

  const entry = sessions.get(businessId);
  if (!entry || entry.state.status !== 'CONNECTED') {
    return res.status(503).json({ ok: false, error: 'WhatsApp session not connected' });
  }

  // Normalize phone: strip non-digits, append @c.us
  const digits = to.replace(/\D/g, '');
  const chatId = digits.includes('@') ? digits : `${digits}@c.us`;

  try {
    const sentMsg = await entry.client.sendMessage(chatId, message);
    const waMessageId = sentMsg?.id?._serialized ?? sentMsg?.id?.id ?? undefined;

    // Notify API of the outbound message so it appears in the Inbox
    await postToApi('/wa/events', {
      type: 'message',
      businessId,
      waMessageId,
      fromPhone: chatId,
      direction: 'OUT',
      body: message,
      timestampMs: Date.now(),
    });

    res.json({ ok: true, waMessageId });
  } catch (e) {
    console.error(`[wa-worker] Send failed for ${businessId} → ${chatId}:`, e);
    res.status(500).json({ ok: false, error: e instanceof Error ? e.message : 'Send failed' });
  }
});

app.post('/sessions/:businessId/logout', async (req, res) => {
  const { businessId } = req.params;
  const entry = sessions.get(businessId);
  if (!entry) return res.json({ ok: true });
  if (entry.reconnectTimer) clearTimeout(entry.reconnectTimer);
  try {
    await entry.client?.logout?.();
    await entry.client?.destroy?.();
    sessions.delete(businessId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ ok: false, message: e instanceof Error ? e.message : 'Unknown error' });
  }
});

// ── Heartbeat loop ────────────────────────────────────────────────────────
const HEARTBEAT_INTERVAL_MS = 60_000; // every 60 seconds

setInterval(async () => {
  for (const [businessId, entry] of sessions) {
    if (entry.state.status !== 'CONNECTED') continue;
    try {
      const state = await entry.client?.getState?.();
      if (!state || state === 'CONFLICT' || state === 'UNPAIRED' || state === 'UNPAIRED_IDLE') {
        console.warn(`[wa-worker] Heartbeat: session ${businessId} in bad state (${state}), triggering reconnect`);
        entry.state = { status: 'DISCONNECTED' };
        scheduleReconnect(businessId, 5_000);
      }
    } catch {
      console.warn(`[wa-worker] Heartbeat check failed for ${businessId}`);
    }
  }
}, HEARTBEAT_INTERVAL_MS);

// ── Start ─────────────────────────────────────────────────────────────────
const port = Number(process.env.PORT ?? 3100);
app.listen(port, () => {
  console.log(`[wa-worker] Listening on :${port}`);
});
