import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import bcrypt from 'bcryptjs';
import multer from 'multer';

// Type definitions for internal server database
interface DbSchema {
  users: {
    person_1: {
      id: 'person_1';
      slot: 1;
      name: string;
      username: string;
      passwordHash: string;
      logo: any;
      pfpUrl: string;
      nickname: string;
      bio: string;
      isLocked: boolean;
      lockReason?: string;
      allowedMinutes: number;
      dailyUsageSeconds: number;
      dailyUsageDate?: string;
      sessionStartTimestamp?: number;
      activeUsageSeconds?: number;
      activeSessionCount?: number;
      activeSessionStartedAt?: number;
      lastActiveTimestamp?: number;
    };
    person_2: {
      id: 'person_2';
      slot: 2;
      name: string;
      username: string;
      passwordHash: string;
      logo: any;
      pfpUrl: string;
      nickname: string;
      bio: string;
      isLocked: boolean;
      lockReason?: string;
      allowedMinutes: number;
      dailyUsageSeconds: number;
      dailyUsageDate?: string;
      sessionStartTimestamp?: number;
      activeUsageSeconds?: number;
      activeSessionCount?: number;
      activeSessionStartedAt?: number;
      lastActiveTimestamp?: number;
    };
  };
  admin: {
    username: string;
    passwordHash: string;
  };
  settings: {
    worldTitle: string;
    worldSubtitle: string;
    welcomeMessage: string;
    theme: 'celestial' | 'cyberpunk' | 'twilight' | 'aurora';
    chatWallpaper: string;
    accentColor: string;
    introDurationSeconds: number;
    timeOverMessage: string;
    timeStrategy: 'continuous' | 'daily';
    warningMinutes: number[];
    restrictionsOnExpire: {
      disableMessaging: boolean;
      disableVoiceCalls: boolean;
      disableVideoCalls: boolean;
      disableImages: boolean;
      disableFiles: boolean;
      disableVoiceMessages: boolean;
      lockSession: boolean;
    };
    featuresEnabled: {
      messages: boolean;
      reactions: boolean;
      imageSharing: boolean;
      fileSharing: boolean;
      voiceMessages: boolean;
      voiceCalls: boolean;
      videoCalls: boolean;
      editing: boolean;
      deleting: boolean;
    };
  };
  messages: any[];
  sessions: Record<string, {
    token: string;
    userId: 'person_1' | 'person_2' | 'admin';
    sessionStart: number;
    lastActive: number;
    allowedSeconds: number;
    isExpired: boolean;
    active?: boolean;
    endedAt?: number;
  }>;
  logs: any[];
}

// Initial seed
function getInitialDb(): DbSchema {
  const salt = bcrypt.genSaltSync(10);
  return {
    users: {
      person_1: {
        id: 'person_1',
        slot: 1,
        name: 'Kaelen Thorne',
        username: 'kaelen',
        passwordHash: bcrypt.hashSync('synax123', salt),
        logo: {
          id: 'astral_crest',
          name: 'Astral Crest',
          accentColor: '#6366f1',
          glowColor: 'rgba(99, 102, 241, 0.5)',
          svgPath: 'M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z'
        },
        pfpUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        nickname: 'Kael',
        bio: 'Guardian of the Northern Star',
        isLocked: false,
        allowedMinutes: 60,
        dailyUsageSeconds: 0,
        activeUsageSeconds: 0,
        activeSessionCount: 0,
      },
      person_2: {
        id: 'person_2',
        slot: 2,
        name: 'Seraphina Vance',
        username: 'seraphina',
        passwordHash: bcrypt.hashSync('synax123', salt),
        logo: {
          id: 'lunar_chrono',
          name: 'Lunar Chrono',
          accentColor: '#ec4899',
          glowColor: 'rgba(236, 72, 153, 0.5)',
          svgPath: 'M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z'
        },
        pfpUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
        nickname: 'Sera',
        bio: 'Keeper of the Celestial Loom',
        isLocked: false,
        allowedMinutes: 60,
        dailyUsageSeconds: 0,
      }
    },
    admin: {
      username: 'admin',
      passwordHash: bcrypt.hashSync('synax-admin-777', salt),
    },
    settings: {
      worldTitle: 'SYNAX',
      worldSubtitle: 'Where Two Worlds Meet.',
      welcomeMessage: 'Welcome to your private sanctuary. Every conversation, voice note, and shared moment here belongs solely to you both.',
      theme: 'celestial',
      chatWallpaper: 'stars',
      accentColor: '#6366f1',
      introDurationSeconds: 7,
      timeOverMessage: 'Your private-world time has ended for now. See you again soon ✨',
      timeStrategy: 'continuous',
      warningMinutes: [10, 5, 1],
      showTimerToUsers: true,
      restrictionsOnExpire: {
        disableMessaging: true,
        disableVoiceCalls: true,
        disableVideoCalls: true,
        disableImages: true,
        disableFiles: true,
        disableVoiceMessages: true,
        lockSession: false
      },
      featuresEnabled: {
        messages: true,
        reactions: true,
        imageSharing: true,
        fileSharing: true,
        voiceMessages: true,
        voiceCalls: true,
        videoCalls: true,
        editing: true,
        deleting: true
      }
    },
    messages: [
      {
        id: 'msg_init_sys',
        senderId: 'system',
        type: 'system',
        text: '✦ The Synax sanctuary has been initialized. A sacred digital world for two.',
        timestamp: Date.now() - 3600000,
        status: 'read',
        reactions: {}
      },
      {
        id: 'msg_init_1',
        senderId: 'person_1',
        type: 'text',
        text: 'Hey Sera! I configured our private sanctuary. No algorithms, no noise, just our universe.',
        timestamp: Date.now() - 3000000,
        status: 'read',
        reactions: { person_2: '✨' }
      },
      {
        id: 'msg_init_2',
        senderId: 'person_2',
        type: 'text',
        text: 'Kael, this is stunning! The opening marks and atmosphere are breathtaking. Let us guard this sanctuary.',
        timestamp: Date.now() - 2500000,
        status: 'read',
        reactions: { person_1: '❤️' }
      }
    ],
    sessions: {},
    logs: [
      {
        id: 'log_init',
        timestamp: Date.now(),
        actor: 'System',
        action: 'Synax Core Initialized',
        details: 'Initial configuration and user marks loaded',
        level: 'info'
      }
    ]
  };
}

// Persistent state: Supabase Postgres in production, local JSON only for development fallback.
// IMPORTANT: SUPABASE_SERVICE_ROLE_KEY is server-only and must never be exposed to the browser.
let SUPABASE_URL = '';
let SUPABASE_SERVICE_ROLE_KEY = '';
let cloudflareEnv: any = null;
let cloudflareExecutionContext: any = null;

