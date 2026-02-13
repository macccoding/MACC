import { getAboutImages } from "@/lib/about-cms";
import AboutClient from "./AboutClient";

export default function AboutPage() {
  const { portrait } = getAboutImages();
  return <AboutClient portrait={portrait} />;
}
