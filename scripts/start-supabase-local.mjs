import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const tempDir = join(root, '.tmp', 'supabase-local');
const network = 'loopdev_supabase';
const restName = 'supabase_rest_loopdev';
const kongName = 'supabase_kong_loopdev';
const dockerHost = '172.17.0.1';
const restPort = '54320';
const restAdminPort = '54319';

function run(command, args, options = {}) {
  return execFileSync(command, args, { cwd: root, encoding: 'utf8', stdio: 'inherit', ...options });
}

function inspect(name) {
  return JSON.parse(execFileSync('docker', ['inspect', name], { encoding: 'utf8' }))[0];
}

function envArgs(container, without = []) {
  return container.Config.Env.flatMap((entry) => {
    if (without.some((prefix) => entry.startsWith(prefix))) return [];
    return ['--env', entry];
  });
}

function waitForRest() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = execFileSync('curl', [
        '-sS',
        '-o', '/dev/null',
        '-w', '%{http_code}',
        '-H', 'apikey: sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
        'http://127.0.0.1:54321/rest/v1/crm_leads?select=id&limit=1',
      ], { encoding: 'utf8' }).trim();
      if (response === '200') return;
    } catch {
      // The containers can need a few seconds after Docker reports them running.
    }
  }
  throw new Error('Supabase REST no respondió con HTTP 200 en 30 segundos.');
}

mkdirSync(tempDir, { recursive: true });
run('npx', ['--yes', 'supabase@2.117.0', 'stop', '--no-backup'], { stdio: 'ignore' });
run('docker', ['rm', '-f', restName, kongName], { stdio: 'ignore' });

try {
  run('docker', ['network', 'inspect', network], { stdio: 'ignore' });
} catch {
  run('docker', [
    'network', 'create',
    '--driver', 'bridge',
    '--subnet', '10.250.0.0/24',
    '--gateway', '10.250.0.1',
    '--opt', 'com.docker.network.bridge.enable_icc=true',
    '--opt', 'com.docker.network.bridge.enable_ip_masquerade=true',
    network,
  ]);
}

try {
  run('timeout', ['-s', 'KILL', '90s', 'npx', '--yes', 'supabase@2.117.0', 'start', '--network-id', network, '--ignore-health-check']);
} catch (error) {
  if (error.status !== 124 && error.signal !== 'SIGKILL') throw error;
  console.warn('Supabase CLI sigue esperando healthchecks; continúo con el bootstrap de red local.');
}

const rest = inspect(restName);
const kong = inspect(kongName);
const kongConfig = join(tempDir, 'kong.yml');
run('docker', ['cp', `${kongName}:/home/kong/kong.yml`, kongConfig]);

const restArgs = [
  'run', '-d', '--name', restName,
  '--network', network,
  '--add-host', 'host.docker.internal:host-gateway',
  '-p', `${restPort}:3000`,
  '-p', `${restAdminPort}:3001`,
  ...envArgs(rest, ['PGRST_DB_URI=']),
  '--env', 'PGRST_DB_URI=postgresql://authenticator:postgres@host.docker.internal:54322/postgres',
  rest.Config.Image,
];
run('docker', ['rm', '-f', restName], { stdio: 'ignore' });
run('docker', restArgs);

let config = readFileSync(kongConfig, 'utf8');
config = config
  .replaceAll('http://supabase_rest_loopdev:3000', `http://${dockerHost}:${restPort}`)
  .replaceAll('http://supabase_rest_loopdev:3001', `http://${dockerHost}:${restAdminPort}`);
writeFileSync(kongConfig, config);

const kongArgs = [
  'run', '-d', '--name', kongName,
  '--network', network,
  '--add-host', 'host.docker.internal:host-gateway',
  '-p', '54321:8000',
  ...envArgs(kong, ['KONG_SSL_CERT=', 'KONG_SSL_CERT_KEY=', 'KONG_PORT_MAPS=']),
  '--volume', `${kongConfig}:/home/kong/kong.yml:ro`,
  kong.Config.Image,
];
run('docker', ['rm', '-f', kongName], { stdio: 'ignore' });
run('docker', kongArgs);

waitForRest();
console.log('Supabase local listo: http://127.0.0.1:54321/rest/v1');