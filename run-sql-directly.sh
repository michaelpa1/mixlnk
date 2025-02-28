#!/bin/bash

# Script to run SQL directly against Supabase database

echo "🔍 Running SQL directly against Supabase database..."

# Check if psql is installed
if ! command -v psql &> /dev/null; then
  echo "❌ PostgreSQL client (psql) is not installed."
  echo "Please install PostgreSQL client tools first:"
  echo "  - macOS: brew install postgresql"
  echo "  - Ubuntu/Debian: sudo apt-get install postgresql-client"
  echo "  - Windows: Install from https://www.postgresql.org/download/windows/"
  exit 1
fi

# Ask for database connection details
echo "Please enter your Supabase database connection details:"
read -p "Database Host: " DB_HOST
read -p "Database Name: " DB_NAME
read -p "Database User: " DB_USER
read -sp "Database Password: " DB_PASSWORD
echo ""
read -p "Database Port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Confirm SQL file to run
SQL_FILE="create-audio-tables.sql"
read -p "SQL file to run (default: $SQL_FILE): " INPUT_SQL_FILE
SQL_FILE=${INPUT_SQL_FILE:-$SQL_FILE}

if [ ! -f "$SQL_FILE" ]; then
  echo "❌ SQL file $SQL_FILE not found"
  exit 1
fi

echo "🔍 Running SQL file: $SQL_FILE"
echo "🔍 Against database: $DB_NAME on $DB_HOST:$DB_PORT"
read -p "Continue? (y/n): " CONFIRM

if [[ $CONFIRM != "y" ]]; then
  echo "❌ Operation cancelled"
  exit 1
fi

# Run the SQL file
echo "🔄 Executing SQL..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -f $SQL_FILE

if [ $? -eq 0 ]; then
  echo "✅ SQL executed successfully"
else
  echo "❌ Error executing SQL"
  exit 1
fi

# Verify tables were created
echo "🔍 Verifying tables were created..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('audio_files', 'audio_comments')
  ORDER BY table_name;
"

echo "🔍 Checking row level security policies..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -d $DB_NAME -U $DB_USER -c "
  SELECT tablename, policyname, permissive, roles, cmd
  FROM pg_policies
  WHERE schemaname = 'public'
  AND tablename IN ('audio_files', 'audio_comments')
  ORDER BY tablename, policyname;
"

echo "✅ Database setup complete. Try uploading a file now!"