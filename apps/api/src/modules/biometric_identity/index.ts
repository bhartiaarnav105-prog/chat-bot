/**
 * Mock Identity Provider for Phase 6.
 * No biometric hardware integration. Provides a simulated opaque subject reference.
 * Replace with real OIDC/biometric bridge in a future phase.
 */
export interface IdentityVerificationResult {
  verified: boolean;
  /** Opaque external reference — never a raw biometric template */
  externalSubjectRef: string | null;
  provider: string;
}

export interface IdentityProvider {
  verify(deviceId: string): Promise<IdentityVerificationResult>;
}

export class MockIdentityProvider implements IdentityProvider {
  async verify(deviceId: string): Promise<IdentityVerificationResult> {
    console.log(`[MockIdentityProvider] Simulating identity verification on device ${deviceId}`);
    return {
      verified: true,
      externalSubjectRef: `mock-subj-ref-${deviceId}-${Date.now()}`,
      provider: 'mock',
    };
  }
}
