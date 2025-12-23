import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(input: string) {
  const { payload } = await jwtVerify(input, key, {
    algorithms: ['HS256'],
  });
  return payload;
}

// Parse cookies string like "a=1; b=2" and return map
function parseCookieString(cookieHeader: string | null) {
  const map: Record<string, string> = {};
  if (!cookieHeader) return map;
  cookieHeader.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const name = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    map[name] = decodeURIComponent(val);
  });
  return map;
}

export async function getSessionFromRequest(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookiesMap = parseCookieString(cookieHeader);
    const sess = cookiesMap['session'];

    if (sess) {
      try {
        return await decrypt(sess);
      } catch (e) {
        return null;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

// Admin-specific request-based session (prefers admin_session)
export async function getAdminSessionFromRequest(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie');
    const cookiesMap = parseCookieString(cookieHeader);
    const admin = cookiesMap['admin_session'];
    const sess = cookiesMap['session'];

    if (admin) {
      try {
        return await decrypt(admin);
      } catch (e) {
        // continue to regular session
      }
    }

    if (sess) {
      try {
        return await decrypt(sess);
      } catch (e) {
        return null;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

export async function createSession(userId: number, email: string, role: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const session = await encrypt({ userId, email, role, expires });

  const cookieStore = await cookies();
  cookieStore.set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const cookieStore = await cookies();
  // Return regular user session (do NOT prefer admin session here)
  const session = cookieStore.get('session')?.value;
  if (!session) return null;

  try {
    return await decrypt(session);
  } catch (error) {
    return null;
  }
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const adminSession = cookieStore.get('admin_session')?.value;
  if (!adminSession) return null;
  try {
    return await decrypt(adminSession);
  } catch (error) {
    return null;
  }
}

// Helper to check if session is a valid admin session
export function isValidAdminSession(session: any): boolean {
  if (!session) return false;
  // Check for admin type OR admin roles (super_admin, admin, moderator)
  return session.type === 'admin' || ['super_admin', 'admin', 'moderator'].includes(session.role);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  cookieStore.delete('admin_session');
}

