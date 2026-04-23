import { getPosAppPublicUrl } from "@/lib/pos-app-url";
import { getMailDeliveryStatus } from "@/lib/mail";
import { getPosApiBaseUrl } from "@/lib/pos-api";
import { getPosSystemUsers } from "@/lib/pos-users";
import { PosClientsWorkspace } from "@/components/ops/pos-clients-workspace";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const result = await getPosSystemUsers();

  const hasServiceKey = Boolean(process.env.POS_SERVICE_KEY?.trim());
  const hasDbUrl = Boolean(process.env.POS_DATABASE_URL?.trim());

  return (
    <PosClientsWorkspace
      result={result}
      posApiBase={getPosApiBaseUrl()}
      hasServiceKey={hasServiceKey}
      hasDbUrl={hasDbUrl}
      posAppUrl={getPosAppPublicUrl()}
      mailDelivery={getMailDeliveryStatus()}
      searchParams={sp}
    />
  );
}
