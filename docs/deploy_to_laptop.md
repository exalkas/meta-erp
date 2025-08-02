# 1. Run the migration

psql -f scripts/migrations/add-page-metadata-columns.sql

# 2. Run the seed script

cd services/api
poetry run python ../../data/seed-scripts/seed_all.py
