"use client";

import type { ReactNode } from "react";

import { RedirectToHomeIfAuthenticated } from "@/components/common/auth/RedirectToHomeIfAuthenticated";
import { AuthCardWrapper } from "@/components/common/auth/AuthCardWrapper";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthCardWrapper>
      <RedirectToHomeIfAuthenticated />
      {children}
    </AuthCardWrapper>
  );
}
