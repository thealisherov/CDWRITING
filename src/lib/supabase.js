import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://plmqgwsmukrpbfwiqhun.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

if (!supabaseKey) {
  console.warn('VITE_SUPABASE_KEY is missing. Supabase features will not work.')
}

export const supabase = createClient(supabaseUrl, supabaseKey || 'PLACEHOLDER_KEY')
