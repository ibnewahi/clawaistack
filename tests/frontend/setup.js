import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import tls from 'node:tls';
import { syncBuiltinESMExports } from 'node:module';

// Fail before any real client can be initialized if a component mock is missing.
vi.mock('@supabase/supabase-js', () => {
  throw new Error('Real Supabase SDK imports are forbidden in frontend unit tests');
});

beforeEach(() => {
  const blocked = () => { throw new Error('Real network access is forbidden in frontend unit tests'); };
  vi.stubGlobal('fetch', vi.fn(blocked));
  vi.stubGlobal('XMLHttpRequest', class { constructor() { blocked(); } });
  vi.stubGlobal('WebSocket', class { constructor() { blocked(); } });
  vi.stubGlobal('EventSource', class { constructor() { blocked(); } });
  for (const client of [http, https]) {
    vi.spyOn(client, 'request').mockImplementation(blocked);
    vi.spyOn(client, 'get').mockImplementation(blocked);
  }
  vi.spyOn(net, 'connect').mockImplementation(blocked);
  vi.spyOn(net, 'createConnection').mockImplementation(blocked);
  vi.spyOn(net.Socket.prototype, 'connect').mockImplementation(blocked);
  vi.spyOn(tls, 'connect').mockImplementation(blocked);
  syncBuiltinESMExports();
  if (typeof navigator.sendBeacon === 'function') vi.spyOn(navigator, 'sendBeacon').mockImplementation(blocked);
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  syncBuiltinESMExports();
});
