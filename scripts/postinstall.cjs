const { spawnSync } = require('child_process');

function run(command, args) {
  return spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
}

console.log('Attempting prisma generate...');
const result = run('npx', ['prisma', 'generate']);
if (result.status === 0) {
  console.log('prisma generate succeeded');
  process.exit(0);
}

console.warn('prisma generate failed; creating fallback Prisma client for offline/dev validation');
const fallback = run('node', ['scripts/prisma-fallback.cjs']);
process.exit(fallback.status ?? 0);
