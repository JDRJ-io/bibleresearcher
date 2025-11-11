export interface GuestBookmark {
  verse_key: string;
  label: string;
  color_hex: string;
}

const PREDEFINED_COLORS = {
  red: "#ef4444",
  orange: "#f97316",
  yellow: "#eab308",
  green: "#22c55e",
  cyan: "#06b6d4",
  blue: "#3b82f6",
  violet: "#8b5cf6",
  pink: "#ec4899",
} as const;

// Guest bookmarks are listed in canonical biblical order for easy navigation
export const GUEST_BOOKMARKS: GuestBookmark[] = [
  {
    verse_key: "Exod.34:1",
    label: "New Stone Tablets",
    color_hex: PREDEFINED_COLORS.orange,
  },
  {
    verse_key: "1Sam.17:1",
    label: "David vs Goliath",
    color_hex: PREDEFINED_COLORS.blue,
  },
  {
    verse_key: "Job.38:1",
    label: "From the Whirlwind",
    color_hex: PREDEFINED_COLORS.violet,
  },
  {
    verse_key: "Ps.23:1",
    label: "The Lord\'s Flock",
    color_hex: PREDEFINED_COLORS.green,
  },
  {
    verse_key: "Ps.91:1",
    label: "Beneath Our Heavenly Father",
    color_hex: PREDEFINED_COLORS.blue,
  },
  {
    verse_key: "Ps.139:1",
    label: "Known Fully",
    color_hex: PREDEFINED_COLORS.blue,
  },
  {
    verse_key: "Prov.21:1",
    label: "King's Heart",
    color_hex: PREDEFINED_COLORS.cyan,
  },
  {
    verse_key: "Isa.61:1",
    label: "Holy Spirit\'s' Anointing",
    color_hex: PREDEFINED_COLORS.green,
  },
  {
    verse_key: "Dan.3:1",
    label: "Golden Image",
    color_hex: PREDEFINED_COLORS.yellow,
  },
  {
    verse_key: "Mal.1:1",
    label: "Israel's Apostasy",
    color_hex: PREDEFINED_COLORS.red,
  },
  {
    verse_key: "Matt.5:1",
    label: "Declarations of Blessing",
    color_hex: PREDEFINED_COLORS.green,
  },
  {
    verse_key: "John.13:1",
    label: "The Last Supper",
    color_hex: PREDEFINED_COLORS.red,
  },
  {
    verse_key: "John.18:1",
    label: "Death & Resurrection",
    color_hex: PREDEFINED_COLORS.orange,
  },
  {
    verse_key: "Acts.2:1",
    label: "Pentecost Jubilee",
    color_hex: PREDEFINED_COLORS.cyan,
  },
  {
    verse_key: "Rom.8:1",
    label: "No Condemnation Through Jesus",
    color_hex: PREDEFINED_COLORS.orange,
  },
  {
    verse_key: "Rom.12:1",
    label: "True Worship",
    color_hex: PREDEFINED_COLORS.orange,
  },
  {
    verse_key: "Eph.1:17",
    label: "Paul's Prayer",
    color_hex: PREDEFINED_COLORS.violet,
  },
  {
    verse_key: "2Pet.1:1",
    label: "Faith and Virtue",
    color_hex: PREDEFINED_COLORS.blue,
  },
  {
    verse_key: "Rev.1:1",
    label: "The Epistles of Jesus",
    color_hex: PREDEFINED_COLORS.violet,
  },
  {
    verse_key: "Rev.19:1",
    label: "Creation\'s Crescendo",
    color_hex: PREDEFINED_COLORS.yellow,
  },
];
