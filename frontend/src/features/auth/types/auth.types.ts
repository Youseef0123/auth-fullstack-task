/** Mirrors the backend UserResponseDto (GET /api/users/me, signup, signin). */
export interface User {
  id: string;
  email: string;
  name: string;
  /** ISO 8601 timestamp. */
  createdAt: string;
}

/** Mirrors the backend SignUpDto. */
export interface SignUpRequest {
  email: string;
  name: string;
  password: string;
}

/** Mirrors the backend SignInDto. */
export interface SignInRequest {
  email: string;
  password: string;
}
