import Link from "next/link";
import { requireRole, clientScopeWhere } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  CreateBeneficiaryButton,
  AssignBeneficiaryButton,
  type ClientOption,
} from "../BeneficiaryModals";

export default async function AdminBeneficiariesPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");

  // Beneficiaries this admin can see: any belonging to a client they manage,
  // plus unassigned ones they created. SUPER_ADMIN sees everything.
  const where =
    session.user.role === "SUPER_ADMIN"
      ? {}
      : {
          OR: [
            { client: { createdById: session.user.id } },
            { clientId: null, createdById: session.user.id },
          ],
        };

  const [beneficiaries, clientRecords] = await Promise.all([
    prisma.payee.findMany({
      where,
      include: { client: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({
      where: clientScopeWhere(session.user),
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const clients: ClientOption[] = clientRecords;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-title-sm font-bold text-gray-800 dark:text-white/90">
            Beneficiaries
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Create beneficiaries and assign them to any client. Unassigned ones
            wait here until you hand them out.
          </p>
        </div>
        <CreateBeneficiaryButton clients={clients} triggerLabel="New beneficiary" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 dark:border-gray-800">
                <th className="px-5 py-3 font-medium">Beneficiary</th>
                <th className="px-5 py-3 font-medium">Bank details</th>
                <th className="px-5 py-3 font-medium">Assigned to</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {beneficiaries.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-gray-400">
                    No beneficiaries yet. Create one to get started.
                  </td>
                </tr>
              )}
              {beneficiaries.map((b) => (
                <tr
                  key={b.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">{b.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {b.bankName}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-mono">
                      {b.institutionNumber ?? "—"} · {b.transitNumber ?? "—"} · {b.accountNumber}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {b.client ? (
                      <Link
                        href={`/admin/clients/${b.client.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-brand-500 dark:text-white/90"
                      >
                        {b.client.name}
                      </Link>
                    ) : (
                      <span className="rounded-full bg-warning-50 px-2.5 py-0.5 text-xs font-medium text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {!b.client && clients.length > 0 && (
                      <AssignBeneficiaryButton payeeId={b.id} clients={clients} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
