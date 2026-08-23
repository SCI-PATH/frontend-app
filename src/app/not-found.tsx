import { NotFoundRedirect } from "@/components/common/NotFoundRedirect";

/** Unknown routes — client redirect to landing (avoids dev performance.measure bug). */
export default function NotFound() {
  return <NotFoundRedirect />;
}
