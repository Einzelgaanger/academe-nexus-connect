
import { createClient } from '@supabase/supabase-js';

// For demo purposes, using environment variables would be better in production
// Note: The Supabase integration will replace these values with the actual values when connected
const supabaseUrl = 'https://your-project-url.supabase.co';
const supabaseKey = 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
