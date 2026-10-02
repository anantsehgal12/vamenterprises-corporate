"use client";
import React from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  Mail, Calendar, LogOut, Settings, Phone, ShieldCheck, ShieldOff,
  KeyRound, AtSign, Fingerprint, Link2, BadgeCheck, Clock,
} from "lucide-react";

const display = "font-[family-name:var(--font-display)]";
const mono = "font-[family-name:var(--font-mono)]";

// Page background: green-to-pale radial wash, per brief.
const PAGE_BG =
  "bg-[radial-gradient(ellipse_200%_100%_at_bottom_left,#309107_10%,#EAEEFE_90%)]";

// Headline treatment: dark-to-green gradient clipped to text.
const GRADIENT_TEXT =
  "bg-gradient-to-b from-black to-[#254f13] bg-clip-text text-transparent";

// Panels sit on the light wash — glass, hairline edge.
const PANEL =
  "isolate rounded-3xl border border-black/10 bg-white/55 backdrop-blur-xl shadow-[0_8px_40px_-12px_rgba(24,60,10,0.25)] [-webkit-mask-image:-webkit-radial-gradient(white,black)]";

// Fine dot-grid texture used behind the hero, HUD-style.
const GRID_OVERLAY =
  "bg-[radial-gradient(circle,#0a2e02_1px,transparent_1px)] [background-size:26px_26px]";

// Corner-bracket frame — a device readout motif, wraps the portrait.
function BracketFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute -top-2.5 -left-2.5 h-6 w-6 border-t-2 border-l-2 border-[#143d05] rounded-tl-lg" />
      <span className="absolute -top-2.5 -right-2.5 h-6 w-6 border-t-2 border-r-2 border-[#143d05] rounded-tr-lg" />
      <span className="absolute -bottom-2.5 -left-2.5 h-6 w-6 border-b-2 border-l-2 border-[#143d05] rounded-bl-lg" />
      <span className="absolute -bottom-2.5 -right-2.5 h-6 w-6 border-b-2 border-r-2 border-[#143d05] rounded-br-lg" />
      {children}
    </div>
  );
}

