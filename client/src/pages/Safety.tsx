import { AlertTriangle, Ban, CheckCircle2, CircleHelp, Flag, Lock, MapPin, Shield, UserRoundCheck, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const controls = [
  {
    icon: <UsersRound className="h-6 w-6 text-teal-700" />,
    title: "You choose your connection settings",
    description: "Community discovery stays available without joining a dating pool. Friendship and dating introductions are private opt-ins, and a new match needs a shared opt-in.",
    tone: "border-teal-100 bg-teal-50/70",
  },
  {
    icon: <Ban className="h-6 w-6 text-rose-700" />,
    title: "Block closes the connection",
    description: "Blocking a member removes that match from your view, closes chat and public-event proposals in both directions, and keeps the person out of future matching. They are not told you blocked them.",
    tone: "border-rose-100 bg-rose-50/70",
  },
  {
    icon: <Flag className="h-6 w-6 text-orange-700" />,
    title: "Reports are private",
    description: "You can report harassment, scams, misleading profiles, bots, or inappropriate content from a match or chat. Reports are routed to the moderation queue without identifying the reporter to the other member.",
    tone: "border-orange-100 bg-orange-50/70",
  },
  {
    icon: <MapPin className="h-6 w-6 text-blue-700" />,
    title: "Plans start in public places",
    description: "Sally’s invitations are built around public events. An invitation can be accepted or declined privately; it does not share personal contact information or a home address.",
    tone: "border-blue-100 bg-blue-50/70",
  },
];

const meetupTips = [
  "Use a public venue for first meetings and choose your own transportation.",
  "Tell someone you trust where you are going and when you expect to be back.",
  "Keep your personal contact details private until you are comfortable sharing them.",
  "Trust your instincts. You never owe anyone a meeting, a reply, or an explanation.",
  "Use Report or Block in the app if a member makes you uncomfortable. In an emergency, contact local emergency services first.",
];

export default function Safety() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-teal-100 bg-gradient-to-br from-teal-50 via-white to-orange-50 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-teal-100 px-4 py-2 text-sm font-semibold text-teal-800"><Shield className="h-4 w-4" />Safety & Trust</div>
          <h1 className="font-display text-4xl font-bold text-foreground sm:text-5xl">Real-world connections, on <span className="text-primary">your terms</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">Just Putzit helps members discover public local activities, control connection preferences, and use private report and block tools when something does not feel right.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-2"><Badge className="border-0 bg-teal-100 px-3 py-1.5 text-teal-800">Private report & block tools</Badge><Badge className="border-0 bg-orange-100 px-3 py-1.5 text-orange-800">Public-event invitations</Badge><Badge className="border-0 bg-blue-100 px-3 py-1.5 text-blue-800">Member-controlled opt-ins</Badge></div>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-9 max-w-2xl"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Your controls</p><h2 className="mt-2 font-display text-3xl font-bold text-foreground">Safety features you can use today</h2><p className="mt-3 text-muted-foreground">These tools are designed to give you clear choices before and during a connection. They are not a substitute for personal judgment or emergency services.</p></div>
          <div className="grid gap-4 md:grid-cols-2">{controls.map((control) => <Card key={control.title} className={`border ${control.tone} shadow-none`}><CardContent className="p-5"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white">{control.icon}</div><h3 className="font-semibold text-foreground">{control.title}</h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{control.description}</p></CardContent></Card>)}</div>
        </div>
      </section>

      <section className="bg-muted/40 px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">If you need to act</p><h2 className="mt-2 font-display text-3xl font-bold text-foreground">Report, block, and move on</h2><div className="mt-6 space-y-4"><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">1</span><p className="pt-0.5 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Open Safety</strong> from a match card or chat header and choose Report or Block.</p></div><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">2</span><p className="pt-0.5 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Share only what helps</strong> with a fair review. Your report is not shown to the reported member.</p></div><div className="flex gap-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">3</span><p className="pt-0.5 text-sm leading-relaxed text-muted-foreground"><strong className="text-foreground">Block when you want distance.</strong> It immediately ends the connection in the app.</p></div></div></div>
          <Card className="border-amber-200 bg-amber-50 shadow-none"><CardContent className="p-6"><div className="mb-3 flex items-center gap-2 font-semibold text-amber-950"><AlertTriangle className="h-5 w-5 text-amber-700" />For an urgent safety concern</div><p className="text-sm leading-relaxed text-amber-900">If you believe you are in immediate danger, contact local emergency services first. The in-app report flow is for moderation review and is not an emergency response channel.</p></CardContent></Card>
        </div>
      </section>

      <section className="bg-white px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center"><div className="rounded-3xl bg-gradient-to-br from-orange-50 to-teal-50 p-7 text-center"><div className="text-5xl">🧭</div><h2 className="mt-4 font-display text-2xl font-bold text-foreground">A public-first meetup</h2><p className="mt-3 text-sm leading-relaxed text-muted-foreground">The safest first plan is one you can leave easily, in a public setting, on a timeline you control.</p></div><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Before you go</p><h2 className="mt-2 font-display text-3xl font-bold text-foreground">Practical meetup reminders</h2><ul className="mt-5 space-y-3">{meetupTips.map((tip) => <li key={tip} className="flex gap-3 text-sm leading-relaxed text-muted-foreground"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />{tip}</li>)}</ul></div></div>
      </section>

      <section className="border-y border-border bg-muted/30 px-4 py-12"><div className="mx-auto max-w-4xl"><div className="flex flex-col gap-4 rounded-3xl bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-foreground"><UserRoundCheck className="h-5 w-5 text-primary" />Set your own connection boundaries</div><p className="mt-1 text-sm text-muted-foreground">Review friendship and dating opt-ins from your profile whenever your comfort level changes.</p></div><Link href="/profile"><Button className="rounded-full">Review profile settings</Button></Link></div></div></section>

      <section className="px-4 py-12"><div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-3xl border border-border bg-white p-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="flex items-center gap-2 font-semibold text-foreground"><Lock className="h-5 w-5 text-primary" />Privacy information</div><p className="mt-1 text-sm text-muted-foreground">Learn how Just Putzit handles profile, location, and activity information.</p></div><Link href="/privacy"><Button variant="outline" className="rounded-full">Read privacy policy</Button></Link></div></section>

      <section className="px-4 pb-16 pt-4"><div className="mx-auto max-w-4xl text-center"><CircleHelp className="mx-auto h-8 w-8 text-primary" /><h2 className="mt-3 font-display text-2xl font-bold text-foreground">Need another route?</h2><p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">You can return to local discovery at any time. You decide who you connect with and which public plans feel right for you.</p><Link href="/events"><Button variant="outline" className="mt-5 rounded-full">Browse public events</Button></Link></div></section>
    </div>
  );
}
