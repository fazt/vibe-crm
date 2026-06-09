const { execSync } = require('child_process');

const env = {
  ...process.env,
  RAILWAY_CALLER: 'skill:use-railway@1.2.4',
  RAILWAY_AGENT_SESSION: 'railway-skill-logs-check',
};

const raw = execSync('railway variable list --service Postgres --json', {
  encoding: 'utf8',
  env,
  shell: true,
});

const vars = JSON.parse(raw);
const databaseUrl = vars.DATABASE_PUBLIC_URL;
if (!databaseUrl) {
  console.error('DATABASE_PUBLIC_URL not found');
  process.exit(1);
}

execSync('pnpm db:seed', {
  stdio: 'inherit',
  env: { ...env, DATABASE_URL: databaseUrl },
  shell: true,
});
