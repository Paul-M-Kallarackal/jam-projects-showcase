import { ShowcaseShell } from "@/components/showcase/showcase-shell";
import { getShowcaseData } from "@/lib/showcase-data";

export const revalidate = 300;

export default async function Home() {
  const showcaseData = await getShowcaseData();

  return <ShowcaseShell {...showcaseData} />;
}