export function configureCloudflareRuntime(env: any, ctx: any) {
  cloudflareEnv = env;
  cloudflareExecutionContext = ctx;
  SUPABASE_URL = String(env.SUPABASE_URL || '').replace(/\/$/, '');
  SUPABASE_SERVICE_ROLE_KEY = String(env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY || '');
}
const SUPABASE_STATE_TABLE = 'synax_state';
const SUPABASE_STATE_ID = 'main';
const SUPABASE_SESSIONS_TABLE = 'synax_sessions';
const SUPABASE_CALL_SIGNALS_TABLE = 'synax_call_signals';
const isProduction = true;
const useSupabase = true;

let db: DbSchema;
let persistenceQueue: Promise<void> = Promise.resolve();
let lastRemoteSync = 0;

function cloneDb(value: DbSchema): DbSchema {
  return JSON.parse(JSON.stringify(value));
}

function getSupabaseHeaders() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase environment variables are missing.');
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
  };
}

async function supabaseFetch(pathname: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}${pathname}`, {
    ...init,
    headers: { ...getSupabaseHeaders(), ...(init.headers || {}) },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${body.slice(0, 500)}`);
  }
  return res;
}

async function persistToSupabase(snapshot: DbSchema) {
  const body = JSON.stringify({ id: SUPABASE_STATE_ID, state: snapshot, updated_at: new Date().toISOString() });
  const res = await supabaseFetch(`/rest/v1/${SUPABASE_STATE_TABLE}?on_conflict=id`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body,
  });
  await res.arrayBuffer().catch(() => undefined);
}

async function loadDbFromSupabase(): Promise<DbSchema | null> {
  const res = await supabaseFetch(`/rest/v1/${SUPABASE_STATE_TABLE}?id=eq.${encodeURIComponent(SUPABASE_STATE_ID)}&select=state&limit=1`);
  const rows = await res.json() as Array<{ state: DbSchema }>;
  return rows[0]?.state || null;
}

async function getSessionFromSupabase(token: string): Promise<DbSchema['sessions'][string] | null> {
  if (!useSupabase) return db.sessions[token] || null;
  const res = await supabaseFetch(
    `/rest/v1/${SUPABASE_SESSIONS_TABLE}?token=eq.${encodeURIComponent(token)}&select=token,user_id,session_start,last_active,allowed_seconds,is_expired,active,ended_at&limit=1`
  );
  const rows = await res.json() as any[];
  const row = rows[0];
  if (!row) return null;
  return {
    token: row.token,
    userId: row.user_id,
    sessionStart: Number(row.session_start),
    lastActive: Number(row.last_active),
    allowedSeconds: Number(row.allowed_seconds),
    isExpired: Boolean(row.is_expired),
    active: Boolean(row.active),
    ...(row.ended_at == null ? {} : { endedAt: Number(row.ended_at) }),
  } as DbSchema['sessions'][string];
}

async function saveSessionToSupabase(session: DbSchema['sessions'][string]) {
  if (!useSupabase) {
    db.sessions[session.token] = session;
    return;
  }
  await supabaseFetch(`/rest/v1/${SUPABASE_SESSIONS_TABLE}?on_conflict=token`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({
      token: session.token,
      user_id: session.userId,
      session_start: session.sessionStart,
      last_active: session.lastActive,
      allowed_seconds: session.allowedSeconds,
      is_expired: session.isExpired,
      active: Boolean(session.active),
      ended_at: session.endedAt ?? null,
    }),
  });
}

async function deleteSessionFromSupabase(token: string) {
  if (!useSupabase) {
    delete db.sessions[token];
    return;
  }
  await supabaseFetch(`/rest/v1/${SUPABASE_SESSIONS_TABLE}?token=eq.${encodeURIComponent(token)}`, { method: 'DELETE' });
}

async function listSessionsFromSupabase() {
  if (!useSupabase) return Object.values(db.sessions);
  const res = await supabaseFetch(
    `/rest/v1/${SUPABASE_SESSIONS_TABLE}?select=token,user_id,session_start,last_active,allowed_seconds,is_expired,active,ended_at&order=session_start.desc`
  );
  const rows = await res.json() as any[];
  return rows.map((row) => ({
    token: row.token,
    userId: row.user_id,
    sessionStart: Number(row.session_start),
    lastActive: Number(row.last_active),
    allowedSeconds: Number(row.allowed_seconds),
    isExpired: Boolean(row.is_expired),
    active: Boolean(row.active),
    ...(row.ended_at == null ? {} : { endedAt: Number(row.ended_at) }),
  }));
}

async function ensureSupabaseSchemaRow(seed: DbSchema) {
  const current = await loadDbFromSupabase();
  if (current) return current;
  await persistToSupabase(seed);
  return seed;
}

async function ensureStorageBucket() {
  if (!useSupabase) return;
  try {
    await supabaseFetch('/storage/v1/bucket', {
      method: 'POST',
      body: JSON.stringify({ id: 'synax-uploads', name: 'synax-uploads', public: true }),
    });
  } catch (err: any) {
    // 409 means the bucket already exists. Any other error should be surfaced.
    const message = String(err?.message || '');
    if (
      !message.includes('BucketAlreadyExists') &&
      !message.includes('Bucket already exists') &&
      !message.includes('statusCode\":\"409') &&
      !message.includes('statusCode=409') &&
      !message.includes('Supabase 409')
    ) throw err;
  }
}

async function initializeDatabase() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SYNAX Cloudflare requires SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }

  const seed = getInitialDb();
  db = (await ensureSupabaseSchemaRow(cloneDb(seed))) || seed;

  for (const id of ['person_1', 'person_2'] as const) {
    const user = db.users[id] as any;
    user.activeUsageSeconds ??= 0;
    user.activeSessionCount = 0;
    user.activeSessionStartedAt = undefined;
    user.sessionStartTimestamp = undefined;
  }

  await ensureStorageBucket();

  for (const session of Object.values(db.sessions) as any[]) {
    try { await saveSessionToSupabase(session); }
    catch (err) { console.error('Session migration failed:', err); }
  }

  for (const session of Object.values(db.sessions) as any[]) session.active = false;
  lastRemoteSync = Date.now();
  await saveDbSync();
  console.log('✦ SYNAX Cloudflare persistence: Supabase');
}

async function refreshDbFromSupabase() {
  if (!useSupabase) return;
  await persistenceQueue;
  try {
    const remote = await loadDbFromSupabase();
    if (remote) {
      db = remote;
      lastRemoteSync = Date.now();
    }
  } catch (err) {
    console.error('Failed to refresh SYNAX state:', err);
  }
}

function saveDbSync(): Promise<void> {
  const snapshot = cloneDb(db);
  persistenceQueue = persistenceQueue
    .catch(() => undefined)
    .then(() => persistToSupabase(snapshot))
    .catch((err) => console.error('Failed to persist SYNAX state:', err));

  // Cloudflare may finish the HTTP response before a detached promise finishes.
  cloudflareExecutionContext?.waitUntil?.(persistenceQueue);
  return persistenceQueue;
}

async function flushPersistence() {
  await persistenceQueue;
}

