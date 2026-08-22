import { Link } from "wouter";
import {
  ArrowRight,
  CheckCircle2,
  Code2,
  Database,
  FileJson2,
  GitBranch,
  Layers3,
  LockKeyhole,
  Network,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";

const manifestCode = `{
  "action": "delta_available",
  "gameKey": "visual_jeopardy",
  "latestReleaseVersion": "qrl_20260815_k3m9x7p2",
  "cacheTtlSeconds": 21600,
  "deltaId": "delta_Zx7nM4uJb8QkR2pV",
  "estimatedOperationCount": 14
}`;

const deltaCode = `{
  "type": "question_upsert",
  "operationId": "op_Yd5uN9cHq1VwP3xK",
  "sequence": 41,
  "record": {
    "questionId": 842,
    "revisionId": 910,
    "promptType": "visual",
    "prompt": "This display illustrates what kind of meal?",
    "recordChecksum": "fda604…e31723d"
  }
}`;

function Stage({ number, title, detail }: { number: string; title: string; detail: string }) {
  return (
    <div className="relative flex gap-4 pb-8 last:pb-0">
      <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/40 bg-cyan-400/10 font-mono text-xs font-bold text-cyan-200">
        {number}
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
      </div>
    </div>
  );
}

function ArchitectureNode({ icon: Icon, title, detail, accent = "cyan" }: { icon: typeof Database; title: string; detail: string; accent?: "cyan" | "violet" | "orange" }) {
  const colors = {
    cyan: "border-cyan-300/30 bg-cyan-400/10 text-cyan-200",
    violet: "border-violet-300/30 bg-violet-400/10 text-violet-200",
    orange: "border-orange-300/30 bg-orange-400/10 text-orange-200",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-5 shadow-2xl shadow-slate-950/30">
      <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl border ${colors[accent]}`}><Icon className="h-5 w-5" /></div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </div>
  );
}

export default function SharedQuestionSync() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07111f] text-slate-100">
      <section className="relative border-b border-white/10 bg-[radial-gradient(circle_at_15%_5%,rgba(34,211,238,.18),transparent_28%),radial-gradient(circle_at_85%_20%,rgba(139,92,246,.18),transparent_24%),linear-gradient(180deg,#0a1729_0%,#07111f_100%)]">
        <div className="mx-auto max-w-6xl px-5 pb-20 pt-16 md:px-8 md:pb-28 md:pt-24">
          <div className="mb-10 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-slate-300 transition-colors hover:text-white">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-400/10"><Layers3 className="h-4 w-4 text-cyan-200" /></span>
              Just Putzit Engineering
            </Link>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-mono text-xs text-cyan-200">SYNC SPEC · v1</span>
          </div>
          <div className="grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div>
              <p className="mb-5 font-mono text-sm tracking-[0.18em] text-cyan-200">SHARED QUESTION LIBRARY</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl">
                Ship fresh game content without shipping answers.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                A server-authoritative, release-versioned synchronization contract for Just Putzit web, PWA, and future native game clients.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <a href="#architecture" className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950 transition-transform active:scale-95">Explore architecture <ArrowRight className="h-4 w-4" /></a>
                <a href="#contract" className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/5">Read contract <Code2 className="h-4 w-4" /></a>
              </div>
              <div className="mt-10 grid max-w-xl grid-cols-3 gap-3 text-center">
                {[['6', 'game keys'], ['100', 'records/page'], ['0', 'answer keys in delta']].map(([value, label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/[.03] px-3 py-4"><p className="font-mono text-xl font-semibold text-cyan-200">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
              </div>
            </div>
            <div className="relative rounded-3xl border border-cyan-300/20 bg-slate-950/70 p-5 shadow-[0_30px_100px_rgba(0,0,0,.38)] sm:p-7">
              <div className="mb-5 flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-rose-400" /><span className="h-2 w-2 rounded-full bg-amber-300" /><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="ml-2 font-mono">content.manifest</span></div>
              <pre className="overflow-x-auto font-mono text-xs leading-6 text-cyan-100 sm:text-sm"><code>{manifestCode}</code></pre>
              <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-sm text-slate-300"><CheckCircle2 className="h-5 w-5 text-emerald-300" /> Client chooses delta, snapshot, or upgrade path.</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-white/10 bg-[#091627]">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-10 md:grid-cols-3 md:px-8">
          {[
            [ShieldCheck, "Presentation-safe by design", "Catalog sync contains renderable question fields only. Canonical answers, reviewer notes, private selections, and partner data remain server-side."],
            [RefreshCw, "Idempotent release updates", "Complete replacement upserts plus operation IDs make retries safe. Retirements use explicit tombstones rather than ambiguous deletion."],
            [LockKeyhole, "Scored rooms stay pinned", "A room requests a server-issued pack. New releases reach new rooms; active competitive rooms keep their authorized, sanitized question set."],
          ].map(([Icon, title, detail]) => <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[.025] p-6"><Icon className="mb-4 h-6 w-6 text-cyan-200" /><h2 className="font-semibold text-white">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{detail as string}</p></div>)}
        </div>
      </section>

      <section id="architecture" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="max-w-2xl"><p className="font-mono text-sm tracking-[0.18em] text-violet-300">ARCHITECTURE</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">One library. Purpose-built client projections.</h2><p className="mt-4 leading-7 text-slate-400">The content system separates editorial truth, cacheable presentation records, and room-authorized active-game data. Each layer has a different permission boundary.</p></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[1fr_90px_1fr_90px_1fr] lg:items-center">
          <ArchitectureNode icon={Database} title="Editorial source of truth" detail="Revisions, answers, rights status, review notes, and eligibility remain private on the server." accent="violet" />
          <div className="hidden lg:flex justify-center"><ArrowRight className="h-7 w-7 text-slate-600" /></div>
          <ArchitectureNode icon={FileJson2} title="Safe release catalog" detail="Immutable release version, checksums, prompt presentation, optional media, and game adapter configuration." accent="cyan" />
          <div className="hidden lg:flex justify-center"><ArrowRight className="h-7 w-7 text-slate-600" /></div>
          <ArchitectureNode icon={Network} title="Client and room pack" detail="Clients cache verified catalogs. Authorized rooms receive a separate pinned question pack for live play." accent="orange" />
        </div>
      </section>

      <section id="contract" className="border-y border-white/10 bg-[#0b182a]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[.85fr_1.15fr]">
          <div><p className="font-mono text-sm tracking-[0.18em] text-cyan-200">THE CONTRACT</p><h2 className="mt-4 text-3xl font-semibold text-white">Manifest first. Then one of three safe paths.</h2><div className="relative mt-9 before:absolute before:bottom-6 before:left-[17px] before:top-5 before:w-px before:bg-slate-700"><Stage number="01" title="Up to date" detail="Honor the cache TTL and use the locally verified catalog." /><Stage number="02" title="Delta available" detail="Apply complete upserts and tombstones transactionally, then promote only after the target checksum verifies." /><Stage number="03" title="Snapshot or upgrade" detail="Stage a clean catalog when the base is unknown, stale, mismatched, or contract-incompatible." /></div></div>
          <div className="rounded-3xl border border-white/10 bg-[#050c16] p-5 shadow-2xl sm:p-7"><div className="mb-5 flex items-center justify-between"><span className="font-mono text-xs text-slate-500">GET /content.delta</span><span className="rounded-full bg-emerald-400/10 px-2 py-1 font-mono text-[10px] text-emerald-300">200 · PAGE 1/1</span></div><pre className="overflow-x-auto font-mono text-xs leading-6 text-slate-300 sm:text-sm"><code>{deltaCode}</code></pre><div className="mt-5 rounded-xl border border-amber-300/15 bg-amber-300/[.06] p-4 text-sm leading-6 text-amber-100"><strong>Design rule:</strong> every delta operation is either a complete safe replacement record or an explicit retirement. No field-level patch guessing.</div></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <div className="grid gap-10 lg:grid-cols-[1.05fr_.95fr]">
          <div><p className="font-mono text-sm tracking-[0.18em] text-orange-300">CLIENT APPLICATION</p><h2 className="mt-4 text-3xl font-semibold text-white">Atomic, observable, recoverable.</h2><p className="mt-4 max-w-xl leading-7 text-slate-400">The client never promotes a release until it receives the final page and verifies the server’s catalog checksum. A failed page leaves the last known-good catalog active.</p><div className="mt-8 grid gap-4 sm:grid-cols-2"><ArchitectureNode icon={GitBranch} title="Stage before swap" detail="Snapshots use a temporary namespace until all pages and catalog checksum are valid." /><ArchitectureNode icon={Zap} title="Deduplicate retries" detail="Operation IDs ensure an interrupted delta can be safely replayed without duplicate effects." /></div></div>
          <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900 to-slate-950 p-6"><h3 className="text-lg font-semibold text-white">Recovery matrix</h3><div className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-5 border-b border-white/10 pb-4"><span className="text-slate-400">Base checksum mismatch</span><span className="font-medium text-cyan-200">Request snapshot</span></div><div className="flex justify-between gap-5 border-b border-white/10 pb-4"><span className="text-slate-400">Delta pruned / expired</span><span className="font-medium text-cyan-200">Request snapshot</span></div><div className="flex justify-between gap-5 border-b border-white/10 pb-4"><span className="text-slate-400">Release in progress</span><span className="font-medium text-cyan-200">Keep cache · retry later</span></div><div className="flex justify-between gap-5"><span className="text-slate-400">Schema incompatible</span><span className="font-medium text-cyan-200">Prompt upgrade</span></div></div></div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-[#0b182a]">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8"><div className="flex flex-col justify-between gap-8 md:flex-row md:items-end"><div className="max-w-2xl"><p className="font-mono text-sm tracking-[0.18em] text-cyan-200">IMPLEMENTATION ORDER</p><h2 className="mt-4 text-3xl font-semibold text-white">Build the contract before you scale the content.</h2></div><a href="#architecture" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-200 hover:text-cyan-100">Back to architecture <ArrowRight className="h-4 w-4" /></a></div><div className="mt-10 grid gap-4 md:grid-cols-4">{[["01", "Release tables", "Server-only eligibility selector"], ["02", "Safe projection", "Shared Zod contract tests"], ["03", "Client store", "Manifest, delta, snapshot, checksum"], ["04", "Room packs", "Pin one adapter before catalog scale"]].map(([number, title, detail]) => <div key={number} className="rounded-2xl border border-white/10 bg-white/[.025] p-5"><p className="font-mono text-sm text-cyan-200">{number}</p><h3 className="mt-5 font-semibold text-white">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></div>)}</div></div>
      </section>
    </main>
  );
}
