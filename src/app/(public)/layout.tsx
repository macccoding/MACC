import { GLCanvas } from "@/components/gl/GLCanvas";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GLCanvas>
      <MenuButton />
      <InkSeal />
      {children}
    </GLCanvas>
  );
}
