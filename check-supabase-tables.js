// Script to check if required tables exist in Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Initialize dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '.env') });

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Checking Supabase tables...');
  
  try {
    // Check if the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('❌ Authentication error:', authError?.message || 'Not authenticated');
      console.log('Please log in to check tables');
      process.exit(1);
    }
    
    console.log('✅ Authenticated as:', user.email);
    
    // List of tables to check
    const tablesToCheck = [
      'audio_files',
      'audio_comments',
      'broadcaster_profiles'
    ];
    
    // Check each table
    for (const tableName of tablesToCheck) {
      try {
        // Try to query the table
        const { data, error } = await supabase
          .from(tableName)
          .select('count(*)')
          .limit(1);
        
        if (error) {
          if (error.code === '42P01') {
            console.error(`❌ Table "${tableName}" does not exist`);
          } else {
            console.error(`❌ Error querying "${tableName}":`, error.message);
          }
        } else {
          console.log(`✅ Table "${tableName}" exists`);
          console.log(`   Row count: ${data[0]?.count || 0}`);
        }
      } catch (err) {
        console.error(`❌ Error checking "${tableName}":`, err.message);
      }
    }
    
    // Check database schema
    console.log('\n🔍 Checking database schema...');
    
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_schema_info');
    
    if (schemaError) {
      if (schemaError.message.includes('function') && schemaError.message.includes('does not exist')) {
        // Create the function if it doesn't exist
        console.log('Creating schema info function...');
        
        const { error: createFuncError } = await supabase.rpc('create_schema_info_function');
        
        if (createFuncError) {
          console.error('❌ Error creating schema info function:', createFuncError.message);
        } else {
          console.log('✅ Schema info function created');
          
          // Try again
          const { data: retryData, error: retryError } = await supabase
            .rpc('get_schema_info');
            
          if (retryError) {
            console.error('❌ Error getting schema info:', retryError.message);
          } else {
            displaySchemaInfo(retryData);
          }
        }
      } else {
        console.error('❌ Error getting schema info:', schemaError.message);
      }
    } else {
      displaySchemaInfo(schemaData);
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message);
  }
}

function displaySchemaInfo(data) {
  if (!data || data.length === 0) {
    console.log('No schema information available');
    return;
  }
  
  console.log('\n📋 Database Schema Information:');
  console.log('------------------------------');
  
  data.forEach(item => {
    console.log(`Table: ${item.table_name}`);
    console.log(`Columns: ${item.column_names.join(', ')}`);
    console.log('------------------------------');
  });
}

// Create the schema info function if needed
async function createSchemaInfoFunction() {
  const { error } = await supabase.rpc('create_schema_info_function', {
    sql: `
      CREATE OR REPLACE FUNCTION get_schema_info()
      RETURNS TABLE (
        table_name text,
        column_names text[]
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT
          t.table_name::text,
          array_agg(c.column_name::text) AS column_names
        FROM
          information_schema.tables t
        JOIN
          information_schema.columns c ON t.table_name = c.table_name
        WHERE
          t.table_schema = 'public'
        GROUP BY
          t.table_name;
      END;
      $$ LANGUAGE plpgsql;
    `
  });
  
  return !error;
}

// Run the check
checkTables().catch(console.error);