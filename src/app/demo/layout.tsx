import type { ReactNode } from "react";

// Layout mínimo para a página pública — sem header nem sidebar do Sales HUB
export default function DemoPublicLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
