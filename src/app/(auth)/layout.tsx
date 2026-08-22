import { AuthCardWrapper } from "@/components/common/auth/AuthCardWrapper";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthCardWrapper>{children}</AuthCardWrapper>;
}
