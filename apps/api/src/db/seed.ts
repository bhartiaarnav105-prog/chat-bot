import { db, client } from './index';
import { 
  rolesEnum, organizations, serviceCentres, users, devices, 
  farmers, schemes, schemeVersions, schemeDocuments 
} from './schema';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

async function seed() {
  console.log('----------------------------------------------------');
  console.log('[WARNING] USING DEMO SEED DATA. NOT FOR PRODUCTION.');
  console.log('----------------------------------------------------');

  try {
    // 1. Core & Identity
    const [org] = await db.insert(organizations).values({
      name: 'Demo Organization',
    }).returning();

    const [centre] = await db.insert(serviceCentres).values({
      organizationId: org.id,
      name: 'Demo Service Centre 1',
      location: 'Village A',
    }).returning();

    const [adminUser] = await db.insert(users).values({
      name: 'Admin User',
      email: 'admin@demo.com',
      role: 'administrator',
    }).returning();

    const [operatorUser] = await db.insert(users).values({
      name: 'Operator User',
      email: 'operator@demo.com',
      role: 'centre_operator',
      serviceCentreId: centre.id,
    }).returning();

    const [device] = await db.insert(devices).values({
      hardwareId: 'DEMO-HW-001',
      serviceCentreId: centre.id,
    }).returning();

    // 2. Farmer
    const [farmer] = await db.insert(farmers).values({
      registeredById: operatorUser.id,
      village: 'Village A',
      preferredLanguage: 'hi',
    }).returning();

    console.log('Demo data seeded successfully!');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Close the postgres connection pool
    await client.end();
  }
}

seed();
