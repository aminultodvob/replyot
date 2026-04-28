import { randomBytes, createHash } from "crypto";

import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession, type NextAuthOptions } from "next-auth";
import { redirect } from "next/navigation";
import { Resend } from "resend";
import { z } from "zod";

import {
  createPasswordResetToken,
  createUser,
  findAuthUserByEmail,
  findPasswordResetToken,
  findUser,
  findUserByEmail,
  markPasswordResetTokenUsed,
  updatePasswordHash,
} from "@/actions/user/queries";
import { hashPassword, verifyPassword } from "./passwords";
import { applyRateLimit, getRequestIp } from "./rate-limit";
import { logSecurityEvent } from "./security-log";

const PASSWORD_POLICY_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;
const RESET_TOKEN_CLOCK_SKEW_MS = 30 * 1000;

const credentialsSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const signUpSchema = credentialsSchema.extend({
  firstname: z.string().trim().min(1).max(100),
  lastname: z.string().trim().min(1).max(100),
  confirmPassword: z.string().min(6),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const getAuthSecret = () => {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("AUTH_SECRET is required");
  }

  return secret;
};

const getAppUrl = () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (!appUrl) {
    throw new Error("NEXT_PUBLIC_APP_URL is required");
  }

  return appUrl;
};

const getResendClient = () => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.AUTH_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is required");
  }

  if (!fromEmail) {
    throw new Error("AUTH_FROM_EMAIL is required");
  }

  return {
    resend: new Resend(apiKey),
    fromEmail,
  };
};

export const normalizeEmail = (email: string) => email.trim().toLowerCase();

export const createPasswordResetHash = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export const authOptions: NextAuthOptions = {
  secret: getAuthSecret(),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        try {
          // NextAuth calls this on credential callbacks; throttle by client IP.
          const ip = getRequestIp(req?.headers ?? new Headers());
          const loginLimit = applyRateLimit({
            key: `auth:login:${ip}`,
            limit: 12,
            windowMs: 15 * 60 * 1000,
          });

          if (!loginLimit.ok) {
            logSecurityEvent("auth", "login_rate_limited", { ip });
            throw new Error("AUTH_RATE_LIMITED");
          }

          const parsed = credentialsSchema.safeParse(credentials);

          if (!parsed.success) {
            return null;
          }

          const email = normalizeEmail(parsed.data.email);
          const emailLimit = applyRateLimit({
            key: `auth:login-email:${email}`,
            limit: 12,
            windowMs: 15 * 60 * 1000,
          });

          if (!emailLimit.ok) {
            logSecurityEvent("auth", "login_email_rate_limited", { ip });
            throw new Error("AUTH_RATE_LIMITED");
          }

          const user = await findAuthUserByEmail(email);

          if (!user?.passwordHash) {
            return null;
          }

          const isValidPassword = await verifyPassword(
            parsed.data.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            firstname: user.firstname ?? "",
            lastname: user.lastname ?? "",
            name: [user.firstname, user.lastname].filter(Boolean).join(" "),
          };
        } catch (error) {
          const ip = getRequestIp(req?.headers ?? new Headers());
          logSecurityEvent("auth", "login_authorize_failed", {
            ip,
            reason:
              error instanceof Error &&
              (error.message === "AUTH_RATE_LIMITED" ||
                error.message === "AUTH_UNAVAILABLE")
                ? error.message
                : "AUTH_UNAVAILABLE",
          });
          throw new Error(
            error instanceof Error && error.message === "AUTH_RATE_LIMITED"
              ? "AUTH_RATE_LIMITED"
              : "AUTH_UNAVAILABLE"
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.firstname = (user as { firstname?: string }).firstname ?? "";
        token.lastname = (user as { lastname?: string }).lastname ?? "";
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.firstname = (token.firstname as string | undefined) ?? "";
        session.user.lastname = (token.lastname as string | undefined) ?? "";
      }

      return session;
    },
  },
};

export const getSessionUser = async () => {
  const session = await getServerSession(authOptions);

  return session?.user ?? null;
};

export const requireSessionUser = async () => {
  const user = await getSessionUser();

  if (!user?.id) {
    redirect("/sign-in");
  }

  return user;
};

