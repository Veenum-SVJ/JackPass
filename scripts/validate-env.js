require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY',
  'PAYSTACK_PUBLIC_KEY',
  'PAYSTACK_SECRET_KEY',
  'GOOGLE_AI_API_KEY'
];

console.log('Loaded environment variables:');
requiredEnvVars.forEach(varName => {
  console.log(`  ${varName}: ${process.env[varName] || '(not set)'}`);
});

// Check if variables exist and are not the exact placeholder values from template
const missingVars = requiredEnvVars.filter(varName => {
  const value = process.env[varName];
  // Check for exact placeholder values from .env.local.template
  const isPlaceholder = value === 'your-supabase-url-here' ||
                       value === 'your-supabase-anon-key-here' ||
                       value === 'your-supabase-service-role-key-here' ||
                       value === 'your-paystack-public-key-here' ||
                       value === 'your-paystack-secret-key-here' ||
                       value === 'your-google-ai-api-key-here' ||
                       !value; // Also check for empty/undefined
  return isPlaceholder;
});

if (missingVars.length > 0) {
  console.error('\n❌ Missing or invalid environment variables:');
  missingVars.forEach(varName => {
    const value = process.env[varName];
    console.error(`  - ${varName}: ${value || '(not set)'}`);
  });
  console.error('\nPlease edit .env.local and replace placeholder values with actual credentials.');
  process.exit(1);
}

console.log('\n✅ All required environment variables are set!');