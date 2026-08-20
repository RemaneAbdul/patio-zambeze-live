export function isValidStaffSessionToken(token: string) {
  return token.length >= 32;
}

export function shouldQueryStaffLookup(isAuthorized: boolean, token: string) {
  return isAuthorized && isValidStaffSessionToken(token);
}

export function staffLookupInput(token: string) {
  return isValidStaffSessionToken(token) ? { sessionToken: token } : null;
}

