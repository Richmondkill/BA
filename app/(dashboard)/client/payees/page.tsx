import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";

export default async function ClientPayeesPage() {
  const session = await requireRole("CLIENT");
  const payees = await prisma.payee.findMany({
    where: { clientId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
        Beneficiaries
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        People and accounts you can pay. These are set up by your administrator.
      </p>

      {payees.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400">
          No beneficiaries assigned yet. Please contact support.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {payees.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                  {p.name.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                    {p.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {p.bankName} · {p.accountNumber}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
