import { Shield, CheckCircle, AlertTriangle, Lock, Eye, UserX, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import Navbar from "@/components/Navbar";

export default function Safety() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-6">
            <Shield className="w-4 h-4" />
            Just Putzit Safety Promise
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 font-display">
            Your Safety Is Our{" "}
            <span className="text-green-600">Top Priority</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            The dating and social industry loses over{" "}
            <strong className="text-red-600">$1.4 billion to fraud every year.</strong>{" "}
            Just Putzit was built from day one to be the platform that actually protects you.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">✓ Zero Fake Profiles</Badge>
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">✓ No AI Impersonation</Badge>
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">✓ Every Match Is Real</Badge>
            <Badge className="bg-green-100 text-green-800 px-4 py-2 text-sm">✓ Continuous Vetting</Badge>
          </div>
        </div>
      </section>

      {/* Our Promise */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">The Just Putzit Trust Promise</h2>
            <p className="text-gray-600 text-lg">Four commitments we make to every single user on this platform.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: <UserX className="w-8 h-8 text-red-500" />,
                title: "We Will Never Use AI to Fake a Connection",
                description:
                  "Some platforms use AI bots to pretend to be real people, keeping you engaged and spending money. We will never do that. Sally is always clearly identified as an AI. Every match you receive is a verified, real human being.",
                color: "border-red-100 bg-red-50",
              },
              {
                icon: <Shield className="w-8 h-8 text-blue-500" />,
                title: "Every User Is Continuously Vetted",
                description:
                  "Sally re-interviews every user on every login. Because her questions are dynamic and personality-driven, bots and scammers cannot pre-program answers. Suspicious patterns are automatically flagged before they ever reach you.",
                color: "border-blue-100 bg-blue-50",
              },
              {
                icon: <Eye className="w-8 h-8 text-purple-500" />,
                title: "Human Moderators Review Every Flag",
                description:
                  "Our admin team personally reviews every reported account, every auto-flag, and every suspicious pattern. No account gets a pass. If something is wrong, we act on it — fast.",
                color: "border-purple-100 bg-purple-50",
              },
              {
                icon: <Heart className="w-8 h-8 text-pink-500" />,
                title: "We Make Money When You Show Up — Not When You Stay Home",
                description:
                  "Our revenue comes from local venues and activity partners when we successfully get you out into your community. We have zero incentive to string you along online. Our success is your success.",
                color: "border-pink-100 bg-pink-50",
              },
            ].map((item, i) => (
              <Card key={i} className={`border-2 ${item.color}`}>
                <CardContent className="p-6">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4-Layer Vetting System */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">
              Just Putzit's 4-Layer Continuous Vetting
            </h2>
            <p className="text-gray-600 text-lg">
              Not a one-time check. A continuous system that runs every single time you use the app.
            </p>
          </div>
          <div className="space-y-4">
            {[
              {
                step: "1",
                title: "Secure Account Creation",
                description:
                  "Every account requires a verified email address through Manus OAuth. No anonymous accounts. No throwaway profiles.",
                badge: "Identity Anchor",
                color: "bg-blue-500",
              },
              {
                step: "2",
                title: "Sally's Dynamic Re-Interview",
                description:
                  "Every login triggers a fresh 90-second AI interview. Sally asks different, unpredictable, personality-driven questions every session — impossible for bots to game. Answers that contradict previous sessions or show unnatural patterns are automatically flagged.",
                badge: "Behavioral AI",
                color: "bg-orange-500",
              },
              {
                step: "3",
                title: "Community Report & Block System",
                description:
                  "Every user can report or block anyone instantly. Three or more reports on a single account triggers an automatic admin review. Reported accounts are immediately restricted while under review.",
                badge: "Community Defense",
                color: "bg-purple-500",
              },
              {
                step: "4",
                title: "Human Admin Review",
                description:
                  "Our moderation team personally reviews every flagged account, every report, and every suspicious pattern. Accounts confirmed as scammers, bots, or bad actors are permanently banned.",
                badge: "Human Oversight",
                color: "bg-green-500",
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div
                  className={`w-12 h-12 ${item.color} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                >
                  {item.step}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900">{item.title}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
                </div>
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Third Wheel */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-yellow-100 text-yellow-800 mb-4">In-Person Safety</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">
                "The Third Wheel" Safety Feature
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                For larger group events and community meetups, Just Putzit provides verified hosts and moderators who
                are physically present. You never have to show up alone to an unfamiliar situation.
              </p>
              <ul className="space-y-3">
                {[
                  "Verified hosts present at all Just Putzit group events",
                  "Moderators ensure everyone feels safe and comfortable",
                  "Focus on making genuine connections, not worrying about safety",
                  "Instant reporting available during any event",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 text-center">
              <div className="text-6xl mb-4">🛡️</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Safety Tips for Your First Meetup</h3>
              <ul className="text-left space-y-2 text-sm text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">→</span>
                  Always meet in a public place for first encounters
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">→</span>
                  Tell a friend or family member where you are going
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">→</span>
                  Trust your instincts — if something feels off, leave
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">→</span>
                  Use the in-app Report button immediately if needed
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-500 font-bold">→</span>
                  All Just Putzit venues are verified partner locations
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Warning about other platforms */}
      <section className="py-12 px-4 bg-red-50 border-y border-red-100">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-4 items-start">
            <AlertTriangle className="w-8 h-8 text-red-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-red-800 mb-2">
                A Note About AI Deception in the Dating Industry
              </h3>
              <p className="text-red-700 text-sm leading-relaxed">
                Several major dating and social platforms have been found using AI characters that pretend to be real
                people — engaging users in conversations, encouraging them to spend money, and keeping them subscribed
                longer. This is a form of fraud. Just Putzit will never do this. Sally is always clearly identified as
                an AI assistant. She exists to connect you with real people, not to replace them. If you ever encounter
                a platform where you suspect you are talking to an AI pretending to be human, report it to the FTC at
                reportfraud.ftc.gov.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="max-w-2xl mx-auto text-center">
          <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-4 font-display">
            Ready to Connect Safely?
          </h2>
          <p className="text-gray-600 mb-8">
            Join Just Putzit — the only social platform built from the ground up to protect you while connecting you
            to real people and real experiences in your community.
          </p>
          <Link href="/">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg rounded-full">
              Get Started — It's Free
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
