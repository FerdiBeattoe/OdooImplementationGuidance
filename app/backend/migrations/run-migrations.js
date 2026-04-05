import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function run() {
  const sql = readFileSync(
    join(__dirname, '001_initial_schema.sql'), 'utf8'
  )
  const { error } = await supabase.rpc('exec_sql', { sql })
  if (error) {
    // Tables may already exist — log and continue
    console.log('Migration note:', error.message)
  } else {
    console.log('Migration complete')
  }
}

run()
