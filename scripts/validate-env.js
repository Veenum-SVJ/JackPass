require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  // Client-side (Vite exposes VITE_* to the browser)
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  // Server-side (Express API server)
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_SECRET_KEY',
  'GOOGLE_AI_API_KEY',
];

const clientVars = requiredEnvVars.filter((v) => v.startsWith('VITE_'));
const serverVars = requiredEnvVars.filter((v) => !v.startsWith('VITE_'));

console.log('Checking environment variables...');
requiredEnvVars.forEach((varName) => {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value ? '(set)' : '(not set)'}${clientVars.includes(varName) ? ' [client]' : ' [server]'}`);
});

const isPlaceholder = (value) =>
  !value ||
  value.includes('your-') ||
  value === 'your-project.supabase.co' ||
  value === 'your-anon-key';

const missingVars = requiredEnvVars.filter((varName) => {
  const value = process.env[varName];
  if (clientVars.includes(varName)) {
    // Client vars may also be provided via NEXT_PUBLIC_* aliases
    const alias = process.env['NEXT_PUBLIC_' + varName.replace('VITE_', '')];
    return isPlaceholder(value) && isPlaceholder(alias);
  }
  return isPlaceholder(value);
});

if (missingVars.length > 0) {
  console.error('\n❌ Missing or invalid environment variables:');
  missingVars.forEach((varName) => {
    console.error(`  - ${varName} (${clientVars.includes(varName) ? 'client' : 'server'})`);
  });
  console.error('\nPlease copy .env.example to .env.local and fill in real credentials.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');
console.log(`   Client vars: ${clientVars.length}, Server vars: ${serverVars.length}`);
