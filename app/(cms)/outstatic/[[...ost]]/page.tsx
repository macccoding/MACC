import { Outstatic } from "outstatic";
import { OstClient } from "outstatic/client";

export default async function OutstaticPage(props: {
  params: Promise<{ ost: string[] }>;
}) {
  const params = await props.params;
  const ostData = await Outstatic();
  return <OstClient ostData={ostData} params={params} />;
}
