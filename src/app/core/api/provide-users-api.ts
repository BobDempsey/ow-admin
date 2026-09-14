import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders } from '@angular/core';
import { inMemoryApiInterceptor } from './in-memory/in-memory-api.interceptor';

/** Provides `HttpClient` with the in-memory user API server in front of the network. */
export function provideUsersApi(): EnvironmentProviders {
  return provideHttpClient(withFetch(), withInterceptors([inMemoryApiInterceptor]));
}
