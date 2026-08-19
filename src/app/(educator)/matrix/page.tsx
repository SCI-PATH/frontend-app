import { redirect } from "next/navigation";

import { EDUCATOR_DASHBOARD_PATH } from "@/lib/auth-routes";

/** Legacy URL — educator dashboard moved to `/educator-analytics`. */
export default function EducatorMatrixRedirectPage() {
  redirect(EDUCATOR_DASHBOARD_PATH);
}
