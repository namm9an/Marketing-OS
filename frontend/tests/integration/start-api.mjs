import { spawn } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const python = process.env.MARKETING_OS_TEST_PYTHON
  || [join(root, '.venv/bin/python'), join(root, '.venv/Scripts/python.exe')].find(existsSync)
  || 'python';
const temporary = mkdtempSync(join(tmpdir(), 'marketing-os-browser-'));
const child = spawn(python, ['-m', 'app.main'], {
  cwd: root, stdio: 'inherit', env: {
    ...process.env,
    DB_PATH: join(temporary, 'browser.db'),
    PORT: '5120', ENVIRONMENT: 'test', SESSION_COOKIE_SECURE: 'false',
    GEMINI_API_KEY: '', ADMIN_USER: 'e2e-operator', ADMIN_PASSWORD: 'e2e-local-test-password',
    TRUST_FORWARDED_FOR: 'false',
  },
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
child.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
child.on('exit', (code) => { rmSync(temporary, { recursive: true, force: true }); process.exit(code || 0); });
