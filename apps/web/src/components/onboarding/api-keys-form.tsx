"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Trash2 } from "lucide-react";
import {
  ipWhitelistEntrySchema,
  webhookConfigSchema,
  type IpWhitelistEntryInput,
  type WebhookConfigInput,
} from "@napayment/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { CopyField } from "@/components/ui/copy-field";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  useApiKeys,
  useAddIpWhitelist,
  useGenerateApiKey,
  useIpWhitelist,
  useRegenerateApiKey,
  useRemoveIpWhitelist,
} from "@/hooks/use-api-keys";
import { useSaveWebhookConfig, useWebhookConfig } from "@/hooks/use-onboarding";

export function ApiKeysForm({ showContinue = false }: { showContinue?: boolean }) {
  const router = useRouter();
  const { data: apiKeys } = useApiKeys();
  const generate = useGenerateApiKey();
  const regenerate = useRegenerateApiKey();
  const [revealedSecret, setRevealedSecret] = useState<{ publicKey: string; secretKey: string } | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const activeKey = apiKeys?.content.find((k) => k.status === "ACTIVE");

  const { data: whitelist } = useIpWhitelist();
  const addIp = useAddIpWhitelist();
  const removeIp = useRemoveIpWhitelist();
  const ipForm = useForm<IpWhitelistEntryInput>({ resolver: zodResolver(ipWhitelistEntrySchema) });

  const { data: webhookConfig } = useWebhookConfig(Boolean(activeKey));
  const saveWebhook = useSaveWebhookConfig();
  const webhookForm = useForm<WebhookConfigInput>({
    resolver: zodResolver(webhookConfigSchema),
    values: webhookConfig
      ? { callbackUrl: webhookConfig.callbackUrl ?? "", webhookUrl: webhookConfig.webhookUrl ?? "" }
      : undefined,
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>API keys</CardTitle>
          <CardDescription>
            Use these keys to securely connect your own systems to Nawill Pay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!activeKey ? (
            <Button
              onClick={() => generate.mutate(undefined, { onSuccess: (data) => setRevealedSecret(data) })}
              loading={generate.isPending}
            >
              Generate API key pair
            </Button>
          ) : (
            <>
              <div>
                <Label>Public key</Label>
                <CopyField value={activeKey.publicKey} />
              </div>
              <div>
                <Label>Secret key</Label>
                <CopyField value="sk_live_•••••••••••••••••••••••••••••••" mono />
                <p className="mt-1 text-xs text-navy-500">
                  Shown once, at generation. Lost it? Regenerate below — the old key stops working
                  immediately.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setConfirmRegenerate(true)}>
                Regenerate key pair
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {activeKey && (
        <Card>
          <CardHeader>
            <CardTitle>IP whitelist</CardTitle>
            <CardDescription>
              Restrict this key to specific IP addresses. Leave empty to allow requests from
              anywhere.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <form
              onSubmit={ipForm.handleSubmit((values) =>
                addIp.mutate(values.cidr, { onSuccess: () => ipForm.reset() }),
              )}
              className="flex items-start gap-2"
            >
              <div className="flex-1">
                <Input placeholder="192.168.1.0/24" {...ipForm.register("cidr")} />
                {ipForm.formState.errors.cidr && (
                  <p className="mt-1 text-xs text-danger">{ipForm.formState.errors.cidr.message}</p>
                )}
              </div>
              <Button type="submit" variant="outline" loading={addIp.isPending}>
                Add
              </Button>
            </form>
            <div className="space-y-2">
              {whitelist?.content.map((cidr) => (
                <div key={cidr} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <code className="text-sm text-navy-800">{cidr}</code>
                  <button onClick={() => removeIp.mutate(cidr)} className="text-navy-400 hover:text-danger">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
              {whitelist?.content.length === 0 && (
                <p className="text-xs text-navy-500">No restrictions — any source IP may use this key.</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Callback & webhook URLs</CardTitle>
          <CardDescription>
            {activeKey
              ? "Test mode configuration for your integration."
              : "Generate an API key above first — these URLs are attached to it."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={webhookForm.handleSubmit((values) => saveWebhook.mutate(values))}>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="callbackUrl">Test callback URL</Label>
              <Input
                id="callbackUrl"
                placeholder="https://example.com/callback"
                disabled={!activeKey}
                {...webhookForm.register("callbackUrl")}
              />
              {webhookForm.formState.errors.callbackUrl && (
                <p className="mt-1 text-xs text-danger">{webhookForm.formState.errors.callbackUrl.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="webhookUrl">Test webhook URL</Label>
              <Input
                id="webhookUrl"
                placeholder="https://example.com/webhooks/nawill"
                disabled={!activeKey}
                {...webhookForm.register("webhookUrl")}
              />
              {webhookForm.formState.errors.webhookUrl && (
                <p className="mt-1 text-xs text-danger">{webhookForm.formState.errors.webhookUrl.message}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="justify-between">
            <Button type="submit" variant="outline" disabled={!activeKey} loading={saveWebhook.isPending}>
              Save
            </Button>
            {showContinue && (
              <Button type="button" onClick={() => router.push("/onboarding/review")}>
                Continue
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>

      <Dialog open={Boolean(revealedSecret)} onOpenChange={(open) => !open && setRevealedSecret(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Your API key pair</DialogTitle>
            <DialogDescription>
              Copy your secret key now — it will not be shown again.
            </DialogDescription>
          </DialogHeader>
          {revealedSecret && (
            <div className="space-y-3">
              <div>
                <Label>Public key</Label>
                <CopyField value={revealedSecret.publicKey} />
              </div>
              <div>
                <Label>Secret key</Label>
                <CopyField value={revealedSecret.secretKey} />
              </div>
              <Alert variant="warning">Store this in a secure secrets manager, not in source control.</Alert>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setRevealedSecret(null)}>I&apos;ve saved it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmRegenerate} onOpenChange={setConfirmRegenerate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate API key pair?</DialogTitle>
            <DialogDescription>
              Your current key stops working immediately. Any live integration using it will
              break until updated.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegenerate(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              loading={regenerate.isPending}
              onClick={() =>
                regenerate.mutate(undefined, {
                  onSuccess: (data) => {
                    setConfirmRegenerate(false);
                    setRevealedSecret(data);
                  },
                })
              }
            >
              Regenerate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
