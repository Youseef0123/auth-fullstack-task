/** Only the user id: everything else is loaded from the database per request. */
export interface JwtPayload {
  sub: string;
}
