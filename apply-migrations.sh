#!/bin/bash

# Script to apply Supabase migrations

echo "🔍 Applying Supabase migrations..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI is not installed. Installing..."
  # Install Supabase CLI
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew install supabase/tap/supabase
  else
    # Linux/WSL
    curl -s https://raw.githubusercontent.com/supabase/cli/main/install.sh | bash
  fi
fi

# Get Supabase URL and key from .env file
SUPABASE_URL=$(grep VITE_SUPABASE_URL .env | cut -d '=' -f2)
SUPABASE_KEY=$(grep VITE_SUPABASE_ANON_KEY .env | cut -d '=' -f2)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Supabase URL or key not found in .env file"
  exit 1
fi

echo "📋 Using Supabase URL: $SUPABASE_URL"

# Apply migrations
echo "🔄 Applying migrations from supabase/migrations directory..."

# Option 1: Using Supabase CLI (if project is linked)
echo "Attempting to apply migrations using Supabase CLI..."
supabase db push

# Option 2: Manual SQL execution using psql (if Option 1 fails)
if [ $? -ne 0 ]; then
  echo "⚠️ Supabase CLI migration failed. Trying manual SQL execution..."
  
  # Ask for database connection details
  read -p "Enter Supabase database host: " DB_HOST
  read -p "Enter Supabase database name: " DB_NAME
  read -p "Enter Supabase database user: " DB_USER
  read -sp "Enter Supabase database password: " DB_PASSWORD
  echo ""
  
  # Apply each migration file
  for migration_file in supabase/migrations/*.sql; do
    echo "Applying migration: $migration_file"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER -f $migration_file
  done
fi

echo "✅ Migrations applied successfully"
echo "🔍 Checking if audio_files table exists..."

# Check if the audio_files table exists
# This requires the user to have psql installed and provide connection details
read -p "Do you want to verify the table creation? (y/n): " VERIFY
if [[ $VERIFY == "y" ]]; then
  read -p "Enter Supabase database host: " DB_HOST
  read -p "Enter Supabase database name: " DB_NAME
  read -p "Enter Supabase database user: " DB_USER
  read -sp "Enter Supabase database password: " DB_PASSWORD
  echo ""
  
  PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -d $DB_NAME -U $DB_USER -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audio_files');"
fi

echo "🚀 Database setup complete. Try uploading a file now!"