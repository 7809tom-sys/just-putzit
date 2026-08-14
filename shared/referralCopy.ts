export const JUST_PUTZIT_REFERRAL_INTRO =
  "Hey! I'm using Just Putzit to discover local events, activities, and real-world connection.";

export function buildJustPutzitReferralMessage(inviteLink: string) {
  return `${JUST_PUTZIT_REFERRAL_INTRO} Join me! ${inviteLink}`;
}
