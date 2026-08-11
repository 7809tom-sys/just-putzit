export type HomepageSection = {
  moduleId: string;
  position: number;
  pinned: boolean;
};

export function toggleHomepageSection(
  sections: HomepageSection[],
  moduleId: string,
): HomepageSection[] {
  return sections.map((section) => (
    section.moduleId === moduleId
      ? { ...section, pinned: !section.pinned }
      : section
  ));
}
