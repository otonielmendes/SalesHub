"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import QRCode from "qrcode";
import {
  Check,
  Copy01,
  HomeLine,
  Inbox01,
  Link01,
  Mail01,
  Phone01,
  Printer,
  QrCode01,
  RefreshCw01,
  Send03,
  UserCheck01,
  XClose,
} from "@untitledui/icons";
import { Dialog, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { createClient } from "@/lib/supabase/client";
import { cx } from "@/utils/cx";

type PageState = "idle" | "submitting" | "ready" | "error";
type ShareChannel = "whatsapp" | "email" | "qr" | "copy";
type ShareModal = "whatsapp" | "email" | "qr" | null;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.118 1.525 5.847L.057 23.428a.5.5 0 0 0 .515.572l5.736-1.505A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0Zm0 22c-1.907 0-3.698-.512-5.24-1.407l-.375-.223-3.882 1.018 1.035-3.79-.244-.389A9.946 9.946 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10Z" />
    </svg>
  );
}

function formatPhoneForWhatsApp(value: string) {
  return value.replace(/\D/g, "");
}

function StepCard({
  title,
  description,
  meta,
  progress,
  state,
  icon,
}: {
  title: string;
  description: string;
  meta: string;
  progress: number;
  state: "active" | "complete" | "pending";
  icon: ReactNode;
}) {
  const complete = state === "complete";
  const active = state === "active";

  return (
    <div
      className={cx(
        "rounded-2xl border bg-white p-4 transition-colors",
        complete ? "border-[#0C8525] bg-[#E4FBE9]" : active ? "border-[#10B132] bg-[#F6FEF9]" : "border-[#D0D5D7]",
      )}
    >
      <div className="flex items-start gap-4">
        <div
          className={cx(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
            complete ? "bg-[#0C8525] text-white" : active ? "bg-[#E4FBE9] text-[#0C8525] ring-1 ring-inset ring-[#10B132]" : "bg-[#F2F4F6] text-[#344043]",
          )}
        >
          {complete ? <Check className="h-5 w-5" /> : icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-primary">{title}</h2>
              <p className="mt-1 text-sm leading-5 text-tertiary">{description}</p>
            </div>
            <span
              className={cx(
                "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border",
                complete ? "border-[#0C8525] bg-[#0C8525] text-white" : "border-[#D0D5D7] bg-white text-transparent",
              )}
            >
              <Check className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 text-xs text-secondary">
            <span>{meta}</span>
            <span>{progress}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F2F4F6]">
            <div className="h-full rounded-full bg-[#10B132] transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelCard({
  value,
  selected,
  onSelect,
  icon,
  title,
  description,
}: {
  value: ShareChannel;
  selected: boolean;
  onSelect: (value: ShareChannel) => void;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cx(
        "flex min-h-24 items-start gap-3 rounded-lg border bg-white p-4 text-left transition-colors",
        selected ? "border-[#12B76A] bg-[#F6FEF9] ring-1 ring-[#12B76A]" : "border-[#D0D5DD] hover:border-[#98A2B3]",
      )}
    >
      <span
        className={cx(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          selected ? "bg-[#ECFDF3] text-[#0C8525]" : "bg-[#F2F4F7] text-[#475456]",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-primary">{title}</span>
        <span className="mt-1 block text-sm leading-5 text-tertiary">{description}</span>
      </span>
    </button>
  );
}

function SectionHeader({ title, badge }: { title: string; badge: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[#EAECEE] px-6 py-6">
      <h2 className="text-sm font-bold text-[#475456]">{title}</h2>
      <span className="shrink-0 rounded-md bg-[#F8F9FC] px-2 py-0.5 text-xs font-medium text-[#363F72]">{badge}</span>
    </div>
  );
}

function ShareModalContent({
  modal,
  shareLink,
  qrDataUrl,
  whatsappUrl,
  gmailUrl,
  emailBody,
  onClose,
  onCopy,
  copied,
}: {
  modal: ShareModal;
  shareLink: string;
  qrDataUrl: string;
  whatsappUrl: string;
  gmailUrl: string;
  emailBody: string;
  onClose: () => void;
  onCopy: () => void;
  copied: boolean;
}) {
  const t = useTranslations("demos.nova");

  if (!modal) return null;

  const title = modal === "whatsapp" ? t("modal.whatsappTitle") : modal === "email" ? t("modal.emailTitle") : t("modal.qrTitle");
  const description = modal === "whatsapp" ? t("modal.whatsappDesc") : modal === "email" ? t("modal.emailDesc") : t("modal.qrDesc");

  return (
    <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-[#D0D5DD]">
      <div className="flex items-start justify-between gap-4 border-b border-[#EAECF0] px-6 py-5">
        <div>
          <h3 className="text-lg font-semibold text-primary">{title}</h3>
          <p className="mt-1 text-sm leading-6 text-tertiary">{description}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-tertiary transition-colors hover:bg-[#F2F4F7] hover:text-primary"
          aria-label={t("modal.close")}
        >
          <XClose className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-5 px-6 py-5">
        {modal === "qr" ? (
          <div className="flex flex-col items-center rounded-lg border border-[#E4E7EC] bg-[#F9FAFB] p-5">
            {qrDataUrl ? <img src={qrDataUrl} alt={t("modal.qrAlt")} className="h-56 w-56 rounded-lg bg-white p-2" /> : null}
            <p className="mt-4 max-w-sm text-center text-sm leading-5 text-tertiary">{t("modal.qrHelper")}</p>
          </div>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary">{t("modal.messageLabel")}</label>
            <textarea
              readOnly
              value={emailBody}
              className="min-h-36 w-full resize-none rounded-lg border border-secondary bg-[#F9FAFB] px-3.5 py-3 text-sm leading-6 text-primary focus:outline-none"
            />
          </div>
        )}

        <div className="rounded-lg border border-[#E4E7EC] bg-white px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tertiary">{t("linkTitle")}</p>
          <p className="mt-1 truncate font-mono text-sm text-primary">{shareLink}</p>
        </div>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-[#EAECF0] px-6 py-4 sm:flex-row sm:justify-end">
        <Button type="button" color="tertiary" className="ring-1 ring-secondary ring-inset" onClick={onCopy} iconLeading={Copy01}>
          {copied ? t("copied") : t("copyLink")}
        </Button>
        {modal === "whatsapp" ? (
          <Button href={whatsappUrl} target="_blank" iconLeading={Send03}>
            {t("modal.openWhatsApp")}
          </Button>
        ) : modal === "email" ? (
          <Button href={gmailUrl} target="_blank" iconLeading={Mail01}>
            {t("modal.openGmail")}
          </Button>
        ) : (
          <Button type="button" onClick={() => window.print()} iconLeading={Printer}>
            {t("modal.print")}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function NovaDemoPage() {
  const t = useTranslations("demos.nova");
  const tc = useTranslations("demos.common");
  const [state, setState] = useState<PageState>("idle");
  const [prospectName, setProspectName] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<ShareChannel>("whatsapp");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [emailTo, setEmailTo] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [activeModal, setActiveModal] = useState<ShareModal>(null);
  const [qrDataUrl, setQrDataUrl] = useState("");

  const isReady = state === "ready" && Boolean(shareLink);
  const isSubmitting = state === "submitting";
  const phoneDigits = formatPhoneForWhatsApp(whatsappPhone);
  const channelDetailComplete =
    selectedChannel === "whatsapp" ? phoneDigits.length >= 10 : selectedChannel === "email" ? emailTo.trim().length > 3 : true;
  const canGenerate = channelDetailComplete && !isSubmitting;

  const shareMessage = useMemo(() => t("share.whatsapp", { link: shareLink || t("linkPlaceholder") }), [shareLink, t]);
  const emailSubject = useMemo(() => t("share.emailSubject"), [t]);
  const emailBody = useMemo(() => t("share.emailBody", { link: shareLink || t("linkPlaceholder") }), [shareLink, t]);
  const whatsappUrl = useMemo(() => {
    const text = encodeURIComponent(shareMessage);
    return phoneDigits ? `https://wa.me/${phoneDigits}?text=${text}` : `https://wa.me/?text=${text}`;
  }, [phoneDigits, shareMessage]);
  const gmailUrl = useMemo(() => {
    const params = new URLSearchParams({
      view: "cm",
      fs: "1",
      to: emailTo.trim(),
      su: emailSubject,
      body: emailBody,
    });
    return `https://mail.google.com/mail/?${params.toString()}`;
  }, [emailBody, emailSubject, emailTo]);

  async function buildQrCode(link: string) {
    const dataUrl = await QRCode.toDataURL(link, {
      margin: 1,
      width: 320,
      color: {
        dark: "#101828",
        light: "#FFFFFF",
      },
    });
    setQrDataUrl(dataUrl);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canGenerate) return;

    setState("submitting");
    setErrorMsg("");
    setCopied(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setErrorMsg(t("errors.expiredSession"));
        setState("error");
        return;
      }

      const { data, error } = await supabase
        .from("demo_sessions")
        .insert({
          user_id: user.id,
          prospect_name: prospectName.trim() || null,
          status: "pending",
        })
        .select("id, share_token")
        .single();

      if (error || !data) {
        setErrorMsg(error?.message ?? t("errors.create"));
        setState("error");
        return;
      }

      const link = `${window.location.origin}/demo/${data.share_token}`;
      setShareLink(link);
      setSessionId(data.id);
      await buildQrCode(link);
      setState("ready");

      if (selectedChannel === "whatsapp" || selectedChannel === "email" || selectedChannel === "qr") {
        setActiveModal(selectedChannel);
      }
      if (selectedChannel === "copy") {
        await navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : t("errors.unexpected"));
      setState("error");
    }
  }

  async function handleCopy() {
    if (!shareLink) return;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function resetForm() {
    setState("idle");
    setProspectName("");
    setWhatsappPhone("");
    setEmailTo("");
    setShareLink("");
    setSessionId("");
    setQrDataUrl("");
    setErrorMsg("");
    setCopied(false);
    setActiveModal(null);
  }

  const identificationComplete = prospectName.trim().length > 0;
  const linkComplete = isReady;
  const captureProgress = isReady ? 50 : 0;

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-10 flex flex-wrap items-center gap-3 text-sm text-[#475456]">
        <Link href="/demos/device-fingerprinting/historico" className="rounded-lg p-1 transition-colors hover:bg-[#EAECEE]" aria-label={tc("homeAria")}>
          <HomeLine className="h-5 w-5" />
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <Link href="/demos/device-fingerprinting/historico" className="rounded-lg px-2 py-1 font-medium transition-colors hover:bg-[#EAECEE]">
          {tc("deviceFingerprinting")}
        </Link>
        <span className="text-[#D0D5D7]">/</span>
        <span className="rounded-lg px-2 py-1 font-semibold text-[#0C8525]">{t("breadcrumb")}</span>
      </nav>

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#10181B]">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-base leading-6 text-[#475456]">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
        <div className="min-w-0 space-y-6">
          <section className="overflow-visible rounded-2xl border border-[#D0D5D7] bg-white">
            <SectionHeader title={t("identificationTitle")} badge={t("optionalBadge")} />

            <div className="px-6 py-6">
              <label htmlFor="prospect" className="mb-1.5 block text-sm font-medium text-secondary">
                {t("captureNameLabel")} <span className="text-tertiary">{t("optional")}</span>
              </label>
              <input
                id="prospect"
                type="text"
                value={prospectName}
                onChange={(e) => setProspectName(e.target.value)}
                placeholder={t("captureNamePlaceholder")}
                className="h-11 w-full rounded-lg border border-secondary bg-primary px-3.5 py-2.5 text-sm text-primary placeholder:text-tertiary focus:border-[#0C8525] focus:outline-none focus:ring-2 focus:ring-[#0C8525]/20"
                disabled={isSubmitting || isReady}
              />
            </div>
          </section>

          <section className="overflow-visible rounded-2xl border border-[#D0D5D7] bg-white">
            <SectionHeader title={t("sharingTitle")} badge={t("required")} />

            <div className="space-y-6 px-6 py-6">
              <div className="grid gap-3 sm:grid-cols-2">
                <ChannelCard
                  value="whatsapp"
                  selected={selectedChannel === "whatsapp"}
                  onSelect={setSelectedChannel}
                  icon={<WhatsAppIcon className="h-5 w-5" />}
                  title={t("shareChannels.whatsapp.title")}
                  description={t("shareChannels.whatsapp.desc")}
                />
                <ChannelCard
                  value="email"
                  selected={selectedChannel === "email"}
                  onSelect={setSelectedChannel}
                  icon={<Mail01 className="h-5 w-5" />}
                  title={t("shareChannels.email.title")}
                  description={t("shareChannels.email.desc")}
                />
                <ChannelCard
                  value="qr"
                  selected={selectedChannel === "qr"}
                  onSelect={setSelectedChannel}
                  icon={<QrCode01 className="h-5 w-5" />}
                  title={t("shareChannels.qr.title")}
                  description={t("shareChannels.qr.desc")}
                />
                <ChannelCard
                  value="copy"
                  selected={selectedChannel === "copy"}
                  onSelect={setSelectedChannel}
                  icon={<Copy01 className="h-5 w-5" />}
                  title={t("shareChannels.copy.title")}
                  description={t("shareChannels.copy.desc")}
                />
              </div>

              {selectedChannel === "whatsapp" ? (
                <div>
                  <label htmlFor="whatsappPhone" className="mb-1.5 block text-sm font-medium text-secondary">
                    {t("whatsappPhoneLabel")}
                  </label>
                  <div className="relative">
                    <Phone01 className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-tertiary" />
                    <input
                      id="whatsappPhone"
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder={t("whatsappPhonePlaceholder")}
                      className="h-11 w-full rounded-lg border border-secondary bg-primary pr-3.5 pl-11 text-sm text-primary placeholder:text-tertiary focus:border-[#0C8525] focus:outline-none focus:ring-2 focus:ring-[#0C8525]/20"
                      disabled={isSubmitting || isReady}
                    />
                  </div>
                </div>
              ) : null}

              {selectedChannel === "email" ? (
                <div>
                  <label htmlFor="emailTo" className="mb-1.5 block text-sm font-medium text-secondary">
                    {t("emailToLabel")}
                  </label>
                  <div className="relative">
                    <Mail01 className="pointer-events-none absolute top-1/2 left-3.5 h-5 w-5 -translate-y-1/2 text-tertiary" />
                    <input
                      id="emailTo"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder={t("emailToPlaceholder")}
                      className="h-11 w-full rounded-lg border border-secondary bg-primary pr-3.5 pl-11 text-sm text-primary placeholder:text-tertiary focus:border-[#0C8525] focus:outline-none focus:ring-2 focus:ring-[#0C8525]/20"
                      disabled={isSubmitting || isReady}
                    />
                  </div>
                </div>
              ) : null}

              {state === "error" ? (
                <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-800">{errorMsg}</div>
              ) : null}

              {!isReady ? (
                <div className="border-t border-[#EAECF0] pt-6">
                  <Button type="submit" size="md" className="w-full" isLoading={isSubmitting} showTextWhileLoading isDisabled={!canGenerate}>
                    {isSubmitting ? t("generating") : t("generate")}
                  </Button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="overflow-visible rounded-2xl border border-[#D0D5D7] bg-white">
            <SectionHeader title={t("linkTitle")} badge={isReady ? t("readyTitle") : t("required")} />

            <div className="px-6 py-6">
              <div className={cx("rounded-lg border px-4 py-3", isReady ? "border-[#ABEFC6] bg-[#F6FEF9]" : "border-[#E4E7EC] bg-[#F9FAFB]")}>
                <div className="flex min-w-0 items-center gap-3">
                  <Link01 className={cx("h-5 w-5 shrink-0", isReady ? "text-[#0C8525]" : "text-tertiary")} />
                  <span className={cx("min-w-0 flex-1 truncate font-mono text-sm", isReady ? "text-primary" : "text-tertiary")}>
                    {shareLink || t("linkPlaceholder")}
                  </span>
                  <Button
                    type="button"
                    color="tertiary"
                    size="sm"
                    className="ring-1 ring-secondary ring-inset"
                    iconLeading={Copy01}
                    onClick={handleCopy}
                    isDisabled={!isReady}
                  >
                    {copied ? t("copied") : t("copy")}
                  </Button>
                </div>
              </div>

              {prospectName.trim() || isReady ? (
                <div className="mt-4 rounded-lg border border-[#E4E7EC] bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-tertiary">{t("captureNameShort")}</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{prospectName.trim() || tc("fallbackUnnamedSession")}</p>
                </div>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setActiveModal("whatsapp")}
                  disabled={!isReady}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-3.5 py-2.5 text-sm font-semibold text-white shadow-xs transition-colors hover:bg-[#16A34A] disabled:cursor-not-allowed disabled:bg-disabled disabled:text-fg-disabled"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  {t("shareWhatsApp")}
                </button>
                <Button
                  type="button"
                  onClick={() => setActiveModal("email")}
                  color="tertiary"
                  size="md"
                  className="w-full ring-1 ring-secondary ring-inset"
                  iconLeading={Mail01}
                  isDisabled={!isReady}
                >
                  {t("shareEmail")}
                </Button>
                <Button
                  type="button"
                  onClick={() => setActiveModal("qr")}
                  color="tertiary"
                  size="md"
                  className="w-full ring-1 ring-secondary ring-inset"
                  iconLeading={QrCode01}
                  isDisabled={!isReady}
                >
                  {t("shareQr")}
                </Button>
                <Button
                  type="button"
                  onClick={handleCopy}
                  color="tertiary"
                  size="md"
                  className="w-full ring-1 ring-secondary ring-inset"
                  iconLeading={Copy01}
                  isDisabled={!isReady}
                >
                  {copied ? t("copied") : t("copy")}
                </Button>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-[#EAECF0] pt-6 sm:flex-row lg:hidden">
                <Button href={sessionId ? `/demos/device-fingerprinting/${sessionId}` : undefined} isDisabled={!isReady} size="md" className="flex-1">
                  {t("openSession")}
                </Button>
                <Button
                  type="button"
                  onClick={resetForm}
                  isDisabled={!isReady}
                  color="tertiary"
                  size="md"
                  className="flex-1 ring-1 ring-secondary ring-inset"
                  iconLeading={RefreshCw01}
                >
                  {t("newDemo")}
                </Button>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="space-y-4">
            <StepCard
              title={t("steps.identification.title")}
              description={identificationComplete ? t("steps.identification.complete") : t("steps.identification.desc")}
              meta={identificationComplete ? t("steps.oneOfOne") : t("steps.optional")}
              progress={identificationComplete ? 100 : 0}
              state={identificationComplete ? "complete" : "active"}
              icon={<UserCheck01 className="h-5 w-5" />}
            />
            <StepCard
              title={t("steps.sharing.title")}
              description={channelDetailComplete ? t("steps.sharing.complete") : t("steps.sharing.desc")}
              meta={channelDetailComplete ? t("steps.twoOfTwo") : t("steps.oneOfTwo")}
              progress={channelDetailComplete ? 100 : 50}
              state={channelDetailComplete ? "complete" : "active"}
              icon={<Send03 className="h-5 w-5" />}
            />
            <StepCard
              title={t("steps.link.title")}
              description={linkComplete ? t("steps.link.complete") : t("steps.link.desc")}
              meta={linkComplete ? t("steps.oneOfOne") : t("steps.zeroOfOne")}
              progress={linkComplete ? 100 : 0}
              state={linkComplete ? "complete" : "pending"}
              icon={<Link01 className="h-5 w-5" />}
            />
            <StepCard
              title={t("steps.capture.title")}
              description={isReady ? t("steps.capture.waiting") : t("steps.capture.desc")}
              meta={isReady ? t("steps.waitingClient") : t("steps.blocked")}
              progress={captureProgress}
              state={isReady ? "active" : "pending"}
              icon={<Inbox01 className="h-5 w-5" />}
            />

            <div className="rounded-xl border border-[#D0D5DD] bg-white p-4 shadow-xs">
              <Button href={sessionId ? `/demos/device-fingerprinting/${sessionId}` : undefined} isDisabled={!isReady} size="lg" className="w-full">
                {t("openSession")}
              </Button>
              <Button
                type="button"
                color="tertiary"
                size="lg"
                className="mt-3 w-full ring-1 ring-secondary ring-inset"
                iconLeading={RefreshCw01}
                onClick={resetForm}
                isDisabled={!isReady}
              >
                {t("newDemo")}
              </Button>
            </div>
          </div>
        </aside>
      </form>

      <ModalOverlay isOpen={activeModal !== null} onOpenChange={(open) => !open && setActiveModal(null)} isDismissable>
        <Modal className="w-full max-w-xl">
          <Dialog className="mx-auto w-full">
            <ShareModalContent
              modal={activeModal}
              shareLink={shareLink}
              qrDataUrl={qrDataUrl}
              whatsappUrl={whatsappUrl}
              gmailUrl={gmailUrl}
              emailBody={activeModal === "whatsapp" ? shareMessage : emailBody}
              onClose={() => setActiveModal(null)}
              onCopy={() => void handleCopy()}
              copied={copied}
            />
          </Dialog>
        </Modal>
      </ModalOverlay>
    </div>
  );
}
