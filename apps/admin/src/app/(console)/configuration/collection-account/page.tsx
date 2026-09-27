import type { Metadata } from "next";
import { ApiError, ErrorCode } from "@napayment/api-client";
import { formatNaira, groupAccountNumber } from "@napayment/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@napayment/ui/card";
import { DetailList } from "@napayment/ui/detail-list";
import { CreateCollectionAccountForm } from "@/components/create-forms";
import { authedBackendClient } from "@/server/backend-client";

export const metadata: Metadata = { title: "Collection account — Napayment Admin" };

/** COLLECTION_ACCOUNT_NOT_FOUND just means "not set up yet". */
export default async function CollectionAccountPage() {
  const client = await authedBackendClient();
  const [account, banks] = await Promise.all([
    client.collectionAccount.get().catch((error) => {
      if (error instanceof ApiError && error.is(ErrorCode.COLLECTION_ACCOUNT_NOT_FOUND)) return null;
      throw error;
    }),
    client.referenceData.listBanks({ size: 500 }),
  ]);
  const bankName = (id: string) => banks.content.find((b) => b.id === id)?.name ?? "—";

  return (
    <div className="max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Collection account</CardTitle>
          <CardDescription>
            The platform account every collection is mirrored on. Its balance should always equal the sum of all
            wallets.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {account ? (
            <DetailList
              items={[
                ["Bank", bankName(account.bankId)],
                ["Account number", groupAccountNumber(account.accountNumber)],
                ["Account name", account.accountName],
                ["Balance", formatNaira(account.balance)],
              ]}
            />
          ) : (
            <CreateCollectionAccountForm />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
