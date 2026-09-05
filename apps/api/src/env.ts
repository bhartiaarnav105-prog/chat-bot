import * as dotenv from 'dotenv';
import * as path from 'path';

// This file ensures the environment is loaded before any other modules that depend on it
// __dirname is .../apps/api/src
const envPath = path.join(__dirname, '../../../.env');
const result = dotenv.config({ path: envPath });
console.log('[ENV] API working directory:', process.cwd());
if (!result.error) {
  console.log('[ENV] Root environment loaded successfully');
}
console.log('[ENV] Supabase URL available:', Boolean(process.env.SUPABASE_URL));
console.log('[ENV] Supabase anon key available:', Boolean(process.env.SUPABASE_ANON_KEY));
