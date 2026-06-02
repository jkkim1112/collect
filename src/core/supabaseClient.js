import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = "https://cvuslommhbzjjoltlfkk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_-caYxifFCxM2b46wEZ-x9g_uJT3-TUP";
const BOSS_SUPABASE_URL = "https://jxmudwscinjmyuchecav.supabase.co";
const BOSS_SUPABASE_ANON_KEY = "sb_publishable_Pnm--yk56qY58UCPfrAGRQ_ambbNj3o";

export const APP_SETTINGS_TABLE = "app_settings";
export const ADMIN_PASSWORD_KEY = "admin_password";
export const DISTRIBUTION_BOSS_RULES_TABLE = "distribution_boss_rules";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const bossSupabase = BOSS_SUPABASE_URL && BOSS_SUPABASE_ANON_KEY
  ? createClient(BOSS_SUPABASE_URL, BOSS_SUPABASE_ANON_KEY)
  : null;
