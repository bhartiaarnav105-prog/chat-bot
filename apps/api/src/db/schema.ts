import { 
  pgTable, 
  uuid, 
  text, 
  timestamp, 
  boolean, 
  jsonb, 
  pgEnum, 
  integer, 
  customType 
} from 'drizzle-orm/pg-core';

// Custom vector type for pgvector
const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return 'vector(1536)'; // Assuming standard OpenAI embedding size for future
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    return JSON.parse(value);
  },
});

// Enums
export const roleEnum = pgEnum('role', ['farmer', 'field_worker', 'centre_operator', 'scheme_editor', 'administrator']);
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'approved', 'rejected', 'expired']);

// CORE & IDENTITY
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const serviceCentres = pgTable('service_centres', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id).notNull(),
  name: text('name').notNull(),
  location: text('location'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  role: roleEnum('role').notNull(),
  serviceCentreId: uuid('service_centre_id').references(() => serviceCentres.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const devices = pgTable('devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  hardwareId: text('hardware_id').unique().notNull(),
  serviceCentreId: uuid('service_centre_id').references(() => serviceCentres.id).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// FARMER DATA & PRIVACY
export const farmers = pgTable('farmers', {
  id: uuid('id').defaultRandom().primaryKey(),
  registeredById: uuid('registered_by_id').references(() => users.id),
  village: text('village'),
  preferredLanguage: text('preferred_language'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const farmerConsents = pgTable('farmer_consents', {
  id: uuid('id').defaultRandom().primaryKey(),
  farmerId: uuid('farmer_id').references(() => farmers.id).notNull(),
  consentType: text('consent_type').notNull(),
  isGranted: boolean('is_granted').default(true).notNull(),
  withdrawnAt: timestamp('withdrawn_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const farmerIdentityLinks = pgTable('farmer_identity_links', {
  id: uuid('id').defaultRandom().primaryKey(),
  farmerId: uuid('farmer_id').references(() => farmers.id).notNull(),
  providerName: text('provider_name').notNull(),
  externalSubjectRef: text('external_subject_ref').notNull(), // Opaque reference, NO raw biometrics
  providerMetadata: jsonb('provider_metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// INTERACTIONS
export const farmerInteractions = pgTable('farmer_interactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  farmerId: uuid('farmer_id').references(() => farmers.id).notNull(),
  deviceId: uuid('device_id').references(() => devices.id),
  detectedLanguage: text('detected_language'),
  confidenceScore: integer('confidence_score'),
  transcript: text('transcript'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const savedGuidance = pgTable('saved_guidance', {
  id: uuid('id').defaultRandom().primaryKey(),
  farmerId: uuid('farmer_id').references(() => farmers.id).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// SCHEMES (IMMUTABLE)
export const schemes = pgTable('schemes', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const schemeVersions = pgTable('scheme_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  schemeId: uuid('scheme_id').references(() => schemes.id).notNull(),
  sourceUrl: text('source_url').notNull(),
  effectiveFrom: timestamp('effective_from').notNull(),
  effectiveTo: timestamp('effective_to'),
  geography: jsonb('geography'),
  reviewerId: uuid('reviewer_id').references(() => users.id),
  reviewStatus: reviewStatusEnum('review_status').default('pending').notNull(),
  checksum: text('checksum').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const eligibilityRules = pgTable('eligibility_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  schemeVersionId: uuid('scheme_version_id').references(() => schemeVersions.id).notNull(),
  ruleKey: text('rule_key').notNull(),
  ruleValue: jsonb('rule_value').notNull(),
});

export const schemeDocuments = pgTable('scheme_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  schemeVersionId: uuid('scheme_version_id').references(() => schemeVersions.id).notNull(),
  storagePath: text('storage_path').notNull(), // MinIO path
  documentType: text('document_type').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// KNOWLEDGE BASE
export const knowledgeDocuments = pgTable('knowledge_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  schemeVersionId: uuid('scheme_version_id').references(() => schemeVersions.id).notNull(),
  title: text('title').notNull(),
  language: text('language').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const knowledgeChunks = pgTable('knowledge_chunks', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => knowledgeDocuments.id).notNull(),
  chunkText: text('chunk_text').notNull(),
  embedding: vector('embedding'), // pgvector support
  pageNumber: integer('page_number'),
});

// GRIEVANCES
export const grievances = pgTable('grievances', {
  id: uuid('id').defaultRandom().primaryKey(),
  farmerId: uuid('farmer_id').references(() => farmers.id).notNull(),
  serviceCentreId: uuid('service_centre_id').references(() => serviceCentres.id),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const grievanceEvents = pgTable('grievance_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  grievanceId: uuid('grievance_id').references(() => grievances.id).notNull(),
  status: text('status').notNull(),
  notes: text('notes'),
  actorId: uuid('actor_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// AUDIT & SYNC
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  actorId: uuid('actor_id').references(() => users.id),
  action: text('action').notNull(),
  targetResource: text('target_resource').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const syncOutbox = pgTable('sync_outbox', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').references(() => devices.id).notNull(),
  payload: jsonb('payload').notNull(),
  status: text('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const syncReceipts = pgTable('sync_receipts', {
  id: uuid('id').defaultRandom().primaryKey(),
  syncOutboxId: uuid('sync_outbox_id').references(() => syncOutbox.id).notNull(),
  receivedAt: timestamp('received_at').defaultNow().notNull(),
});
