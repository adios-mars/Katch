import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://nlhkxvbuwkjgmxxdkhar.supabase.co'
const supabaseKey = 'sb_publishable_Y15eFuyjabRaNQuEvxToTw_87nPuqwz'

export const supabase = createClient(supabaseUrl, supabaseKey)
