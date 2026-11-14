// Every TypeScript example runs end to end against the source (express examples start a server and are skipped).
import { readdirSync } from 'node:fs';

const files = readdirSync(new URL('../examples', import.meta.url)).filter((f) => f.endsWith('.ts') && !f.includes('express'));

describe('examples', () => {
  it.each(files)('%s runs without errors', async (file) => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const error = vi.spyOn(console, 'error');
    await import(`../examples/${file}`);
    expect(error).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalled();
    log.mockRestore();
    error.mockRestore();
  });
});
