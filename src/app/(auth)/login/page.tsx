import { LoginForm } from "@/components/common/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm registrationComplete={params.registered === "1"} />;
}
