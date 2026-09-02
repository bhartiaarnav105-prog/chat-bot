import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { db, client } from '../src/db/index';
import { users, farmers, farmerIdentityLinks, roleEnum } from '../src/db/schema';
import { eq } from 'drizzle-orm';

describe('Database Constraints & Authorization rules', () => {
  afterAll(async () => {
    await client.end();
  });

  it('should enforce role constraints on users', () => {
    // Check that roleEnum allows specific roles
    expect(roleEnum.enumValues).toContain('administrator');
    expect(roleEnum.enumValues).toContain('centre_operator');
    expect(roleEnum.enumValues).not.toContain('super_hacker');
  });

  it('farmer_identity_links should strictly define external_subject_ref with no biometrics', () => {
    const tableKeys = Object.keys(farmerIdentityLinks);
    
    // Explicitly check for absence of biometric templates
    expect(tableKeys).not.toContain('fingerprint_template');
    expect(tableKeys).not.toContain('minutia_data');
    expect(tableKeys).not.toContain('raw_biometric');
    
    // Must contain the opaque ref
    expect(tableKeys).toContain('externalSubjectRef');
    expect(tableKeys).toContain('providerMetadata');
  });
});
