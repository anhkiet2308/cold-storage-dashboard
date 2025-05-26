import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://laaohqqmnwdzifcwlpbq.supabase.co' // Paste URL đã copy
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxhYW9ocXFtbndkemlmY3dscGJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgyNDg1MDMsImV4cCI6MjA2MzgyNDUwM30.e2wJlkZzN7YsqX8KXUAW6EuMVaSasY_BEfeA41Gqbo4' // Paste Anon key đã copy

export const supabase = createClient(supabaseUrl, supabaseKey)