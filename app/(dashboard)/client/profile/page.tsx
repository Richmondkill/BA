import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import {
  ProfileMetaCard,
  ProfileInfoCard,
  ProfileAddressCard,
  ChangePasswordCard,
  type Profile,
} from "./ProfileCards";

export default async function ClientProfilePage() {
  const session = await requireRole("CLIENT");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Profile not found.
      </p>
    );
  }

  // Split existing name into first/last as a fallback when not set yet.
  const [fallbackFirst, ...restName] = (user.name ?? "").split(" ");
  const fallbackLast = restName.join(" ");

  const profile: Profile = {
    name: user.name ?? "",
    firstName: user.firstName ?? fallbackFirst ?? "",
    lastName: user.lastName ?? fallbackLast ?? "",
    email: user.email,
    phone: user.phone ?? "",
    bio: user.bio ?? "",
    country: user.country ?? "",
    cityState: user.cityState ?? "",
    postalCode: user.postalCode ?? "",
    taxId: user.taxId ?? "",
    facebook: user.facebook ?? "",
    twitter: user.twitter ?? "",
    linkedin: user.linkedin ?? "",
    instagram: user.instagram ?? "",
  };

  return (
    <div>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] lg:p-6">
        <h3 className="mb-5 text-lg font-semibold text-gray-800 dark:text-white/90 lg:mb-7">
          Profile
        </h3>
        <div className="space-y-6">
          <ProfileMetaCard profile={profile} />
          <ProfileInfoCard profile={profile} />
          <ProfileAddressCard profile={profile} />
          <ChangePasswordCard />
        </div>
      </div>
    </div>
  );
}
