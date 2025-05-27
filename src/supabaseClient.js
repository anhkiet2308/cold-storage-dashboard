// supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Kiểm tra environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('REACT_APP_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('REACT_APP_SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'Missing');
}
const { data, error } = await supabase.from('sensors').select('count').limit(1);
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
    const { data, error } = await supabase.from('sensors').select('count').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error);
      return false;
    }
    console.log('Supabase connection test successful');
    return true;
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return false;
  }
};

// Gọi test connection khi khởi tạo
testConnection();