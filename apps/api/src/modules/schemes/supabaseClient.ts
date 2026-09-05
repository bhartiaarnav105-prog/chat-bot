import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('supabaseUrl is required.');
}

// We use the anon key since we don't have a service_role key provided,
// and the table will have RLS configured to allow public reads for scheme_qa.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Extract project ref safely from URL
let projectRef = 'unknown';
try {
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (match && match[1]) projectRef = match[1];
  }
} catch (e) {}

// Debug-safe Supabase verification
(async () => {
  console.log(`\n[SUPABASE CHECK]`);
  console.log(`URL available: ${Boolean(supabaseUrl)}`);
  console.log(`ANON KEY available: ${Boolean(supabaseAnonKey)}`);
  
  console.log(`\n[SUPABASE PROJECT]`);
  console.log(`Connected project: ${projectRef}`);
  
  console.log(`\n[SUPABASE TABLE TEST]`);
  const { data, error, count } = await supabase.from('scheme_qa').select('*', { count: 'exact' }).limit(10);
  
  if (error) {
    console.log(`table: public.scheme_qa`);
    console.log(`error: ${error.message || 'Connection failed'}`);
    console.log(`count: 0`);
    console.log(`rows returned: 0`);
  } else {
    console.log(`table: public.scheme_qa`);
    console.log(`error: null`);
    console.log(`count: ${count}`);
    console.log(`rows returned: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log(`\n[SUPABASE COLUMNS]`);
      console.log(Object.keys(data[0]).join(', '));
    }
  }
})();
