import { getPosAppPublicUrl } from "@/lib/pos-app-url";
import { getMailDeliveryStatus } from "@/lib/mail";
import { getPosSystemUsers } from "@/lib/pos-users";
import { PosClientsWorkspace } from "@/components/ops/pos-clients-workspace";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const result = await getPosSystemUsers();

  return (
    <PosClientsWorkspace
      result={result}
      posAppUrl={getPosAppPublicUrl()}
      mailDelivery={getMailDeliveryStatus()}
      searchParams={sp}
    />
  );
}
