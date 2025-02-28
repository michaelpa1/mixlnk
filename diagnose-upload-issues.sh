#!/bin/bash

# Script to diagnose file upload issues

echo "🔍 Starting diagnosis of file upload issues..."

# Check if .env file exists
if [ ! -f .env ]; then
  echo "❌ .env file not found. Please create one with the required environment variables."
  exit 1
fi

# Check if required environment variables are set
echo "📋 Checking environment variables..."
missing_vars=0

if [ -z "$VITE_AWS_REGION" ]; then
  echo "❌ VITE_AWS_REGION is not set in .env file"
  missing_vars=1
fi

if [ -z "$VITE_AWS_ACCESS_KEY_ID" ]; then
  echo "❌ VITE_AWS_ACCESS_KEY_ID is not set in .env file"
  missing_vars=1
fi

if [ -z "$VITE_AWS_SECRET_ACCESS_KEY" ]; then
  echo "❌ VITE_AWS_SECRET_ACCESS_KEY is not set in .env file"
  missing_vars=1
fi

if [ -z "$VITE_S3_BUCKET_NAME" ]; then
  echo "❌ VITE_S3_BUCKET_NAME is not set in .env file"
  missing_vars=1
fi

if [ $missing_vars -eq 1 ]; then
  echo "❌ Some required environment variables are missing. Please check your .env file."
else
  echo "✅ All required environment variables are set"
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules directory not found. Please run 'npm install' first."
  exit 1
fi

# Install dotenv if not already installed
echo "📦 Checking if dotenv is installed..."
if ! npm list dotenv | grep -q dotenv; then
  echo "📦 Installing dotenv..."
  npm install --save-dev dotenv
fi

# Run the S3 configuration check
echo -e "\n🔍 Checking S3 configuration..."
npm run check-s3

# Start the development server in the background
echo -e "\n🚀 Starting development server..."
npm run dev &
DEV_SERVER_PID=$!

# Wait for the server to start
echo "⏳ Waiting for the development server to start..."
sleep 10

# Open the diagnostic page
echo "🌐 Opening diagnostic page..."
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS
  open http://localhost:5173/dashboard/diagnostic
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
  # Linux
  xdg-open http://localhost:5173/dashboard/diagnostic
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
  # Windows
  start http://localhost:5173/dashboard/diagnostic
else
  echo "❌ Unsupported OS. Please open http://localhost:5173/dashboard/diagnostic manually."
fi

echo -e "\n✅ Diagnosis tools are now running."
echo "Please check the diagnostic page in your browser for more information."
echo "When you're done, press Ctrl+C to stop the development server."

# Wait for user to press Ctrl+C
wait $DEV_SERVER_PID