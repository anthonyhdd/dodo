import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

// Validate Supabase URL format
if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
  console.error('❌ Invalid SUPABASE_URL format:', supabaseUrl);
  throw new Error('Invalid SUPABASE_URL format. Expected: https://xxx.supabase.co');
}

console.log('✅ Supabase client initialized with URL:', supabaseUrl.replace(/\/\/.*@/, '//***@')); // Hide credentials in logs

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceRoleKey);

