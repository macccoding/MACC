import { InkWashBackground } from "@/components/ink/InkWashBackground";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <InkWashBackground />
      <MenuButton />
      <InkSeal />
      {children}
    </>
  );
}
