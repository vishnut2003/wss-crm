import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/config/db";
import User, { type UserRole } from "@/models/user";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email =
          typeof credentials?.email === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof credentials?.password === "string" ? credentials.password : "";

        if (!email || !password) throw new InvalidCredentialsError();

        await connectDB();
        const user = await User.findOne({ email }).select(
          "+password name email role emailVerified",
        );
        if (!user) throw new InvalidCredentialsError();

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) throw new InvalidCredentialsError();

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      if (!profile) return false;

      const email = profile.email?.toLowerCase();
      if (!email) return false;

      await connectDB();
      let dbUser = await User.findOne({ email });

      if (!dbUser) {
        dbUser = await User.create({
          name: profile.name ?? user.name ?? email,
          email,
          password: await bcrypt.hash(crypto.randomUUID(), 10),
          role: "owner",
          emailVerified: profile.email_verified === true,
        });
      } else if (profile.email_verified && !dbUser.emailVerified) {
        dbUser.emailVerified = true;
        await dbUser.save();
      }

      user.id = dbUser.id;
      user.role = dbUser.role;
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as UserRole;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});
