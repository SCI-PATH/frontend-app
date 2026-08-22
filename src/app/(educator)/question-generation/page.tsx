import { redirect } from "next/navigation";

import { EDUCATOR_QUESTION_GENERATION_PATH } from "@/lib/auth-routes";

/** Legacy URL — question bank lives under assessment routes. */
export default function QuestionGenerationPage() {
  redirect(EDUCATOR_QUESTION_GENERATION_PATH);
}
