import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';

export type CognitoJwtVerifyOptions = {
  region: string;
  userPoolId: string;
  clientId: string;
};

export type VerifiedUser = {
  sub: string;
  email?: string;
  username?: string;
  groups?: string[];
  scope?: string;
  payload: JWTPayload;
};

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getIssuer(region: string, userPoolId: string) {
  return `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
}

function getJwks(region: string, userPoolId: string) {
  const issuer = getIssuer(region, userPoolId);
  const jwksUrl = new URL(`${issuer}/.well-known/jwks.json`);

  const key = jwksUrl.toString();
  const existing = jwksCache.get(key);
  if (existing) return existing;

  const jwks = createRemoteJWKSet(jwksUrl);
  jwksCache.set(key, jwks);
  return jwks;
}

export async function verifyCognitoAccessToken(
  token: string,
  opts: CognitoJwtVerifyOptions,
): Promise<VerifiedUser> {
  const issuer = getIssuer(opts.region, opts.userPoolId);
  const jwks = getJwks(opts.region, opts.userPoolId);

  const { payload } = await jwtVerify(token, jwks, {
    issuer,
    audience: opts.clientId,
  });

  const sub = String(payload.sub ?? '');
  if (!sub) throw new Error('JWT missing sub');

  return {
    sub,
    email: typeof payload.email === 'string' ? payload.email : undefined,
    username:
      typeof payload['cognito:username'] === 'string'
        ? payload['cognito:username']
        : undefined,
    groups: Array.isArray(payload['cognito:groups'])
      ? (payload['cognito:groups'] as string[])
      : undefined,
    scope: typeof payload.scope === 'string' ? payload.scope : undefined,
    payload,
  };
}