function addLog(actor: string, action: string, details?: string, level: 'info' | 'warn' | 'alert' = 'info') {
  const log = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: Date.now(),
    actor,
    action,
    details,
    level,
  };
  db.logs.unshift(log);
  if (db.logs.length > 300) db.logs = db.logs.slice(0, 300);
  void saveDbSync();
}

// Cloudflare realtime transport is handled by worker/realtime.ts (Durable Object).
function broadcast(payload: any, _filterFn?: any) {
  const binding = cloudflareEnv?.SYNAX_REALTIME_HUB;
  if (!binding) return;
  try {
    const id = binding.idFromName('main');
    const request = new Request('https://synax.internal/broadcast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const promise = id.fetch(request);
    cloudflareExecutionContext?.waitUntil?.(promise);
  } catch (err) {
    console.error('Realtime broadcast failed:', err);
  }
}

const chatPresence = new Map<
  'person_1' | 'person_2',
  { active: boolean; lastHeartbeat: number; lastSeen: number }
>();

function getChatPresenceState(userId: 'person_1' | 'person_2') {
  return chatPresence.get(userId) || {
    active: false,
    lastHeartbeat: 0,
    lastSeen: Number((db?.users?.[userId] as any)?.lastActiveTimestamp || 0),
  };
}

function getPresence(): { person_1: boolean; person_2: boolean; lastSeen_1: number; lastSeen_2: number } {
  const now = Date.now();

  for (const userId of ['person_1', 'person_2'] as const) {
    const state = getChatPresenceState(userId);
    if (state.active && now - state.lastHeartbeat > 12000) {
      state.active = false;
      state.lastSeen = state.lastHeartbeat || state.lastSeen || now;
      chatPresence.set(userId, state);
      const user = db.users[userId] as any;
      user.lastActiveTimestamp = state.lastSeen;
      if (Number(user.activeSessionCount || 0) > 0) stopActiveSession(userId);
    }
  }

  const p1 = getChatPresenceState('person_1');
  const p2 = getChatPresenceState('person_2');

  return {
    person_1: p1.active,
    person_2: p2.active,
    lastSeen_1: p1.active ? p1.lastSeen : (p1.lastSeen || 0),
    lastSeen_2: p2.active ? p2.lastSeen : (p2.lastSeen || 0),
  };
}

// SYNAX uses India time for daily reset.
function getIndiaDateKey(timestamp = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}

function getActiveConnectionCount(userId: 'person_1' | 'person_2'): number {
  return getChatPresenceState(userId).active ? 1 : 0;
}

// Server-authoritative usage timer.
function calculateTimeRemaining(userId: 'person_1' | 'person_2'): {
  hasLimit: boolean;
  mode: 'continuous' | 'daily';
  allowedSeconds: number;
  remainingSeconds: number;
  isExpired: boolean;
  customMessage: string;
  serverTimestamp: number;
  warnings: number[];
} {
  const user = db.users[userId] as any;
  const allowedMinutes = Number(user.allowedMinutes ?? 60);
  const hasLimit = allowedMinutes > 0;
  const allowedSeconds = hasLimit ? allowedMinutes * 60 : 86400;
  const strategy = db.settings.timeStrategy || 'continuous';
  const now = Date.now();

  let usedSeconds = 0;
  if (strategy === 'continuous') {
    usedSeconds = Number(user.activeUsageSeconds || 0);
    if (user.activeSessionStartedAt && Number(user.activeSessionCount || 0) > 0) {
      const heartbeat = getChatPresenceState(userId).lastHeartbeat || user.lastActiveTimestamp || now;
      const endAt = Math.min(now, heartbeat + 12000);
      usedSeconds += Math.max(0, Math.floor((endAt - user.activeSessionStartedAt) / 1000));
    }
  } else {
    const today = getIndiaDateKey(now);
    usedSeconds = user.dailyUsageDate === today ? Number(user.dailyUsageSeconds || 0) : 0;
  }

  const remainingSeconds = Math.max(0, allowedSeconds - usedSeconds);
  const isExpired = hasLimit && remainingSeconds <= 0;

  return {
    hasLimit,
    mode: strategy,
    allowedSeconds,
    remainingSeconds,
    isExpired,
    customMessage: db.settings.timeOverMessage,
    serverTimestamp: now,
    warnings: (db.settings.warningMinutes || [10, 5, 1]).map(m => m * 60)
  };
}

function startActiveSession(userId: 'person_1' | 'person_2') {
  const user = db.users[userId] as any;
  const now = Date.now();
  const today = getIndiaDateKey(now);

  if (db.settings.timeStrategy === 'daily' && user.dailyUsageDate !== today) {
    user.dailyUsageDate = today;
    user.dailyUsageSeconds = 0;
  }

  if (Number(user.activeSessionCount || 0) <= 0 || !user.activeSessionStartedAt) {
    user.activeSessionCount = 1;
    user.activeSessionStartedAt = now;
    user.sessionStartTimestamp = now;
  } else {
    user.activeSessionCount = 1;
  }

  user.lastActiveTimestamp = now;
  void saveDbSync();
}

function stopActiveSession(userId: 'person_1' | 'person_2') {
  const user = db.users[userId] as any;
  if (Number(user.activeSessionCount || 0) <= 0) {
    user.activeSessionCount = 0;
    user.activeSessionStartedAt = undefined;
    user.sessionStartTimestamp = undefined;
    return;
  }

  const now = Date.now();
  if (user.activeSessionStartedAt) {
    const elapsed = Math.max(0, Math.floor((now - user.activeSessionStartedAt) / 1000));
    if (db.settings.timeStrategy === 'daily') {
      user.dailyUsageDate = getIndiaDateKey(now);
      user.dailyUsageSeconds = Number(user.dailyUsageSeconds || 0) + elapsed;
    } else {
      user.activeUsageSeconds = Number(user.activeUsageSeconds || 0) + elapsed;
    }
  }

  user.activeSessionCount = 0;
  user.activeSessionStartedAt = undefined;
  user.sessionStartTimestamp = undefined;
  user.lastActiveTimestamp = now;
  void saveDbSync();
}

function checkpointActiveUsage(userId: 'person_1' | 'person_2') {
  const user = db.users[userId] as any;
  if (!user.activeSessionStartedAt || Number(user.activeSessionCount || 0) <= 0) return;

  const now = Date.now();
  const elapsed = Math.max(0, Math.floor((now - user.activeSessionStartedAt) / 1000));
  if (elapsed <= 0) return;

  if (db.settings.timeStrategy === 'daily') {
    const today = getIndiaDateKey(now);
    if (user.dailyUsageDate !== today) {
      user.dailyUsageDate = today;
      user.dailyUsageSeconds = 0;
    }
    user.dailyUsageSeconds = Number(user.dailyUsageSeconds || 0) + elapsed;
  } else {
    user.activeUsageSeconds = Number(user.activeUsageSeconds || 0) + elapsed;
  }

  user.activeSessionStartedAt = now;
  user.sessionStartTimestamp = now;
  user.lastActiveTimestamp = now;
  void saveDbSync();
}

function reconcileLiveTimer(userId: 'person_1' | 'person_2') {
  const user = db.users[userId] as any;
  if (getChatPresenceState(userId).active) {
    if (Number(user.activeSessionCount || 0) <= 0 || !user.activeSessionStartedAt) {
      startActiveSession(userId);
    } else {
      user.activeSessionCount = 1;
    }
  } else if (Number(user.activeSessionCount || 0) > 0 || user.activeSessionStartedAt) {
    stopActiveSession(userId);
  }
}

// Middleware: Authenticate User
async function requireUserAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Missing token' });
    return;
  }
  const token = authHeader.split(' ')[1];
  let session: DbSchema['sessions'][string] | null = null;
  try {
    session = await getSessionFromSupabase(token);
  } catch (err) {
    console.error('Failed to validate user session:', err);
    res.status(503).json({ error: 'Authentication service temporarily unavailable' });
    return;
  }
  if (!session || (session.userId !== 'person_1' && session.userId !== 'person_2')) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const userId = session.userId as 'person_1' | 'person_2';
  const user = db.users[userId];
  if (user.isLocked) {
    res.status(403).json({ error: 'USER_LOCKED', message: user.lockReason || 'This identity has been locked by the Administrator.' });
    return;
  }
  const timeStatus = calculateTimeRemaining(userId);
  if (timeStatus.isExpired && db.settings.restrictionsOnExpire.lockSession) {
    res.status(403).json({ error: 'TIME_EXPIRED', message: db.settings.timeOverMessage, timeStatus });
    return;
  }
  // API requests by themselves do not make a user online.
  const now = Date.now();
  if (getChatPresenceState(userId).active) {
    user.lastActiveTimestamp = now;
    session.lastActive = now;
  }
  (req as any).user = user;
  (req as any).session = session;
  (req as any).userId = userId;
  (req as any).timeStatus = timeStatus;
  next();
}

