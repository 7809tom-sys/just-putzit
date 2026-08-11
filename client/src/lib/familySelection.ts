export const FAMILY_GENDER_LABELS = {
  boy: "Boy",
  girl: "Girl",
  nonbinary: "Non-binary",
  prefer_not_to_say: "Prefer not to say",
} as const;

export type FamilyChildGender = keyof typeof FAMILY_GENDER_LABELS;

export function normalizeFamilyChildGender(value: string): FamilyChildGender | null {
  return value in FAMILY_GENDER_LABELS ? (value as FamilyChildGender) : null;
}

export function getFamilyGenderSelectionToast(gender: FamilyChildGender) {
  return {
    title: `${FAMILY_GENDER_LABELS[gender]} selected`,
    description: "This preference is ready to save with the child’s family profile.",
  };
}

export function getFamilyInvalidGenderToast() {
  return {
    title: "Choose a gender selection",
    description: "Select Boy, Girl, Non-binary, or Prefer not to say before adding the child.",
  };
}
