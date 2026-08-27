import { LoginForm } from "@/components/common/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string; email?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      registrationComplete={params.registered === "1"}
      initialEmail={params.email?.trim() || ""}
    />
  );
}