export const getCurrentProfile = async () => {
  const sessionUser = await getSessionUser();

  if (!sessionUser?.id) {
    return null;
  }

  return await findUser(sessionUser.id);
};

export const signUpWithPassword = async (input: {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
}) => {
  const parsed = signUpSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 400 as const,
      error: parsed.error.issues[0]?.message ?? "Invalid signup details",
    };
  }

  if (parsed.data.password !== parsed.data.confirmPassword) {
    return {
      status: 400 as const,
      error: "Passwords do not match",
    };
  }

  if (!PASSWORD_POLICY_REGEX.test(parsed.data.password)) {
    return {
      status: 400 as const,
      error:
        "Password must be at least 6 characters and include uppercase, lowercase, and number",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    return {
      status: 409 as const,
      error: "An account with this email already exists",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await createUser(
    parsed.data.firstname.trim(),
    parsed.data.lastname.trim(),
    email,
    passwordHash
  );

  return {
    status: 201 as const,
    data: user,
  };
};

export const requestPasswordReset = async (input: { email: string }) => {
  const parsed = forgotPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 200 as const,
      data: "If an account exists, a reset link has been sent.",
    };
  }

  const email = normalizeEmail(parsed.data.email);
  const resetLimit = applyRateLimit({
    key: `auth:reset-request:${email}`,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  });

  if (!resetLimit.ok) {
    return {
      status: 200 as const,
      data: "If an account exists, a reset link has been sent.",
    };
  }

  const user = await findAuthUserByEmail(email);

  if (!user) {
    return {
      status: 200 as const,
      data: "If an account exists, a reset link has been sent.",
    };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = createPasswordResetHash(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);

  await createPasswordResetToken(user.id, tokenHash, expiresAt);

  const resetUrl = `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const { resend, fromEmail } = getResendClient();

  await resend.emails.send({
    from: fromEmail,
    to: user.email,
    subject: "Reset your Replyot password",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #0f172a;">
        <p style="font-size: 12px; letter-spacing: 0.24em; text-transform: uppercase; color: #0f766e; font-weight: 700;">Replyot</p>
        <h1 style="font-size: 28px; line-height: 1.2; margin: 12px 0 16px;">Reset your password</h1>
        <p style="font-size: 15px; line-height: 1.7; color: #475569;">
          We received a request to reset your password. This link will expire in 30 minutes.
        </p>
        <p style="margin: 28px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 18px; border-radius: 12px; background: #0f172a; color: #ffffff; text-decoration: none; font-weight: 600;">
            Reset password
          </a>
        </p>
        <p style="font-size: 13px; line-height: 1.6; color: #64748b;">
          If you didn’t request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  return {
    status: 200 as const,
    data: "If an account exists, a reset link has been sent.",
  };
};

export const resetPasswordWithToken = async (input: {
  token: string;
  password: string;
  confirmPassword: string;
}) => {
  const parsed = resetPasswordSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: 400 as const,
      error: parsed.error.issues[0]?.message ?? "Invalid reset details",
    };
  }

  const tokenHash = createPasswordResetHash(parsed.data.token);
  const record = await findPasswordResetToken(tokenHash);
  const expiresAt =
    record?.expiresAt instanceof Date
      ? record.expiresAt
      : record?.expiresAt
        ? new Date(record.expiresAt)
        : null;

  if (
    !record ||
    record.usedAt ||
    !expiresAt ||
    Number.isNaN(expiresAt.getTime()) ||
    expiresAt.getTime() + RESET_TOKEN_CLOCK_SKEW_MS < Date.now()
  ) {
    return {
      status: 400 as const,
      error: "This reset link is invalid or expired",
    };
  }

  if (!PASSWORD_POLICY_REGEX.test(parsed.data.password)) {
    return {
      status: 400 as const,
      error:
        "Password must be at least 6 characters and include uppercase, lowercase, and number",
    };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  await updatePasswordHash(record.userId, passwordHash);
  await markPasswordResetTokenUsed(record.id);

  return {
    status: 200 as const,
    data: "Password updated",
  };
};
