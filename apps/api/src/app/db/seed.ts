import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schemas';

async function main() {
  console.log('--- seeding started ---');
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Missing database connection string');
  }

  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema });

  console.log('creating user');

  const [user] = await db.insert(schema.users)
    .values({
      name: 'Admin',
      email: 'admin@admin.com',
      password: '$2a$12$KnR89nuugjaegBzefs0e9.VTA8JEIwmFWW7JYYtKLSqMmZncSvRrO',
  }).returning();

  console.log('creating tasks...');

  await db.insert(schema.tasks)
    .values([
      {
        title: 'Design System and UI/UX Concept',
        description: 'Create a comprehensive design for the tasks management application, including UI/UX flows.',
        status: 'Doing',
        userId: user.id,
      },
      {
        title: 'Implement Frontend Components',
        description: 'Convert the design mockups into functional HTML and CSS using the application\'s design system.',
        status: 'To Do',
        userId: user.id,
      }
    ]);

  console.log('--- seeding completed ---');
  await pool.end();
}

main().catch(error => {
  console.error('seeding failed: ', error);
  process.exit(1);
});
