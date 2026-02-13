"use client";

import dynamic from "next/dynamic";
import SmoothScroll from "./SmoothScroll";
import ScrollProgress from "./ScrollProgress";
import ScrollToTop from "./ScrollToTop";
import { ToastProvider } from "./Toast";

const CustomCursor = dynamic(() => import("./CustomCursor"), { ssr: false });
const IntroSequence = dynamic(() => import("./IntroSequence"), { ssr: false });
const CursorGlow = dynamic(() => import("./CursorGlow"), { ssr: false });
const TransitionOverlay = dynamic(() => import("./TransitionOverlay"), { ssr: false });

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <SmoothScroll>
        <IntroSequence />
        <TransitionOverlay />
        <ScrollProgress />
        <CustomCursor />
        <CursorGlow />
        {children}
        <ScrollToTop />
      </SmoothScroll>
    </ToastProvider>
  );
}
