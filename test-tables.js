// Script to test Supabase tables
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase tables with:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('\n🔍 Testing Supabase tables...');
  
  try {
    // 1. Test authentication service
    console.log('\n1. Testing authentication service:');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service is working');
      console.log('Session exists:', authData.session !== null);
    }
    
    // 2. Check audio_files table
    console.log('\n2. Checking audio_files table:');
    const { data: audioFilesData, error: audioFilesError } = await supabase
      .from('audio_files')
      .select('count(*)', { head: true });
      
    if (audioFilesError) {
      console.error('❌ Error accessing audio_files table:', audioFilesError.message);
      console.error('Error code:', audioFilesError.code);
    } else {
      console.log('✅ Successfully connected to audio_files table!');
    }
    
    // 3. Check audio_comments table
    console.log('\n3. Checking audio_comments table:');
    const { data: audioCommentsData, error: audioCommentsError } = await supabase
      .from('audio_comments')
      .select('count(*)', { head: true });
      
    if (audioCommentsError) {
      console.error('❌ Error accessing audio_comments table:', audioCommentsError.message);
      console.error('Error code:', audioCommentsError.code);
    } else {
      console.log('✅ Successfully connected to audio_comments table!');
    }
    
    // 4. Check broadcaster_profiles table
    console.log('\n4. Checking broadcaster_profiles table:');
    const { data: profilesData, error: profilesError } = await supabase
      .from('broadcaster_profiles')
      .select('count(*)', { head: true });
      
    if (profilesError) {
      console.error('❌ Error accessing broadcaster_profiles table:', profilesError.message);
      console.error('Error code:', profilesError.code);
    } else {
      console.log('✅ Successfully connected to broadcaster_profiles table!');
    }
    
    // 5. List all tables in the public schema
    console.log('\n5. Listing all tables in the public schema:');
    const { data: tablesData, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public');
      
    if (tablesError) {
      console.error('❌ Error listing tables:', tablesError.message);
    } else if (tablesData && tablesData.length > 0) {
      console.log('✅ Tables found in the public schema:');
      tablesData.forEach(table => console.log(`- ${table.table_name}`));
    } else {
      console.log('ℹ️ No tables found in the public schema');
    }
    
    console.log('\n🏁 Table testing completed');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Run the test
testTables().catch(console.error);