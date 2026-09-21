import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getCoreValueById } from "@/lib/about";
import { ValueForm } from "../../../AboutForms";

export const metadata = {
  title: "Edit Core Value | Dashboard",
};

export default async function EditValuePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    redirect("/dashboard/about");
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const value = await getCoreValueById(numericId);
  if (!value) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center gap-4">
        <span className="text-sm font-semibold uppercase tracking-widest text-cyan-400">
          Admin
        </span>
        <div className="section-bar" />
      </div>

      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100 sm:text-3xl">
          Edit <span className="gradient-text">Core Value</span>
        </h2>
        <Link
          href="/dashboard/about"
          className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
        >
          ← Back to About
        </Link>
      </div>

      <div className="glass rounded-2xl p-6 sm:p-8">
        <ValueForm
          mode="edit"
          values={{
            id: value.id,
            icon: value.icon,
            title: value.title,
            description: value.description,
            sort_order: value.sort_order,
          }}
        />
      </div>
    </div>
  );
}
