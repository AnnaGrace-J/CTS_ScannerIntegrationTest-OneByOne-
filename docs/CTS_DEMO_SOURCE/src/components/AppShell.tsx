import type { ReactNode } from "react";
import { AppShellV2 } from "../layouts/AppShellV2";

export function AppShell({ children }: { children: ReactNode }) {
  return <AppShellV2>{children}</AppShellV2>;
}
