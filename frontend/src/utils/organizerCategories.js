// Mirrors backend/src/utils/constants.js's ORGANIZER_CATEGORIES / ORGANIZER_CATEGORY_LABELS.
// Keep the two lists in sync — the Organizer model enum only accepts these exact values.
export const ORGANIZER_CATEGORIES = [
  { value: 'technical', label: 'Technical' },
  { value: 'cultural', label: 'Cultural' },
  { value: 'sports', label: 'Sports' },
  { value: 'literary-debate', label: 'Literary & Debate' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'social-volunteer', label: 'Social & Volunteer' },
  { value: 'entrepreneurship', label: 'Entrepreneurship' },
  { value: 'music-fine-arts', label: 'Music & Fine Arts' },
  { value: 'media-photography', label: 'Media & Photography' },
  { value: 'other', label: 'Other' },
];

const LABEL_BY_VALUE = Object.fromEntries(ORGANIZER_CATEGORIES.map((c) => [c.value, c.label]));

export const getCategoryLabel = (value) => LABEL_BY_VALUE[value] || value || '—';
