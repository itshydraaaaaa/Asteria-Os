export type OperatorSession = {
  id: string;
  email: string;
  name: string;
  role: 'operator' | 'admin';
};

/** Default single-tenant operator profile for local dev & demo mode */
export const DEFAULT_OPERATOR: OperatorSession = {
  id: 'op-default',
  email: 'operator@asteria.os',
  name: 'Asteria Operator',
  role: 'admin',
};

export function getOperatorSession(req: Request): OperatorSession | null {
  const cookieHeader = req.headers.get('cookie') || '';
  if (cookieHeader.includes('asteria_session=unauthorized')) {
    return null;
  }
  // Single-tenant deck default session
  return DEFAULT_OPERATOR;
}

export function isOperatorAuthenticated(req: Request): boolean {
  return getOperatorSession(req) !== null;
}
