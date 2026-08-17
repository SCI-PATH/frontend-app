import { SignupForm } from "@/components/common/auth/SignupForm";

export const metadata = {
  title: "Register | SCI-PATH",
  description: "Create a SCI-PATH student or educator account.",
};

export default function RegisterPage() {
  return <SignupForm />;
}
