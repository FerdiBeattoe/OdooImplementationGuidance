import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function run() {
  const sql = readFileSync(join(__dirname, '003_team_members.sql'), 'utf8');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('No Supabase credentials — skipping migration run');
    console.log('\nRun this SQL manually in the Supabase SQL editor:\n');
    console.log(sql);
    return;
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.rpc('exec_sql', { sql });
  if (error) {
    console.log('Migration note:', error.message);
    console.log('\nRun this SQL manually in the Supabase SQL editor:\n');
    console.log(sql);
  } else {
    console.log('Migration 003 complete');
  }
}

run();