// Middleware: Authenticate Admin
async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Admin unauthorized' });
    return;
  }
  const token = authHeader.split(' ')[1];
  let session: DbSchema['sessions'][string] | null = null;
  try {
    session = await getSessionFromSupabase(token);
  } catch (err) {
    console.error('Failed to validate admin session:', err);
    res.status(503).json({ error: 'Authentication service temporarily unavailable' });
    return;
  }
  if (!session || session.userId !== 'admin') {
    res.status(401).json({ error: 'Invalid admin credentials' });
    return;
  }
  (req as any).session = session;
  next();
}

export async function createCloudflareHttpServer() {
  await initializeDatabase();
  const app = express();

  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use('/api', async (_req, _res, next) => {
    try { await refreshDbFromSupabase(); } catch (err) { console.error('State refresh failed:', err); }
    next();
  });

  // Shared HTTP signaling fallback for WebRTC. This is the authoritative call
  // signaling path in production; it avoids process-local WebSocket fan-out.
  app.post('/api/call/signal', requireUserAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    if (userId !== 'person_1' && userId !== 'person_2') {
      res.status(403).json({ error: 'Only user identities can place calls.' });
      return;
    }

    const data = req.body || {};
    const validationError = validateCallSignal(userId, data);
    if (validationError) {
      res.status(403).json({ type: 'call:error', error: validationError });
      return;
    }

    const targetUserId = getOppositeUserId(userId);
    const callType: 'voice' | 'video' = data.callType === 'video' ? 'video' : 'voice';

    // Keep the stored payload limited to signaling fields.
    const signalCreatedAt = new Date().toISOString();
    const payload = {
      type: data.type,
      callType,
      sdp: data.sdp,
      candidate: data.candidate,
      callerId: userId,
      fromUserId: userId,
      targetId: targetUserId,
      callId: data.callId,
      createdAt: signalCreatedAt,
      expiresAt: data.type === 'call:offer' ? Date.now() + 60_000 : undefined,
    };

    if (data.type === 'call:offer') {
      const caller = db.users[userId] as any;
      const target = db.users[targetUserId] as any;
      const callHistoryMessage = {
        id: `msg_call_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        senderId: 'system',
        type: 'system',
        text: `📞 ${caller.name} started a ${callType} call with ${target.name}.`,
        timestamp: Date.now(),
        status: 'read',
        reactions: {}
      };
      db.messages.push(callHistoryMessage);
      saveDbSync();
      broadcast({ type: 'chat:new_message', message: callHistoryMessage });
      addLog(userId, `Initiated ${callType} call`, `To ${targetUserId}`);
    }

    try {
      const id = await storeCallSignal({
        from_user_id: userId,
        target_user_id: targetUserId,
        type: data.type,
        call_type: callType,
        payload,
      });

      // HTTP polling is the single authoritative delivery path for WebRTC
      // signaling. Do not also broadcast through WebSocket: doing both can
      // deliver duplicate answers/candidates and race the peer state machine.
      res.json({ success: true, id, createdAt: signalCreatedAt });
    } catch (err) {
      console.error('Failed to store call signal:', err);
      res.status(503).json({ type: 'call:error', error: 'Call signaling service is temporarily unavailable.' });
    }
  });

  app.get('/api/call/signals', requireUserAuth, async (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    if (userId !== 'person_1' && userId !== 'person_2') {
      res.status(403).json({ signals: [], error: 'Not a user session.' });
      return;
    }

      const afterId = Math.max(0, Number(req.query.after || 0));
    const sinceMs = Number(req.query.since || Date.now() - 5000);
    const requestedCallId = typeof req.query.callId === 'string' ? req.query.callId : undefined;
    const sinceIso = new Date(Number.isFinite(sinceMs) ? sinceMs : Date.now() - 5000).toISOString();

    try {
      const signals = await readCallSignals(userId, afterId, sinceIso, requestedCallId);
      res.json({ signals });
    } catch (err) {
      console.error('Failed to read call signals:', err);
      res.status(503).json({ signals: [], error: 'Call signaling service is temporarily unavailable.' });
    }
  });
  // ==========================================
  // PUBLIC API ROUTES
  // ==========================================

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, persistence: 'supabase', initialized: Boolean(db), timestamp: Date.now() });
  });

  // Public identities for cinematic opening and user selection
  app.get('/api/public/identities', (_req: Request, res: Response) => {
    res.json({
      worldTitle: db.settings.worldTitle,
      worldSubtitle: db.settings.worldSubtitle,
      theme: db.settings.theme,
      accentColor: db.settings.accentColor,
      introDurationSeconds: db.settings.introDurationSeconds,
      settings: db.settings,
      person_1: {
        id: 'person_1',
        name: db.users.person_1.name,
        username: db.users.person_1.username,
        logo: db.users.person_1.logo,
        isLocked: db.users.person_1.isLocked,
      },
      person_2: {
        id: 'person_2',
        name: db.users.person_2.name,
        username: db.users.person_2.username,
        logo: db.users.person_2.logo,
        isLocked: db.users.person_2.isLocked,
      }
    });
  });

  // User Login (Person 1 or Person 2)
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { userId, password } = req.body;
    if (userId !== 'person_1' && userId !== 'person_2') {
      res.status(400).json({ error: 'Invalid user selection. Only Person 1 and Person 2 exist.' });
      return;
    }

    const user = db.users[userId];
    if (user.isLocked) {
      addLog(userId, 'Login Blocked', 'Attempted login while locked', 'alert');
      res.status(403).json({
        error: 'LOCKED',
        message: user.lockReason || 'This identity has been locked by the Administrator.'
      });
      return;
    }

    const isValid = bcrypt.compareSync(password || '', user.passwordHash);
    if (!isValid) {
      addLog(userId, 'Failed Login Attempt', 'Incorrect password entered', 'warn');
      res.status(401).json({ error: 'Incorrect password for this identity.' });
      return;
    }

    // Login itself never consumes active-use time.
    // Reconcile first so stale active fields cannot make an offline user lose time.
    reconcileLiveTimer(userId);
    const currentTimeStatus = calculateTimeRemaining(userId);
    if (currentTimeStatus.isExpired) {
      res.status(403).json({ error: 'TIME_EXPIRED', message: currentTimeStatus.customMessage, timeStatus: currentTimeStatus });
      return;
    }

    // IMPORTANT: logging in alone does NOT consume time.
    // The active-use timer starts only after this token successfully authenticates
    // a live WebSocket connection in the WebSocket handler below.
    const token = `synax_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const timeStatus = calculateTimeRemaining(userId);

    const newSession = {
      token,
      userId,
      sessionStart: Date.now(),
      lastActive: Date.now(),
      allowedSeconds: user.allowedMinutes * 60,
      isExpired: timeStatus.isExpired,
      active: false
    };
    db.sessions[token] = newSession;

    await saveSessionToSupabase(newSession);
    saveDbSync();
    addLog(userId, 'User Logged In', `Session started: ${user.name} entered the sanctuary`);
    // Vercel can route the next request to another container. Do not return the
    // login response until the shared session has been written to Supabase.
    await flushPersistence();

    const otherId = userId === 'person_1' ? 'person_2' : 'person_1';
    const otherUser = {
      id: otherId,
      slot: db.users[otherId].slot,
      name: db.users[otherId].name,
      username: db.users[otherId].username,
      logo: db.users[otherId].logo,
      pfpUrl: db.users[otherId].pfpUrl,
      nickname: db.users[otherId].nickname,
      bio: db.users[otherId].bio,
    };

    res.json({
      token,
      user: {
        id: user.id,
        slot: user.slot,
        name: user.name,
        username: user.username,
        logo: user.logo,
        pfpUrl: user.pfpUrl,
        nickname: user.nickname,
        bio: user.bio,
        allowedMinutes: user.allowedMinutes,
      },
      otherUser,
      timeStatus,
      settings: db.settings
    });
  });

  // Logout: close one active session and invalidate its token.
  app.post('/api/auth/logout', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.json({ success: true });
      return;
    }
    const token = authHeader.split(' ')[1];
    let session: DbSchema['sessions'][string] | null = null;
    try {
      session = await getSessionFromSupabase(token);
    } catch (err) {
      console.error('Failed to load session for logout:', err);
      res.status(503).json({ error: 'Authentication service temporarily unavailable' });
      return;
    }
    if (!session) {
      res.json({ success: true });
      return;
    }
    session.endedAt = Date.now();
    session.active = false;
    if (session.userId === 'person_1' || session.userId === 'person_2') {
      const now = Date.now();
      chatPresence.set(session.userId, { active: false, lastHeartbeat: now, lastSeen: now });
      stopActiveSession(session.userId);
    }
    try { await deleteSessionFromSupabase(token); } catch (err) { console.error('Failed to delete shared session:', err); }
    delete db.sessions[token];
    saveDbSync();
    await flushPersistence();
    broadcast({ type: 'presence:update', presence: getPresence() });
    res.json({ success: true });
  });

  // Admin Login
  app.post('/api/auth/admin-login', async (req: Request, res: Response) => {
    const { password } = req.body;
    const isValid = bcrypt.compareSync(password || '', db.admin.passwordHash);
    if (!isValid) {
      addLog('Admin Portal', 'Admin Login Failed', 'Incorrect admin password attempt', 'alert');
      res.status(401).json({ error: 'Incorrect Administrator password.' });
      return;
    }

    const token = `synax_admin_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
    const adminSession = {
      token,
      userId: 'admin' as const,
      sessionStart: Date.now(),
      lastActive: Date.now(),
      allowedSeconds: 86400 * 365,
      isExpired: false
    };
    db.sessions[token] = adminSession;

    await saveSessionToSupabase(adminSession);
    saveDbSync();
    addLog('Admin Portal', 'Admin Login Success', 'Admin authenticated into System Controls');
    // Ensure the token exists in shared storage before the frontend starts
    // requesting /api/admin/* from potentially different Vercel containers.
    await flushPersistence();

    res.json({
      token,
      role: 'admin',
      settings: db.settings
    });
  });

  // Current session status verification
  app.get('/api/auth/me', async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token' });
      return;
    }
    const token = authHeader.split(' ')[1];
    let session: DbSchema['sessions'][string] | null = null;
    try {
      session = await getSessionFromSupabase(token);
    } catch (err) {
      console.error('Failed to validate session:', err);
      res.status(503).json({ error: 'Authentication service temporarily unavailable' });
      return;
    }
    if (!session) {
      res.status(401).json({ error: 'Session expired' });
      return;
    }

    if (session.userId === 'admin') {
      res.json({ role: 'admin', settings: db.settings });
      return;
    }

    const userId = session.userId as 'person_1' | 'person_2';
    const user = db.users[userId];
    const otherId = userId === 'person_1' ? 'person_2' : 'person_1';
    const otherUser = db.users[otherId];
    const timeStatus = calculateTimeRemaining(userId);

    res.json({
      token,
      user: {
        id: user.id,
        slot: user.slot,
        name: user.name,
        username: user.username,
        logo: user.logo,
        pfpUrl: user.pfpUrl,
        nickname: user.nickname,
        bio: user.bio,
        isLocked: user.isLocked,
        lockReason: user.lockReason,
        allowedMinutes: user.allowedMinutes,
      },
      otherUser: {
        id: otherId,
        slot: otherUser.slot,
        name: otherUser.name,
        username: otherUser.username,
        logo: otherUser.logo,
        pfpUrl: otherUser.pfpUrl,
        nickname: otherUser.nickname,
        bio: otherUser.bio,
      },
      timeStatus,
      settings: db.settings
    });
  });

  // Update own PFP & profile info (User can ONLY edit their own PFP/bio, not the other person's, and not the logo!)
  app.post('/api/profile/update', requireUserAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    const { pfpUrl, nickname, bio } = req.body;
    const user = db.users[userId];

    if (pfpUrl !== undefined) user.pfpUrl = pfpUrl;
    if (nickname !== undefined) user.nickname = nickname;
    if (bio !== undefined) user.bio = bio;

    saveDbSync();
    addLog(userId, 'Profile Updated', `Updated personal PFP / profile information`);

    // Broadcast profile change so other user's screen updates instantly
    broadcast({
      type: 'profile:updated',
      userId,
      profile: {
        id: user.id,
        name: user.name,
        pfpUrl: user.pfpUrl,
        nickname: user.nickname,
        bio: user.bio
      }
    });

    res.json({ success: true, user });
  });

  // ==========================================
  // CHAT & MESSAGING API
  // ==========================================

  // Get messages
  app.get('/api/messages', requireUserAuth, (_req: Request, res: Response) => {
    res.json({ messages: db.messages });
  });

  // Send new message
  app.post('/api/messages', requireUserAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    const otherId = userId === 'person_1' ? 'person_2' : 'person_1';
    const { text, type, fileUrl, fileName, fileSize, audioDuration, replyTo } = req.body;

    const timeStatus = calculateTimeRemaining(userId);
    if (timeStatus.isExpired && db.settings.restrictionsOnExpire.disableMessaging) {
      res.status(403).json({
        error: 'TIME_EXPIRED',
        message: db.settings.timeOverMessage || 'Sanctuary communication time has expired.',
        timeStatus
      });
      return;
    }

    // Feature permission checks
    if (!db.settings.featuresEnabled.messages) {
      res.status(403).json({ error: 'Messaging is temporarily disabled by Admin.' });
      return;
    }
    if (type === 'voice') {
      if (!db.settings.featuresEnabled.voiceMessages) {
        res.status(403).json({ error: 'Voice messages are disabled by Admin.' });
        return;
      }
      if (timeStatus.isExpired && db.settings.restrictionsOnExpire.disableVoiceMessages) {
        res.status(403).json({ error: 'Voice messages are restricted due to expired sanctuary time.' });
        return;
      }
    }
    if (type === 'image') {
      if (!db.settings.featuresEnabled.imageSharing) {
        res.status(403).json({ error: 'Image sharing is disabled by Admin.' });
        return;
      }
      if (timeStatus.isExpired && db.settings.restrictionsOnExpire.disableImages) {
        res.status(403).json({ error: 'Image sharing is restricted due to expired sanctuary time.' });
        return;
      }
    }

    if (type === 'video') {
      // Videos use the same media-sharing permission and expiration rule as photos.
      if (!db.settings.featuresEnabled.imageSharing) {
        res.status(403).json({ error: 'Photo/video sharing is disabled by Admin.' });
        return;
      }
      if (timeStatus.isExpired && db.settings.restrictionsOnExpire.disableImages) {
        res.status(403).json({ error: 'Video sharing is restricted due to expired sanctuary time.' });
        return;
      }
    }

    if (type === 'file') {
      if (!db.settings.featuresEnabled.fileSharing) {
        res.status(403).json({ error: 'File sharing is disabled by Admin.' });
        return;
      }
      if (timeStatus.isExpired && db.settings.restrictionsOnExpire.disableFiles) {
        res.status(403).json({ error: 'File sharing is restricted due to expired sanctuary time.' });
        return;
      }
    }

    // Check if recipient is online based on the live chat heartbeat.
    const isPartnerOnline = getChatPresenceState(otherId).active;

    const newMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      senderId: userId,
      type: type || 'text',
      text: text || '',
      fileUrl: fileUrl || undefined,
      fileName: fileName || undefined,
      fileSize: fileSize || undefined,
      audioDuration: audioDuration || undefined,
      timestamp: Date.now(),
      status: (isPartnerOnline ? 'delivered' : 'sent') as 'sent' | 'delivered' | 'read',
      reactions: {},
      replyTo: replyTo ? {
        id: replyTo.id,
        text: replyTo.text,
        senderName: replyTo.senderName
      } : undefined
    };

    db.messages.push(newMessage);
    saveDbSync();

    // Realtime broadcast to both users
    broadcast({
      type: 'chat:new_message',
      message: newMessage
    });

    res.json({ success: true, message: newMessage });
  });

  // Mark all unread messages from partner as read
  app.post('/api/messages/mark-read', requireUserAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    const otherId = userId === 'person_1' ? 'person_2' : 'person_1';

    let readCount = 0;
    db.messages.forEach((m) => {
      if (m.senderId === otherId && m.status !== 'read') {
        m.status = 'read';
        readCount++;
      }
    });

    if (readCount > 0) {
      saveDbSync();
      broadcast({
        type: 'chat:messages_read',
        readerId: userId,
        senderId: otherId
      });
    }

    res.json({ success: true, count: readCount });
  });

  // Toggle Reaction on message
  app.post('/api/messages/:id/reaction', requireUserAuth, (req: Request, res: Response) => {
    if (!db.settings.featuresEnabled.reactions) {
      res.status(403).json({ error: 'Reactions are disabled by Admin.' });
      return;
    }
    const userId = (req as any).userId as string;
    const { id } = req.params;
    const { emoji } = req.body;

    const msg = db.messages.find(m => m.id === id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (!msg.reactions) msg.reactions = {};
    if (msg.reactions[userId] === emoji) {
      delete msg.reactions[userId];
    } else {
      msg.reactions[userId] = emoji;
    }

    saveDbSync();
    broadcast({
      type: 'chat:reaction_update',
      messageId: id,
      reactions: msg.reactions
    });

    res.json({ success: true, reactions: msg.reactions });
  });

  // Edit message
  app.put('/api/messages/:id', requireUserAuth, (req: Request, res: Response) => {
    if (!db.settings.featuresEnabled.editing) {
      res.status(403).json({ error: 'Editing is disabled by Admin.' });
      return;
    }
    const userId = (req as any).userId as string;
    const { id } = req.params;
    const { text } = req.body;

    const msg = db.messages.find(m => m.id === id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    if (msg.senderId !== userId) {
      res.status(403).json({ error: 'You can only edit your own messages.' });
      return;
    }

    msg.text = text;
    msg.isEdited = true;
    saveDbSync();

    broadcast({
      type: 'chat:message_edited',
      messageId: id,
      text: msg.text,
      isEdited: true
    });

    res.json({ success: true, message: msg });
  });

  // Delete message
  app.delete('/api/messages/:id', requireUserAuth, (req: Request, res: Response) => {
    if (!db.settings.featuresEnabled.deleting) {
      res.status(403).json({ error: 'Deleting messages is disabled by Admin.' });
      return;
    }
    const userId = (req as any).userId as string;
    const { id } = req.params;

    const msg = db.messages.find(m => m.id === id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    if (msg.senderId !== userId) {
      res.status(403).json({ error: 'You can only delete your own messages.' });
      return;
    }

    msg.deleted = true;
    msg.text = 'This message was deleted';
    msg.fileUrl = undefined;
    saveDbSync();

    broadcast({
      type: 'chat:message_deleted',
      messageId: id
    });

    res.json({ success: true });
  });

  // Pin/unpin message
  app.post('/api/messages/:id/pin', requireUserAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    const msg = db.messages.find(m => m.id === id);
    if (!msg) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    msg.isPinned = !msg.isPinned;
    saveDbSync();

    broadcast({
      type: 'chat:message_pinned',
      messageId: id,
      isPinned: msg.isPinned
    });

    res.json({ success: true, isPinned: msg.isPinned });
  });

  // Presence for the visible SYNAX chat only.
  // The client sends a heartbeat while the chat tab is visible and active.
  app.post('/api/presence/chat', requireUserAuth, (req: Request, res: Response) => {
    const userId = (req as any).userId as 'person_1' | 'person_2';
    const active = req.body?.active !== false;
    const now = Date.now();

    const previous = getChatPresenceState(userId);
    chatPresence.set(userId, {
      active,
      lastHeartbeat: now,
      lastSeen: active ? (previous.lastSeen || now) : now,
    });

    const user = db.users[userId] as any;
    if (active) {
      user.lastActiveTimestamp = now;
      (req as any).session.lastActive = now;
      void saveSessionToSupabase((req as any).session);
      reconcileLiveTimer(userId);
    } else {
      stopActiveSession(userId);
      user.lastActiveTimestamp = now;
    }

    saveDbSync();

    const presence = getPresence();
    broadcast({ type: 'presence:update', presence });
    broadcast({
      type: 'time:tick',
      userId,
      timeStatus: calculateTimeRemaining(userId),
    });

    res.json({
      success: true,
      presence,
      timeStatus: calculateTimeRemaining(userId),
    });
  });

  // File / Voice / Image Upload
  app.post('/api/upload', requireUserAuth, upload.single('file'), async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    try {
      if (useSupabase && Buffer.isBuffer(req.file.buffer)) {
        const match = req.file.originalname.match(/(\.[^.]+)$/);
        const ext = match ? match[1] : '';
        const objectName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
        await supabaseFetch(`/storage/v1/object/synax-uploads/${encodeURIComponent(objectName)}`, {
          method: 'POST',
          headers: {
            'Content-Type': req.file.mimetype || 'application/octet-stream',
            'x-upsert': 'false',
          },
          body: req.file.buffer,
        });
        const fileUrl = `${SUPABASE_URL}/storage/v1/object/public/synax-uploads/${encodeURIComponent(objectName)}`;
        res.json({ fileUrl, fileName: req.file.originalname, fileSize: req.file.size, mimeType: req.file.mimetype });
        return;
      }

      res.status(503).json({ error: 'Cloudflare uploads require Supabase Storage.' });
    } catch (err) {
      console.error('Upload failed:', err);
      res.status(500).json({ error: 'File upload failed' });
    }
  });

  // ==========================================
  // ADMIN PANEL CONTROLS API
  // ==========================================

  // Admin Overview
  app.get('/api/admin/overview', requireAdminAuth, (_req: Request, res: Response) => {
    const p1Time = calculateTimeRemaining('person_1');
    const p2Time = calculateTimeRemaining('person_2');

    res.json({
      users: {
        person_1: {
          ...db.users.person_1,
          passwordHash: undefined,
          timeStatus: p1Time
        },
        person_2: {
          ...db.users.person_2,
          passwordHash: undefined,
          timeStatus: p2Time
        }
      },
      settings: db.settings,
      presence: getPresence(),
      totalMessages: db.messages.length,
      logs: db.logs.slice(0, 50)
    });
  });

  // Admin: Update Identities & Passwords
  app.put('/api/admin/users', requireAdminAuth, (req: Request, res: Response) => {
    const { person_1, person_2 } = req.body;

    if (person_1) {
      const u1 = db.users.person_1;
      if (person_1.name) u1.name = person_1.name;
      if (person_1.username) u1.username = person_1.username;
      if (person_1.password && person_1.password.trim().length > 0) {
        u1.passwordHash = bcrypt.hashSync(person_1.password, 10);
      }
      if (person_1.logo) u1.logo = person_1.logo;
      if (person_1.allowedMinutes !== undefined) u1.allowedMinutes = Number(person_1.allowedMinutes);
    }

    if (person_2) {
      const u2 = db.users.person_2;
      if (person_2.name) u2.name = person_2.name;
      if (person_2.username) u2.username = person_2.username;
      if (person_2.password && person_2.password.trim().length > 0) {
        u2.passwordHash = bcrypt.hashSync(person_2.password, 10);
      }
      if (person_2.logo) u2.logo = person_2.logo;
      if (person_2.allowedMinutes !== undefined) u2.allowedMinutes = Number(person_2.allowedMinutes);
    }

    saveDbSync();
    addLog('Admin', 'Updated Person Identities / Credentials', 'Names, logos or limits modified');

    broadcast({
      type: 'identities:updated',
      person_1: {
        name: db.users.person_1.name,
        logo: db.users.person_1.logo,
        allowedMinutes: db.users.person_1.allowedMinutes
      },
      person_2: {
        name: db.users.person_2.name,
        logo: db.users.person_2.logo,
        allowedMinutes: db.users.person_2.allowedMinutes
      }
    });

    res.json({ success: true, users: db.users });
  });

  // Admin: Lock / Unlock User
  app.post('/api/admin/user/:id/lock', requireAdminAuth, (req: Request, res: Response) => {
    const userId = req.params.id as 'person_1' | 'person_2';
    const { isLocked, lockReason } = req.body;

    if (userId !== 'person_1' && userId !== 'person_2') {
      res.status(400).json({ error: 'Invalid user' });
      return;
    }

    db.users[userId].isLocked = !!isLocked;
    db.users[userId].lockReason = lockReason || undefined;

    saveDbSync();
    addLog('Admin', isLocked ? `Locked ${db.users[userId].name}` : `Unlocked ${db.users[userId].name}`, lockReason, isLocked ? 'alert' : 'info');

    broadcast({
      type: 'user:lock_state',
      userId,
      isLocked: db.users[userId].isLocked,
      lockReason: db.users[userId].lockReason
    });

    res.json({ success: true, user: db.users[userId] });
  });

  // Admin: Reset Time / Grant Extra Time
  app.post('/api/admin/user/:id/reset-time', requireAdminAuth, async (req: Request, res: Response) => {
    const userId = req.params.id as 'person_1' | 'person_2';
    const { setMinutes, addMinutes, resetSession } = req.body;

    if (userId !== 'person_1' && userId !== 'person_2') {
      res.status(400).json({ error: 'Invalid user' });
      return;
    }

    const user = db.users[userId] as any;

    // SET EXACT LIMIT:
    // adminSetTimeLimit() sends { setMinutes: N }. The previous endpoint
    // ignored this field, so the input appeared to save but the server kept
    // the old limit. Treat setMinutes as an absolute configured limit.
    let didSetLimit = false;
    if (setMinutes !== undefined && setMinutes !== null && setMinutes !== '') {
      const parsed = Number(setMinutes);
      if (!Number.isFinite(parsed) || parsed < 1) {
        res.status(400).json({ error: 'Time limit must be at least 1 minute.' });
        return;
      }

      user.allowedMinutes = Math.max(1, Math.floor(parsed));
      didSetLimit = true;

      // Keep any in-memory session records consistent with the new configured limit.
      for (const session of Object.values(db.sessions) as any[]) {
        if (session.userId === userId) {
          session.allowedSeconds = user.allowedMinutes * 60;
          try { await saveSessionToSupabase(session); } catch (err) { console.error('Failed to update shared session limit:', err); }
        }
      }
    }

    // RESET CONSUMED USAGE (does not change configured limit).
    if (resetSession) {
      const now = Date.now();
      user.activeUsageSeconds = 0;
      user.dailyUsageSeconds = 0;
      user.dailyUsageDate = new Date(now).toISOString().slice(0, 10);
      user.sessionStartTimestamp =
        Number(user.activeSessionCount || 0) > 0 ? now : undefined;
      user.activeSessionStartedAt =
        Number(user.activeSessionCount || 0) > 0 ? now : undefined;
    }

    // ADD / REMOVE TIME FROM THE CONFIGURED LIMIT.
    if (addMinutes !== undefined && addMinutes !== null) {
      const delta = Number(addMinutes);
      if (!Number.isFinite(delta)) {
        res.status(400).json({ error: 'Invalid time adjustment.' });
        return;
      }

      user.allowedMinutes = Math.max(
        1,
        Math.floor(Number(user.allowedMinutes || 60) + delta)
      );

      for (const session of Object.values(db.sessions) as any[]) {
        if (session.userId === userId) {
          session.allowedSeconds = user.allowedMinutes * 60;
          try { await saveSessionToSupabase(session); } catch (err) { console.error('Failed to update shared session limit:', err); }
        }
      }
    }

    saveDbSync();

    const newStatus = calculateTimeRemaining(userId);

    const action = didSetLimit
      ? `Set exact limit to ${user.allowedMinutes}m`
      : `Adjusted time`;

    addLog(
      'Admin',
      `${action} for ${user.name}`,
      `Reset usage: ${!!resetSession}; Added: ${addMinutes || 0}m`
    );

    // Immediately push the updated authoritative timer to connected devices.
    broadcast({
      type: 'time:tick',
      userId,
      timeStatus: newStatus
    });

    // Also push the updated configured limit to identity/admin views.
    broadcast({
      type: 'identities:updated',
      person_1: {
        name: db.users.person_1.name,
        logo: db.users.person_1.logo,
        allowedMinutes: db.users.person_1.allowedMinutes
      },
      person_2: {
        name: db.users.person_2.name,
        logo: db.users.person_2.logo,
        allowedMinutes: db.users.person_2.allowedMinutes
      }
    });

    res.json({
      success: true,
      timeStatus: newStatus,
      user: {
        ...user,
        passwordHash: undefined
      }
    });
  });

  // Admin: Update App & Communication Settings
  app.put('/api/admin/settings', requireAdminAuth, (req: Request, res: Response) => {
    const newSettings = req.body;
    db.settings = {
      ...db.settings,
      ...newSettings,
      restrictionsOnExpire: {
        ...db.settings.restrictionsOnExpire,
        ...(newSettings.restrictionsOnExpire || {})
      },
      featuresEnabled: {
        ...db.settings.featuresEnabled,
        ...(newSettings.featuresEnabled || {})
      }
    };

    saveDbSync();
    addLog('Admin', 'Settings Updated', 'Appearance, time rules or communication features updated');

    broadcast({
      type: 'settings:updated',
      settings: db.settings
    });

    res.json({ success: true, settings: db.settings });
  });

  // Admin: Read messages and active sessions without user-only auth.
  app.get('/api/admin/messages', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ messages: db.messages });
  });

  app.get('/api/admin/sessions', requireAdminAuth, async (_req: Request, res: Response) => {
    try {
      const sessions = (await listSessionsFromSupabase()).map((s: any) => ({
        userId: s.userId,
        sessionStart: s.sessionStart,
        lastActive: s.lastActive,
        allowedSeconds: s.allowedSeconds,
        isExpired: s.isExpired,
        active: Boolean(s.active),
      }));
      res.json({ sessions });
    } catch (err) {
      console.error('Failed to list shared sessions:', err);
      res.status(503).json({ sessions: [], error: 'Session service temporarily unavailable' });
    }
  });

  // Admin: Factory reset. Restores default identities/settings/chat/time and keeps the admin logged in.
  app.post('/api/admin/reset-defaults', requireAdminAuth, async (_req: Request, res: Response) => {
    const currentAdminSessions = Object.values(db.sessions).filter((s: any) => s.userId === 'admin');
    const fresh = getInitialDb();
    db = fresh;
    for (const s of currentAdminSessions) {
      db.sessions[s.token] = s;
    }
    saveDbSync();
    for (const s of currentAdminSessions) {
      try { await saveSessionToSupabase(s as any); } catch (err) { console.error('Failed to preserve admin session:', err); }
    }
    broadcast({ type: 'settings:updated', settings: db.settings });
    broadcast({ type: 'identities:updated', person_1: db.users.person_1, person_2: db.users.person_2 });
    broadcast({ type: 'chat:history_cleared' });
    for (const id of ['person_1', 'person_2'] as const) {
      broadcast({ type: 'time:tick', userId: id, timeStatus: calculateTimeRemaining(id) });
    }
    res.json({ success: true, settings: db.settings });
  });

  // Admin: Clear Chat History
  app.post('/api/admin/messages/clear', requireAdminAuth, (_req: Request, res: Response) => {
    db.messages = [
      {
        id: `msg_clr_${Date.now()}`,
        senderId: 'system',
        type: 'system',
        text: '✦ Chat history was cleared by the Administrator. A fresh chapter begins.',
        timestamp: Date.now(),
        status: 'read',
        reactions: {}
      }
    ];
    saveDbSync();
    addLog('Admin', 'Chat History Cleared', 'All previous messages purged');

    broadcast({
      type: 'chat:history_cleared'
    });

    res.json({ success: true });
  });

  // Admin: View Audit Logs
  app.get('/api/admin/logs', requireAdminAuth, (_req: Request, res: Response) => {
    res.json({ logs: db.logs });
  });

  // Admin: Change Administrator Password
  app.post('/api/admin/change-password', requireAdminAuth, (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 4) {
      res.status(400).json({ error: 'New password must be at least 4 characters long.' });
      return;
    }

    if (!bcrypt.compareSync(currentPassword || '', db.admin.passwordHash)) {
      res.status(401).json({ error: 'Current administrator password is incorrect.' });
      return;
    }

    db.admin.passwordHash = bcrypt.hashSync(newPassword.trim(), 10);
    saveDbSync();
    addLog('Admin', 'Password Changed', 'Master administrator password successfully updated');
    res.json({ success: true });
  });

  // Cloudflare Worker serves the SPA static assets independently.
  // This Express server is used only for the API routes.
  return http.createServer(app);
}
