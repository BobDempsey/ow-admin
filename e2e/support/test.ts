import { ConsoleMessage, test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/** Options every browser test can set with `test.use`. */
interface ConsoleGuardOptions {
  /**
   * Console errors and warnings a test expects and cannot prevent, such as a browser message
   * outside the app. Each entry needs a comment saying why. Empty by default.
   */
  allowConsole: RegExp[];
}

/** A `test` that fails when the page logs a console error or warning, or throws an uncaught error. */
export const test = base.extend<ConsoleGuardOptions & { consoleGuard: void }>({
  allowConsole: [[], { option: true }],
  consoleGuard: [
    async ({ page, allowConsole }, use) => {
      const messages: string[] = [];
      const allowed = (text: string) => allowConsole.some((pattern) => pattern.test(text));
      page.on('console', (message: ConsoleMessage) => {
        const type = message.type();
        if ((type === 'error' || type === 'warning') && !allowed(message.text())) {
          const { url, lineNumber } = message.location();
          messages.push(`console ${type}: ${message.text()} (${url || 'unknown'}:${lineNumber})`);
        }
      });
      page.on('pageerror', (error) => {
        if (!allowed(error.message)) {
          messages.push(`pageerror: ${error.stack ?? error.message}`);
        }
      });

      await use();

      if (messages.length) {
        throw new Error(`The page logged ${messages.length} message(s):\n${messages.join('\n')}`);
      }
    },
    { auto: true },
  ],
});
