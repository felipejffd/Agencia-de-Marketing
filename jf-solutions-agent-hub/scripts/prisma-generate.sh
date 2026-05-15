#!/bin/bash

# Set a default DATABASE_URL if not provided
# This allows prisma generate to work during builds
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./dev.db"
fi

# Generate Prisma Client
pnpm prisma generate
