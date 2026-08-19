import { redirect } from "next/navigation";

import { EDUCATOR_CLASSROOMS_PATH } from "@/lib/auth-routes";

/** Legacy URL — classroom management now lives at `/classrooms`. */
export default function EducatorClassroomRedirectPage() {
  redirect(EDUCATOR_CLASSROOMS_PATH);
}
