import type {
  SignInRequest,
  SignUpRequest,
  User,
} from '@/features/auth/types/auth.types';
import { http } from '@/lib/http';

/** Thin typed wrappers over the auth endpoints; the session lives in an httpOnly cookie. */
export const authService = {
  async signUp(payload: SignUpRequest): Promise<User> {
    const { data } = await http.post<User>('/auth/signup', payload);
    return data;
  },

  async signIn(payload: SignInRequest): Promise<User> {
    const { data } = await http.post<User>('/auth/signin', payload);
    return data;
  },

  async logout(): Promise<void> {
    await http.post('/auth/logout');
  },

  async getMe(): Promise<User> {
    const { data } = await http.get<User>('/users/me');
    return data;
  },
};