// One free-standing readout tile — data floats around the portrait, not boxed together.
function DataCell({
  icon,
  label,
  value,
  badge,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className={`${PANEL} px-6 py-5 flex items-start gap-3.5 text-left`}>
      <div className="mt-0.5 text-[#309107]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={`${mono} text-[10px] tracking-[0.16em] text-black/45`}>{label}</p>
          {badge}
        </div>
        <p className="text-sm text-black/85 truncate mt-1">{value}</p>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();

  // ── Clerk data, surfaced ─────────────────────────────────────────
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const lastActive = user?.lastSignInAt
    ? new Date(user.lastSignInAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })
    : "—";

  const initials = `${user?.firstName?.[0] ?? ""}${user?.lastName?.[0] ?? ""}`.toUpperCase();

  const email = user?.primaryEmailAddress?.emailAddress ?? "—";
  const emailVerified = user?.primaryEmailAddress?.verification?.status === "verified";

  const phone = user?.primaryPhoneNumber?.phoneNumber ?? "Not added";
  const phoneVerified = user?.primaryPhoneNumber?.verification?.status === "verified";

  const username = user?.username ? `@${user.username}` : "Not set";

  const shortId = user?.id ? `${user.id.slice(0, 14)}…` : "—";

  const twoFactorEnabled = !!user?.twoFactorEnabled;
  const passwordEnabled = !!user?.passwordEnabled;

  const externalAccounts = user?.externalAccounts ?? [];

  const handleSignOut = () => signOut(() => router.push("/"));

  // ── guard: signed out ─────────────────────────────────────────────
  if (isLoaded && !isSignedIn) {
    return (
      <main className={`min-h-screen ${PAGE_BG}`}>
        <div className="flex items-center justify-center min-h-[70vh] px-6">
          <div className={`${PANEL} max-w-lg text-center px-10 py-12`}>
            <h1 className={`${display} ${GRADIENT_TEXT} text-2xl`}>
              Please sign in to view your account.
            </h1>
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="inline-flex mt-6 items-center gap-2 rounded-full border border-[#309107]/40 bg-[#309107]/10 text-[#1c4a08] hover:bg-[#309107]/20 text-sm uppercase tracking-[0.15em] px-6 py-2.5 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── loading ────────────────────────────────────────────────────────
  if (!isLoaded) {
    return (
      <main className={`min-h-screen ${PAGE_BG}`}>
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6">
          <div className="h-36 w-36 rounded-full bg-white/40 animate-pulse" />
          <div className={`${PANEL} h-8 w-56 animate-pulse`} />
        </div>
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${PAGE_BG}`}>
      <div className="relative isolate container mx-auto px-6 py-16 pb-28 md:pb-16 flex flex-col items-center">
        <div className={`pointer-events-none absolute inset-0 -z-10 opacity-[0.05] ${GRID_OVERLAY}`} />

        {/* ── Portrait, centered and oversized ── */}
        <BracketFrame>
          <div className="relative m-2 isolate">
            <div className="absolute inset-0 rounded-full bg-[#309107]/25 blur-2xl scale-110 will-change-transform" />
            {user?.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={user.fullName ?? "Profile photo"}
                width={168}
                height={168}
                className="relative h-[168px] w-[168px] rounded-full border border-black/10 object-cover"
              />
            ) : (
              <div className={`${display} relative h-[168px] w-[168px] rounded-full border border-black/10 bg-white/70 text-5xl ${GRADIENT_TEXT} flex items-center justify-center`}>
                {initials || "?"}
              </div>
            )}
          </div>
        </BracketFrame>

        {/* ── Name + live status ── */}
        <div className="relative mt-8 flex items-center gap-3">
          <h1 className={`${display} ${GRADIENT_TEXT} text-4xl md:text-5xl tracking-tight text-center`}>
            {user?.fullName ?? "Your Account"}
          </h1>
          <span className="relative isolate flex h-2.5 w-2.5 flex-shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#309107] opacity-60 will-change-transform" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#309107]" />
          </span>
        </div>

        <div className={`${mono} relative flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 mt-4 text-[11px] tracking-[0.12em] text-black/45`}>
          <span className="inline-flex items-center gap-1.5">
            <AtSign className="h-3 w-3" />
            {passwordEnabled ? "Set" : "Not set"}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fingerprint className="h-3 w-3" />
            {shortId}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="relative flex items-center gap-3 mt-8">
          <button
            onClick={() => openUserProfile()}
            className="inline-flex items-center gap-2 rounded-full border border-[#309107]/40 bg-[#309107]/10 text-[#1c4a08] hover:bg-[#309107]/20 text-xs md:text-sm uppercase tracking-[0.15em] px-6 py-2.5 backdrop-blur-md transition-colors [-webkit-mask-image:-webkit-radial-gradient(white,black)]"
          >
            <Settings className="h-3.5 w-3.5" />
            Update Account
          </button>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 text-black/70 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-600 text-xs md:text-sm uppercase tracking-[0.15em] px-6 py-2.5 backdrop-blur-md transition-colors [-webkit-mask-image:-webkit-radial-gradient(white,black)]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out
          </button>
        </div>

        {/* ── Data, floating in a wide, airy grid beneath ── */}
        <div className="relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-16 w-full max-w-4xl">
          <DataCell
            icon={<Mail className="h-4 w-4" />}
            label="EMAIL"
            value={email}
            badge={emailVerified && <BadgeCheck className="h-3 w-3 text-[#309107]" />}
          />
          <DataCell
            icon={<Phone className="h-4 w-4" />}
            label="PHONE"
            value={phone}
            badge={phoneVerified && <BadgeCheck className="h-3 w-3 text-[#309107]" />}
          />
          <DataCell
            icon={<Calendar className="h-4 w-4" />}
            label="MEMBER SINCE"
            value={memberSince}
          />
          <DataCell
            icon={<Clock className="h-4 w-4" />}
            label="LAST ACTIVE"
            value={lastActive}
          />
          <DataCell
            icon={twoFactorEnabled ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
            label="TWO-FACTOR"
            value={twoFactorEnabled ? "Enabled" : "Disabled"}
          />
          <DataCell
            icon={<KeyRound className="h-4 w-4" />}
            label="PASSWORD"
            value={passwordEnabled ? "Set" : "Not set"}
          />
        </div>

        {externalAccounts.length > 0 && (
          <div className="relative flex flex-wrap items-center justify-center gap-2 mt-8">
            <span className={`${mono} text-[10px] tracking-[0.16em] text-black/45 inline-flex items-center gap-1.5 mr-1`}>
              <Link2 className="h-3 w-3" />
              LINKED
            </span>
            {externalAccounts.map((acc, i) => (
              <span
                key={i}
                className={`${PANEL} px-4 py-1.5 text-xs text-black/70 capitalize`}
              >
                {acc.provider.replace("oauth_", "")}
              </span>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}