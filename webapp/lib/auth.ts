import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 8 * 60 * 60 },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Tài khoản VNPT",
      credentials: {
        name: { label: "Họ và tên", type: "text", placeholder: "Ví dụ: Nguyễn Văn A" },
        phone: { label: "Số điện thoại", type: "text", placeholder: "Ví dụ: 0912345678" },
      },
      async authorize(credentials) {
        if (!credentials?.name || !credentials?.phone) return null;

        const emailToFind = `${credentials.phone.trim()}@vnpt.vn`;

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id, email, name, password_hash")
          .eq("email", emailToFind)
          .single();

        if (error || !user) return null;
        
        // Verify name matches strictly (case insensitive)
        if (user.name.toLowerCase().trim() !== credentials.name.toLowerCase().trim()) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.phone.trim(),
          user.password_hash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string; name: string | null | undefined }).id =
          token.id as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
