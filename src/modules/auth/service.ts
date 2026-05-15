export function createAuthPayload(token: string, user: any) {
  return { token, user };
}
