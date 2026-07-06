export { auth as proxy } from "@/lib/auth-edge";

export const config = {
  matcher: ["/admin/:path*", "/client/:path*"],
};
