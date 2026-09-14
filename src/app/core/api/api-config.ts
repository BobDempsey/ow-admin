import { InjectionToken } from '@angular/core';

/** Root URL of the user API. The in-memory server answers every request under it. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => '/api',
});

/** Delay, in milliseconds, before the in-memory server answers a request. */
export const API_LATENCY_MS = new InjectionToken<number>('API_LATENCY_MS', {
  factory: () => 250,
});
