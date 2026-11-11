import { create } from 'zustand';
import { authService } from '@/features/auth/services/auth.service';
import type {
  SignInRequest,
  SignUpRequest,
  User,
} from '@/features/auth/types/auth.types';
import { ApiError } from '@/lib/api-error';

/** The only profile fields kept client-side (CLAUDE.md): no token, no timestamps. */
export type SessionUser = Pick<User, 'id' | 'email' | 'name'>;

export type AuthStatus =
  'idle' | 'loading' | 'authenticated' | 'unauthenticated';

/** Only non-sensitive profile data and the status; the token stays in an httpOnly cookie. */
export interface AuthState {
  user: SessionUser | null;
  status: AuthStatus;
  /** Resolves the session; rejects only when the result is unknown (network/server error). */
  fetchMe: () => Promise<void>;
  signIn: (payload: SignInRequest) => Promise<void>;
  signUp: (payload: SignUpRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const toSessionUser = ({ id, email, name }: User): SessionUser => ({
  id,
  email,
  name,
});

/**
 * Module-level store: every write happens in the browser (effects and event
 * handlers), so server renders only ever see the initial state.
 */
export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  status: 'idle',

  fetchMe: async () => {
    if (get().status === 'loading') {
      return;
    }
    set({ status: 'loading' });
    try {
      const user = await authService.getMe();
      set({ user: toSessionUser(user), status: 'authenticated' });
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        // The cookie passed the proxy's presence check but is invalid or expired.
        // Clear it, or the proxy would keep sending /signin back to /app.
        await authService.logout().catch(() => undefined);
        set({ user: null, status: 'unauthenticated' });
        return;
      }
      set({ status: 'idle' });
      throw error;
    }
  },

  signIn: async (payload) => {
    const user = await authService.signIn(payload);
    set({ user: toSessionUser(user), status: 'authenticated' });
  },

  signUp: async (payload) => {
    const user = await authService.signUp(payload);
    set({ user: toSessionUser(user), status: 'authenticated' });
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, status: 'unauthenticated' });
  },
}));

export const selectUser = (state: AuthState): SessionUser | null => state.user;
export const selectStatus = (state: AuthState): AuthStatus => state.status;
export const selectFetchMe = (state: AuthState): AuthState['fetchMe'] =>
  state.fetchMe;
export const selectSignIn = (state: AuthState): AuthState['signIn'] =>
  state.signIn;
export const selectSignUp = (state: AuthState): AuthState['signUp'] =>
  state.signUp;
export const selectLogout = (state: AuthState): AuthState['logout'] =>
  state.logout;
