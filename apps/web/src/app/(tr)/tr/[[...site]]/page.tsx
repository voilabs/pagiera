import { MarketingPage, marketingMetadata } from "@/components/pages/router";

type Props = { params: Promise<{ site?: string[] }> };
const pathOf = async (params: Props["params"]) =>
  `/${((await params).site ?? []).join("/")}`;

export async function generateMetadata({ params }: Props) {
  return marketingMetadata(await pathOf(params), "tr");
}
export default async function Page({ params }: Props) {
  return <MarketingPage path={await pathOf(params)} locale="tr" />;
}
