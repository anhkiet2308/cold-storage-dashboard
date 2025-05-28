// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Debug environment variables
console.log('🔗 Supabase URL:', supabaseUrl);
console.log('🔑 Supabase Key:', supabaseKey ? 'Set' : 'Missing');

// Kiểm tra environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}

// TẠO SUPABASE CLIENT
export const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    },
    heartbeatIntervalMs: 30000,
    reconnectAfterMs: (tries) => Math.min(tries * 1000, 10000)
  },
  auth: {
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🧪 Testing Supabase connection...');
    const { data, error } = await supabase.from('sensors').select('count').limit(1);
    if (error) {
      console.error('❌ Supabase connection failed:', error.message);
      return false;
    }
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection error:', error.message);
    return false;
  }
};

// Gọi test connection khi khởi tạo
testConnection();