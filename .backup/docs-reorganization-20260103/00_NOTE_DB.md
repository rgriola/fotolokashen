Yes, exactly!

Vercel Postgres credentials to your local .env.local
 file, you have effectively pointed your local development machine to use the production database.

This means:

Schema Changes: If you change 
prisma/schema.prisma
 locally, run npx prisma db push locally, and it will update the Vercel database immediately.
Data: When you run the app locally (npm run dev), you will see the same users and locations as the live site.
Warning: Be careful when running npx prisma db push! It can sometimes cause data loss if you make destructive schema changes (like removing a column). It will warn you first, but just be aware that you are operating on the live database now.

If you prefer to keep them separate in the future (e.g., a "Development" DB vs "Production" DB), you would just keep different credentials in 
.env.local
. But for now, sharing one database is the simplest way to get going!