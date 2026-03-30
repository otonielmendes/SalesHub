const SLACK_TIMEOUT_MS = 5_000;

export type PendingSignupSlackPayload = {
  webhookUrl: string | undefined;
  name: string;
  email: string;
  adminUsersUrl: string;
};

/**
 * Fire-and-forget Slack notification for a new pending user signup.
 * Never throws; logs errors. No-op if webhookUrl is missing.
 */
export async function notifySlackPendingSignup({
  webhookUrl,
  name,
  email,
  adminUsersUrl,
}: PendingSignupSlackPayload): Promise<void> {
  if (!webhookUrl?.trim()) {
    return;
  }

  const text = `Novo pedido de acesso — Sales Hub: *${escapeSlackText(name)}* (${escapeSlackText(email)})`;
  const link = slackMrkdwnLink(adminUsersUrl, "Abrir gestão de utilizadores");

  const body = {
    text,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Novo pedido de acesso* — Koin Sales Hub\n*Nome:* ${escapeSlackText(name)}\n*Email:* ${escapeSlackText(email)}\n${link}`,
        },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(SLACK_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.error("[slack-signup] Webhook returned", res.status, await res.text().catch(() => ""));
    }
  } catch (e) {
    console.error("[slack-signup] Failed to notify Slack:", e);
  }
}

function escapeSlackText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Slack mrkdwn URL link: <url|label> — escape | in label */
function slackMrkdwnLink(url: string, label: string): string {
  const safeLabel = label.replace(/\|/g, "│");
  return `<${url}|${safeLabel}>`;
}
