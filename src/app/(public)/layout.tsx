import { GLCanvas } from "@/components/gl/GLCanvas";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";
import { ScrollProgress } from "@/components/ui/ScrollProgress";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GLCanvas>
      <ScrollProgress />
      <MenuButton />
      <InkSeal />
      {children}
    </GLCanvas>
  );
}
