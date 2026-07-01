import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { getCurrentUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/expenses");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-4 px-4">
      <AuthForm mode="signup" />
      <p className="text-center text-sm text-zinc-600">
        Already have an account?{" "}
        <Link className="font-semibold text-blue-600" href="/login">
          Sign in
        </Link>
      </p>
    </main>
  );
}
