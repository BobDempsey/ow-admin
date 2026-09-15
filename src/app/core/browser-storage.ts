/** The window's localStorage, or undefined when reading it throws because site data is blocked. */
export function storageOf(view: Window | null): Storage | undefined {
  try {
    return view?.localStorage;
  } catch {
    return undefined;
  }
}
