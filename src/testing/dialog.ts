import { vi } from 'vitest';

/**
 * jsdom does not implement modal dialogs. These stubs toggle the `open` attribute the way the
 * browser does, so components can be tested for when they open and close a `<dialog>`.
 */
export function stubDialogMethods() {
  // Define the methods first where jsdom lacks them, since only existing methods can be spied on.
  HTMLDialogElement.prototype.showModal ??= () => undefined;
  HTMLDialogElement.prototype.close ??= () => undefined;
  const showModal = vi.spyOn(HTMLDialogElement.prototype, 'showModal').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.setAttribute('open', '');
  });
  const close = vi.spyOn(HTMLDialogElement.prototype, 'close').mockImplementation(function (
    this: HTMLDialogElement,
  ) {
    this.removeAttribute('open');
  });
  // The spies live on the shared prototype, so earlier tests' calls must not count.
  showModal.mockClear();
  close.mockClear();
  return { showModal, close };
}
