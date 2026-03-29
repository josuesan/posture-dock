import type { AuthUser } from '@/domain/auth/types';

export interface AuthGateway {
  isAvailable(): boolean;
  getCurrentUser(): Promise<AuthUser | null>;
  signInWithMagicLink(email: string): Promise<{ error?: string }>;
  signOut(): Promise<{ error?: string }>;
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void;
}
