
import { createClient } from '@supabase/supabase-js';

// Connect to the Supabase project
const supabaseUrl = 'https://bgrpwompxvnuwizzuiyb.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJncnB3b21weHZudXdpenp1aXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4MjEwNjcsImV4cCI6MjA1OTM5NzA2N30.tEnJRPdQtcWACU_WL__omLkjK6AWI3ILfogExYoHG2M';

export const supabase = createClient(supabaseUrl, supabaseKey);
