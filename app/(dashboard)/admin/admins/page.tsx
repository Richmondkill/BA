import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import CreateAdminButton from "./CreateAdminButton";
import AdminActions from "./AdminActions";

export default async function AdminsPage() {
  await requireRole("SUPER_ADMIN");

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
    include: { _count: { select: { createdUsers: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-title-sm font-bold text-gray-800 dark:text-white/90">
            Admins
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {admins.length} admin{admins.length === 1 ? "" : "s"}
          </p>
        </div>
        <CreateAdminButton />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-200 dark:border-gray-800">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Admin
                </TableCell>
                <TableCell isHeader className="px-5 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  Users created
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
              {admins.length === 0 && (
                <TableRow>
                  <TableCell className="px-5 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                    No admins yet.
                  </TableCell>
                </TableRow>
              )}
              {admins.map((a) => (
                <TableRow
                  key={a.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-800"
                >
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/10 text-sm font-semibold text-brand-500">
                        {a.name.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                          {a.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {a.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {a._count.createdUsers}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    {a.status === "ACTIVE" ? (
                      <Badge color="success">Active</Badge>
                    ) : (
                      <Badge color="light">Suspended</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-4 text-right">
                    <AdminActions
                      admin={{
                        id: a.id,
                        name: a.name,
                        email: a.email,
                        status: a.status,
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
