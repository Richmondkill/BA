import Link from "next/link";
import { requireRole, clientScopeWhere } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import CreateClientButton from "./CreateClientButton";

export default async function ClientsPage() {
  const session = await requireRole("ADMIN", "SUPER_ADMIN");
  const clients = await prisma.user.findMany({
    where: clientScopeWhere(session.user),
    include: { wallet: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
            Clients
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clients.length} client{clients.length === 1 ? "" : "s"}
          </p>
        </div>
        <CreateClientButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Client
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Balance
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Transfers
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Status
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                  {" "}
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No clients yet. Create your first client to get started.
                  </TableCell>
                </TableRow>
              )}
              {clients.map((c) => {
                const w = c.wallet;
                const used = w ? `${w.transferCount}/${w.transferLimit}` : "—";
                const locked = w?.isLocked;
                return (
                  <TableRow
                    key={c.id}
                    className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                  >
                    <TableCell className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                          {c.name.slice(0, 1).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                            {c.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {c.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                      {w ? formatMoney(w.balance) : "—"}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {used}
                    </TableCell>
                    <TableCell className="px-5 py-4">
                      {locked ? (
                        <Badge color="error">Locked</Badge>
                      ) : (
                        <Badge color="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="text-sm font-medium text-brand-500 hover:text-brand-600"
                      >
                        Manage
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
