/*
 * Short share links — Supabase configuration template.
 *
 * The real file, `supabase-config.js`, is what index.html loads. On this private
 * repo it is committed (it holds only the public anon/publishable key, which is
 * RLS-protected) so a fresh clone works with no setup.
 *
 * To point at a different / new Supabase project:
 *   - edit supabase-config.js directly, or
 *   - put values in a git-ignored .env and run
 *       node scripts/generate-supabase-config.js
 *   Values come from Supabase Dashboard > Project Settings > API
 *     Project URL          -> SUPABASE_URL
 *     anon / publishable    -> SUPABASE_ANON_KEY
 *
 * If supabase-config.js is missing or empty, the dashboard still works and the
 * Share button falls back to the long "#mode=view&config=..." URLs.
 */
window.SUPABASE_URL = "";
window.SUPABASE_ANON_KEY = "";
