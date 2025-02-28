// Simple script to test Supabase connection
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing Supabase connection with:');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('\n🔍 Testing Supabase connection...');
  
  try {
    // 1. Test basic connectivity by checking service health
    console.log('\n1. Testing basic connectivity:');
    
    try {
      // Test connection by checking health endpoint
      const { error: healthError } = await supabase.rpc('get_service_health');
      
      if (healthError && healthError.message.includes('function') && healthError.message.includes('does not exist')) {
        console.log('Health check RPC not available, but connection is working!');
        console.log('✅ Supabase connection is working (verified by successful API call)');
      } else if (healthError) {
        console.error('❌ Health check error:', healthError.message);
      } else {
        console.log('✅ Health check successful!');
      }
      
      // Try to list available tables
      console.log('\nAttempting to list available tables:');
      
      // Try different tables that might exist
      const tables = ['audio_files', 'profiles', 'users', 'broadcaster_profiles'];
      let foundTables = [];
      
      for (const table of tables) {
        const { error: tableError } = await supabase
          .from(table)
          .select('count(*)', { count: 'exact', head: true });
          
        if (!tableError) {
          foundTables.push(table);
        }
      }
      
      if (foundTables.length > 0) {
        console.log('✅ Found tables:', foundTables.join(', '));
      } else {
        console.log('ℹ️ No tables found from the test list. Migrations may need to be applied.');
      }
    } catch (err) {
      console.error('❌ Unexpected error during connectivity test:', err.message);
    }
    
    if (error) {
      console.error('❌ Connection error:', error.message);
      console.error('Error code:', error.code);
      console.error('Error details:', error.details);
    } else {
      console.log('✅ Successfully connected to Supabase!');
      console.log('Query result:', data);
    }
    
    // 2. Test authentication (doesn't require being logged in)
    console.log('\n2. Testing authentication service:');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('❌ Auth service error:', authError.message);
    } else {
      console.log('✅ Auth service is working');
      console.log('Session exists:', authData.session !== null);
    }
    
    // 3. Test RPC if available
    console.log('\n3. Testing RPC functionality:');
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_current_timestamp');
      
      if (rpcError) {
        if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
          console.log('ℹ️ The get_current_timestamp function doesn\'t exist (this is not necessarily an error)');
        } else {
          console.error('❌ RPC error:', rpcError.message);
        }
      } else {
        console.log('✅ RPC is working');
        console.log('Result:', rpcData);
      }
    } catch (err) {
      console.log('ℹ️ RPC test skipped due to error:', err.message);
    }
    
    // 4. List available tables
    console.log('\n4. Attempting to list available tables:');
    try {
      const { data: tablesData, error: tablesError } = await supabase
        .from('pg_tables')
        .select('tablename')
        .eq('schemaname', 'public');
      
      if (tablesError) {
        if (tablesError.code === '42P01') {
          console.log('ℹ️ Cannot query pg_tables directly (this is normal for restricted permissions)');
        } else {
          console.error('❌ Error listing tables:', tablesError.message);
        }
      } else {
        console.log('✅ Available tables:');
        tablesData.forEach(table => console.log(`- ${table.tablename}`));
      }
    } catch (err) {
      console.log('ℹ️ Table listing skipped due to error:', err.message);
    }
    
    console.log('\n🏁 Connection test completed');
    
  } catch (error) {
    console.error('❌ Unexpected error during testing:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Run the test
testConnection().catch(console.error);