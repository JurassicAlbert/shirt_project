import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const SESSION_COOKIE = "session_token";
const JWT_SECRET = process.env.JWT_SECRET ?? "development_secret_change_me";
const SESSION_DAYS = 7;

export type SessionPayload = {
  userId: string;
  role: "customer" | "admin" | "moderator";
};

export const signSession = (payload: SessionPayload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });

export const verifySession = (token: string): SessionPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
};

export const setSessionCookie = async (payload: SessionPayload) => {
  const token = signSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });
};

export const clearSessionCookie = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};

export const getSessionFromCookie = async (): Promise<SessionPayload | null> => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
};
