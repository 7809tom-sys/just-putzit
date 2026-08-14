import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { buildJustPutzitReferralMessage, JUST_PUTZIT_REFERRAL_NOTE } from "../../../shared/referralCopy";
import {
  Users,
  Phone,
  Mail,
  Share2,
  Copy,
  CheckCircle,
  Plus,
  Trash2,
  Megaphone,
  MessageSquare,
  UserPlus,
  TrendingUp,
} from "lucide-react";

interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  selected: boolean;
}

interface SentInvite {
  contactName: string;
  inviteCode: string;
  link: string;
}

export default function ShoutOut() {
  const { user, isAuthenticated } = useAuth();
  const loginUrl = getLoginUrl();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [sentInvites, setSentInvites] = useState<SentInvite[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [inviteNote, setInviteNote] = useState(JUST_PUTZIT_REFERRAL_NOTE);

  const { data: myInvites } = trpc.invites.myInvites.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: stats } = trpc.invites.stats.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const sendInvites = trpc.invites.send.useMutation({
    onSuccess: (results) => {
      const appUrl = window.location.origin;
      const newSent: SentInvite[] = results.map((r) => ({
        contactName: r.contactName,
        inviteCode: r.inviteCode,
        link: `${appUrl}/?invite=${r.inviteCode}`,
      }));
      setSentInvites((prev) => [...newSent, ...prev]);
      setContacts((prev) => prev.map((c) => ({ ...c, selected: false })));
      toast.success(`${results.length} invite${results.length > 1 ? "s" : ""} created! Share the links below.`);
    },
    onError: () => toast.error("Failed to create invites. Please try again."),
  });

  const pickContacts = useCallback(async () => {
    // Web Contacts API — only available on mobile Chrome/Android
    if ("contacts" in navigator && "ContactsManager" in window) {
      try {
        const props = ["name", "tel", "email"];
        // @ts-ignore — ContactsManager is not in TS lib yet
        const selected = await navigator.contacts.select(props, { multiple: true });
        const newContacts: Contact[] = selected.map((c: { name?: string[]; tel?: string[]; email?: string[] }, i: number) => ({
          id: `contact-${Date.now()}-${i}`,
          name: c.name?.[0] ?? "Unknown",
          phone: c.tel?.[0],
          email: c.email?.[0],
          selected: true,
        }));
        setContacts((prev) => [...prev, ...newContacts]);
      } catch {
        toast.error("Contact picker was cancelled or not supported.");
      }
    } else {
      toast.info("Contact picker is only available on Android Chrome. Add contacts manually below.");
    }
  }, []);

  const addManual = () => {
    if (!newName.trim()) {
      toast.error("Please enter a contact name.");
      return;
    }
    setContacts((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        name: newName.trim(),
        phone: newPhone.trim() || undefined,
        email: newEmail.trim() || undefined,
        selected: true,
      },
    ]);
    setNewName("");
    setNewPhone("");
    setNewEmail("");
  };

  const toggleContact = (id: string) => {
    setContacts((prev) => prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c)));
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const selectedContacts = contacts.filter((c) => c.selected);

  const handleSend = () => {
    if (selectedContacts.length === 0) {
      toast.error("Select at least one contact to invite.");
      return;
    }
    sendInvites.mutate(
      selectedContacts.map((c) => ({
        contactName: c.name,
        contactPhone: c.phone,
        contactEmail: c.email,
      }))
    );
  };

  const copyLink = (link: string, code: string) => {
    navigator.clipboard.writeText(link).then(() => {
      setCopiedCode(code);
      toast.success("Invite link copied!");
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const shareLink = (invite: SentInvite) => {
    const text = buildJustPutzitReferralMessage(invite.link, inviteNote);
    if (navigator.share) {
      navigator.share({ title: "Join me on Just Putzit!", text, url: invite.link });
    } else {
      copyLink(invite.link, invite.inviteCode);
    }
  };

  const smsLink = (invite: SentInvite, phone?: string) => {
    const text = encodeURIComponent(buildJustPutzitReferralMessage(invite.link, inviteNote));
    window.open(`sms:${phone ?? ""}?body=${text}`, "_blank");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-rose-50 p-6">
        <Card className="max-w-md w-full text-center shadow-lg border-none">
          <CardContent className="pt-10 pb-8 space-y-4">
            <Megaphone className="w-14 h-14 text-orange-500 mx-auto" />
            <h2 className="text-2xl font-bold">Shout Out to Friends</h2>
            <p className="text-muted-foreground">Sign in to invite your friends to Just Putzit and see who joins.</p>
            <Button asChild className="w-full bg-orange-500 hover:bg-orange-600 text-white">
              <a href={loginUrl}>Sign In to Invite Friends</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50 to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Shout Out</h1>
              <p className="text-sm text-muted-foreground">Invite friends to Just Putzit</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-none shadow-sm text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-orange-600">{stats.total}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sent</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-blue-600">{stats.opened}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Opened</p>
              </CardContent>
            </Card>
            <Card className="border-none shadow-sm text-center">
              <CardContent className="pt-4 pb-3">
                <p className="text-2xl font-bold text-green-600">{stats.joined}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Joined</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Contact picker */}
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-orange-500" /> Your invitation note
            </CardTitle>
            <p className="text-xs text-muted-foreground">Personalize this note before sharing. Each friend’s unique invite link is added automatically.</p>
          </CardHeader>
          <CardContent>
            <Textarea
              value={inviteNote}
              onChange={(event) => setInviteNote(event.target.value.slice(0, 500))}
              maxLength={500}
              className="min-h-24 resize-none rounded-xl"
              aria-label="Your invitation note"
            />
            <p className="mt-2 text-right text-xs text-muted-foreground">{inviteNote.length}/500</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-500" /> Add Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Phone contacts button */}
            <Button
              variant="outline"
              className="w-full border-dashed border-orange-300 text-orange-600 hover:bg-orange-50"
              onClick={pickContacts}
            >
              <Phone className="w-4 h-4 mr-2" />
              Pick from Phone Contacts
              <Badge className="ml-2 bg-orange-100 text-orange-700 text-xs">Android Chrome</Badge>
            </Button>

            <div className="flex items-center gap-2">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or add manually</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual add */}
            <div className="space-y-2">
              <Input
                placeholder="Contact name *"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addManual()}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Phone (optional)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  type="tel"
                />
                <Input
                  placeholder="Email (optional)"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  type="email"
                />
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={addManual}
                disabled={!newName.trim()}
              >
                <Plus className="w-4 h-4 mr-2" /> Add Contact
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact checklist */}
        {contacts.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-rose-500" />
                  Select Who to Invite
                </CardTitle>
                <Badge className="bg-orange-100 text-orange-700">
                  {selectedContacts.length} selected
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer ${
                    contact.selected
                      ? "bg-orange-50 border-orange-200"
                      : "bg-white border-gray-100 hover:bg-gray-50"
                  }`}
                  onClick={() => toggleContact(contact.id)}
                >
                  <Checkbox
                    checked={contact.selected}
                    onCheckedChange={() => toggleContact(contact.id)}
                    className="pointer-events-none"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{contact.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      {contact.phone && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {contact.phone}
                        </span>
                      )}
                      {contact.email && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="w-3 h-3" /> {contact.email}
                        </span>
                      )}
                      {!contact.phone && !contact.email && (
                        <span className="text-xs text-muted-foreground">No contact info</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeContact(contact.id); }}
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <Button
                className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSend}
                disabled={selectedContacts.length === 0 || sendInvites.isPending}
              >
                <Megaphone className="w-4 h-4 mr-2" />
                {sendInvites.isPending
                  ? "Creating invites..."
                  : `Send Shout-Out to ${selectedContacts.length} Friend${selectedContacts.length !== 1 ? "s" : ""}`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Sent invites with links */}
        {sentInvites.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Share2 className="w-4 h-4 text-green-500" /> Share These Links
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Send each link to your friend via text, WhatsApp, or any app.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {sentInvites.map((invite) => (
                <div key={invite.inviteCode} className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-gray-800">{invite.contactName}</p>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="bg-white rounded-lg px-3 py-2 text-xs text-muted-foreground font-mono truncate border border-green-100">
                    {invite.link}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-green-200 hover:bg-green-50"
                      onClick={() => copyLink(invite.link, invite.inviteCode)}
                    >
                      {copiedCode === invite.inviteCode ? (
                        <><CheckCircle className="w-3 h-3 mr-1 text-green-500" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3 mr-1" /> Copy Link</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 text-xs bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => shareLink(invite)}
                    >
                      <Share2 className="w-3 h-3 mr-1" /> Share
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs border-blue-200 hover:bg-blue-50 text-blue-600"
                      onClick={() => smsLink(invite)}
                    >
                      <MessageSquare className="w-3 h-3 mr-1" /> SMS
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Past invites history */}
        {myInvites && myInvites.length > 0 && (
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" /> Invite History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {myInvites.slice(0, 10).map((invite) => (
                  <div key={invite.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{invite.contactName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invite.sentAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      className={
                        invite.status === "joined"
                          ? "bg-green-100 text-green-700"
                          : invite.status === "opened"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {invite.status === "joined" ? "✓ Joined" : invite.status === "opened" ? "👀 Opened" : "Sent"}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {contacts.length === 0 && sentInvites.length === 0 && (!myInvites || myInvites.length === 0) && (
          <div className="text-center py-12 space-y-3">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto">
              <Megaphone className="w-10 h-10 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold">Spread the Word!</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Add friends above and send them a personalized invite link. Every friend who joins makes the community better for everyone.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
