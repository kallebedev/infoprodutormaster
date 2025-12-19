
import { createClient } from '@supabase/supabase-js';

// Configuration priorities:
// 1. Vite Environment Variables (import.meta.env) - Recommended for Netlify
// 2. Process Environment Variables - Fallback for other build tools
// 3. Hardcoded Fallback - For immediate demo purposes without config
const SUPABASE_URL = 
    (import.meta as any).env?.VITE_SUPABASE_URL || 
    process.env.SUPABASE_URL || 
    'https://laqouhpormghvuultwbm.supabase.co';

const SUPABASE_ANON_KEY = 
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
    process.env.SUPABASE_ANON_KEY || 
    'sb_publishable_Zo60FEKxo7m_wXfbHOn5gw_aHsfA4Yq';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
