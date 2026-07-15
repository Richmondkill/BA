import type { Role } from "@/generated/prisma/client";
import {
  GridIcon,
  GroupIcon,
  ListIcon,
  PaperPlaneIcon,
  UserCircleIcon,
  UserIcon,
  DownloadIcon,
} from "@/icons";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

export function navForRole(role: Role): NavItem[] {
  if (role === "CLIENT") {
    return [
      { label: "Dashboard", href: "/client", icon: <GridIcon /> },
      { label: "Transfer", href: "/client/transfer", icon: <PaperPlaneIcon /> },
      { label: "Beneficiaries", href: "/client/payees", icon: <GroupIcon /> },
      { label: "Transactions", href: "/client/transactions", icon: <ListIcon /> },
      { label: "Profile", href: "/client/profile", icon: <UserIcon /> },
    ];
  }

  // ADMIN + SUPER_ADMIN
  const items: NavItem[] = [
    { label: "Overview", href: "/admin", icon: <GridIcon /> },
    { label: "Clients", href: "/admin/clients", icon: <GroupIcon /> },
    { label: "Beneficiaries", href: "/admin/beneficiaries", icon: <UserIcon /> },
    { label: "Withdrawals", href: "/admin/withdrawals", icon: <DownloadIcon /> },
    { label: "Transactions", href: "/admin/transactions", icon: <ListIcon /> },
  ];
  if (role === "SUPER_ADMIN") {
    items.push({
      label: "Admins",
      href: "/admin/admins",
      icon: <UserCircleIcon />,
    });
  }
  return items;
}
