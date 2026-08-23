import { redirect } from "next/navigation";

import { BASE_PATH } from "@/lib/auth-routes";

/** Unknown routes send visitors back to the public landing page. */
export default function NotFound() {
  redirect(BASE_PATH);
}
