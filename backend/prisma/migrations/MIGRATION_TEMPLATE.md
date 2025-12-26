# Database Migration Instructions

## Prerequisites
1. Set up your PostgreSQL database
2. Add DATABASE_URL to your `.env` file:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/swiftline?schema=public"
   ```

## Running the Migration

Once DATABASE_URL is configured, run:

```bash
cd backend
npx prisma migrate dev --name add_commerce_layer
```

This will:
1. Create a new migration file
2. Apply the migration to your database
3. Generate the Prisma client with all new models

## Migration Contents

This migration adds:
- Store model (with visibility, sync, risk fields)
- Product model (with availability, AI fields, source of truth)
- StoreSyncLog model
- FraudSignal model
- Promotion model
- Updates to Transaction model (optional productId, promotionId)
- Updates to User model (store relation)
- 7 new enums

## After Migration

1. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

2. Verify the migration:
   ```bash
   npx prisma studio
   ```

## Rollback (if needed)

If you need to rollback:
```bash
npx prisma migrate reset
```

⚠️ **Warning**: This will delete all data. Only use in development.

## Production Migration

For production:
```bash
npx prisma migrate deploy
```

This applies pending migrations without prompting.

