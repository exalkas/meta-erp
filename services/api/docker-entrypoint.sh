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
until redis-cli -h redis ping; do
  echo "Redis is unavailable - sleeping"
  sleep 2
done
echo "✅ Redis is ready!"

# Skip Alembic migrations (project uses custom scripts)
echo "🗄️ Skipping Alembic migrations (using custom seed scripts)..."

# Check if auto-seeding is enabled and database needs seeding
if [ "${AUTO_SEED_ON_STARTUP:-true}" = "true" ]; then
    echo "🌱 Checking if database needs seeding..."
    TENANT_COUNT=$(psql "${DATABASE_URL}" -t -c "SELECT COUNT(*) FROM tenants;" 2>/dev/null | xargs || echo "0")

    if [ -z "$TENANT_COUNT" ] || [ "$TENANT_COUNT" -eq "0" ] 2>/dev/null; then
        echo "🌱 Seeding database with initial data..."
        cd /app && PYTHONPATH=/app python data/seed-scripts/seed_all.py
        echo "✅ Database seeded successfully!"
    else
        echo "✅ Database already seeded (found $TENANT_COUNT tenants)"
    fi
else
    echo "🚫 Auto-seeding disabled (AUTO_SEED_ON_STARTUP=false)"
fi

echo "🎯 Starting application..."
exec "$@"