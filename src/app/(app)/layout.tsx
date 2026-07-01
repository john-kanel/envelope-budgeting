import { BottomNav } from "@/components/nav";
import { SignOutButton } from "@/components/signout-button";
import { requireUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col pb-20">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-900">Envelope Budgeting</p>
            <p className="text-xs text-zinc-500">{user.email}</p>
          </div>
          <SignOutButton />
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <BottomNav />
    </div>
  );
}
