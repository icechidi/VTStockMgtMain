#!/bin/bash

# Stock Management System Database Setup Script
echo "🚀 Setting up Stock Management System Database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    echo "   Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "   macOS: brew install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Check if PostgreSQL service is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL service is not running. Please start PostgreSQL service."
    echo "   Ubuntu/Debian: sudo systemctl start postgresql"
    echo "   macOS: brew services start postgresql"
    echo "   Windows: Start PostgreSQL service from Services"
    exit 1
fi

# Set default values
DB_USER=${DB_USER:-postgres}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_NAME=${DB_NAME:-stock_management}

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   User: $DB_USER"
echo "   Database: $DB_NAME"
echo ""

# Prompt for password if not set
if [ -z "$DB_PASSWORD" ]; then
    echo -n "🔐 Enter PostgreSQL password for user '$DB_USER': "
    read -s DB_PASSWORD
    echo ""
fi

export PGPASSWORD=$DB_PASSWORD

echo "🗄️  Creating database and tables..."

# Execute SQL scripts in order
echo "   ➤ Creating database..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -f scripts/01-create-database.sql

echo "   ➤ Creating tables..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/02-create-tables.sql

echo "   ➤ Creating indexes..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/03-create-indexes.sql

echo "   ➤ Creating functions..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/04-create-functions.sql

echo "   ➤ Creating triggers..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/05-create-triggers.sql

echo "   ➤ Seeding initial data..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f scripts/06-seed-data.sql

echo ""
echo "✅ Database setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Create a .env.local file in your project root with:"
echo "      DB_USER=$DB_USER"
echo "      DB_HOST=$DB_HOST"
echo "      DB_PORT=$DB_PORT"
echo "      DB_NAME=$DB_NAME"
echo "      DB_PASSWORD=your_password"
echo ""
echo "   2. Install required dependencies:"
echo "      npm install pg @types/pg"
echo ""
echo "   3. Start your Next.js application:"
echo "      npm run dev"
echo ""
echo "🔑 Default login credentials:"
echo "   Admin: admin@stockmanager.com / admin123"
echo "   Manager: manager@stockmanager.com / admin123"
echo "   User: user@stockmanager.com / admin123"
echo ""
echo "🎉 Your Stock Management System is ready to use!"
