import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/sahakaar_sathi';
console.log('Connecting to:', connectionString);
const client = postgres(connectionString, { prepare: false });

async function inspect() {
  try {
    const result = await client`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'scheme_qa';
    `;
    console.log('Columns in scheme_qa:');
    console.log(result);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

inspect();
