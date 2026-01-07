import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://plmqgwsmukrpbfwiqhun.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsbXFnd3NtdWtycGJmd2lxaHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc4MDgzNjEsImV4cCI6MjA4MzM4NDM2MX0.-9KTmLiOm7HJcHO5Rr3ipqQQJME4w05WuwYay5tUGvw'

if (!supabaseKey) {
  console.warn('VITE_SUPABASE_KEY is missing. Supabase features will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
