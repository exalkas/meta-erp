#!/bin/bash
set -e

echo "🚀 Starting API Service..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis..."
until redis-cli -h redis ping; then
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Run database migrations
echo "🗄️ Running database migrations..."
python -m alembic upgrade head

# Check if database has been seeded
echo "🌱 Checking if database needs seeding..."
TENANT_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM tenants;" 2>/dev/null | xargs || echo "0")

if [ "$TENANT_COUNT" -eq "0" ]; then
    echo "🌱 Seeding database with initial data..."
    python data/seed-scripts/seed_all.py
    echo "✅ Database seeded successfully!"
else
    echo "✅ Database already seeded (found $TENANT_COUNT tenants)"
fi

echo "🎯 Starting application..."
exec "$@"