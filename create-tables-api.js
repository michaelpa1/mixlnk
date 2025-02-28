// Script to create tables using Supabase REST API
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Creating tables using Supabase REST API');
console.log(`URL: ${supabaseUrl}`);
console.log(`Key: ${supabaseKey ? supabaseKey.substring(0, 10) + '...' : 'undefined'}`);

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase URL or key not found in .env file');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('\n🔍 Creating tables...');
  
  try {
    // 1. Enable UUID extension
    console.log('\n1. Enabling UUID extension...');
    const { error: uuidError } = await supabase.rpc('create_uuid_extension');
    
    if (uuidError) {
      if (uuidError.message.includes('function') && uuidError.message.includes('does not exist')) {
        console.log('Creating UUID extension function...');
        
        // Create the function to enable UUID extension
        const { error: createFuncError } = await supabase.rpc('create_function', {
          function_name: 'create_uuid_extension',
          function_definition: `
            CREATE OR REPLACE FUNCTION create_uuid_extension()
            RETURNS void AS $$
            BEGIN
              CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            END;
            $$ LANGUAGE plpgsql;
          `
        });
        
        if (createFuncError) {
          console.error('❌ Error creating UUID extension function:', createFuncError.message);
        } else {
          console.log('✅ UUID extension function created');
          
          // Try again
          const { error: retryError } = await supabase.rpc('create_uuid_extension');
          
          if (retryError) {
            console.error('❌ Error enabling UUID extension:', retryError.message);
          } else {
            console.log('✅ UUID extension enabled');
          }
        }
      } else {
        console.error('❌ Error enabling UUID extension:', uuidError.message);
      }
    } else {
      console.log('✅ UUID extension enabled');
    }
    
    // 2. Create audio_files table
    console.log('\n2. Creating audio_files table...');
    const { error: audioFilesError } = await supabase.rpc('create_table', {
      table_name: 'audio_files',
      table_definition: `
        CREATE TABLE IF NOT EXISTS audio_files (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          s3_key VARCHAR(255) NOT NULL,
          requires_approval BOOLEAN DEFAULT true,
          approved BOOLEAN DEFAULT false,
          approved_by UUID,
          approved_at TIMESTAMP WITH TIME ZONE,
          share_id VARCHAR(255) UNIQUE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
        );
      `
    });
    
    if (audioFilesError) {
      if (audioFilesError.message.includes('function') && audioFilesError.message.includes('does not exist')) {
        console.log('Creating table creation function...');
        
        // Create the function to create tables
        const { error: createFuncError } = await supabase.rpc('create_function', {
          function_name: 'create_table',
          function_definition: `
            CREATE OR REPLACE FUNCTION create_table(table_name text, table_definition text)
            RETURNS void AS $$
            BEGIN
              EXECUTE table_definition;
            END;
            $$ LANGUAGE plpgsql;
          `
        });
        
        if (createFuncError) {
          console.error('❌ Error creating table creation function:', createFuncError.message);
        } else {
          console.log('✅ Table creation function created');
          
          // Try again
          const { error: retryError } = await supabase.rpc('create_table', {
            table_name: 'audio_files',
            table_definition: `
              CREATE TABLE IF NOT EXISTS audio_files (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                s3_key VARCHAR(255) NOT NULL,
                requires_approval BOOLEAN DEFAULT true,
                approved BOOLEAN DEFAULT false,
                approved_by UUID,
                approved_at TIMESTAMP WITH TIME ZONE,
                share_id VARCHAR(255) UNIQUE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
              );
            `
          });
          
          if (retryError) {
            console.error('❌ Error creating audio_files table:', retryError.message);
          } else {
            console.log('✅ audio_files table created');
          }
        }
      } else {
        console.error('❌ Error creating audio_files table:', audioFilesError.message);
      }
    } else {
      console.log('✅ audio_files table created');
    }
    
    // 3. Create audio_comments table
    console.log('\n3. Creating audio_comments table...');
    const { error: audioCommentsError } = await supabase.rpc('create_table', {
      table_name: 'audio_comments',
      table_definition: `
        CREATE TABLE IF NOT EXISTS audio_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          file_id UUID NOT NULL,
          user_id UUID NOT NULL,
          timestamp FLOAT NOT NULL,
          text TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
          CONSTRAINT fk_file FOREIGN KEY (file_id) REFERENCES audio_files(id) ON DELETE CASCADE
        );
      `
    });
    
    if (audioCommentsError) {
      console.error('❌ Error creating audio_comments table:', audioCommentsError.message);
    } else {
      console.log('✅ audio_comments table created');
    }
    
    // 4. Create indexes
    console.log('\n4. Creating indexes...');
    const indexes = [
      { name: 'idx_audio_files_user_id', definition: 'CREATE INDEX IF NOT EXISTS idx_audio_files_user_id ON audio_files(user_id);' },
      { name: 'idx_audio_files_share_id', definition: 'CREATE INDEX IF NOT EXISTS idx_audio_files_share_id ON audio_files(share_id);' },
      { name: 'idx_audio_comments_file_id', definition: 'CREATE INDEX IF NOT EXISTS idx_audio_comments_file_id ON audio_comments(file_id);' },
      { name: 'idx_audio_comments_timestamp', definition: 'CREATE INDEX IF NOT EXISTS idx_audio_comments_timestamp ON audio_comments(timestamp);' }
    ];
    
    for (const index of indexes) {
      const { error: indexError } = await supabase.rpc('create_table', {
        table_name: index.name,
        table_definition: index.definition
      });
      
      if (indexError) {
        console.error(`❌ Error creating index ${index.name}:`, indexError.message);
      } else {
        console.log(`✅ Index ${index.name} created`);
      }
    }
    
    console.log('\n🏁 Table creation completed');
    
  } catch (error) {
    console.error('❌ Unexpected error during table creation:', error.message);
    if (error.stack) console.error(error.stack);
  }
}

// Run the function
createTables().catch(console.error);