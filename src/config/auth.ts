import { auth } from "@colyseus/auth";
import * as bcrypt from "bcryptjs";
import logger from "./logger";

// JWT.settings.secret is set in app.config.ts immediately before auth.routes() so the
// fallback JWT_SECRET (when set there) is applied; auth.ts loads earlier when env may be unset.

const fakeDb: any[] = [];
const BCRYPT_ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10;

// Find user by email (for login)
auth.settings.onFindUserByEmail = async (email) => {
  const userFound = fakeDb.find((user) => user.email === email);

  // Log without exposing password
  if (process.env.NODE_ENV === "development") {
    logger.debug("Finding user by email", { email, found: !!userFound });
  }

  // Return user object without the password hash
  if (!userFound) return null;
  const { passwordHash, ...userWithoutPassword } = userFound;
  return userWithoutPassword;
};

// Register with email and password
auth.settings.onRegisterWithEmailAndPassword = async (email, password) => {
  // Hash the password with bcrypt
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  
  const user = { 
    email, 
    passwordHash,
    name: email.split("@")[0],
    createdAt: new Date().toISOString(),
  };

  // Store the user object
  fakeDb.push(JSON.parse(JSON.stringify(user)));
  
  // Return without password
  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

// Register anonymously
auth.settings.onRegisterAnonymously = async (options) => {
  return {
    anonymousId: Math.round(Math.random() * 1000000),
    anonymous: true,
    createdAt: new Date().toISOString(),
    ...options
  };
};

export default auth;