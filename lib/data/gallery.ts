export const CATEGORIES = [
  "ALL",
  "FOOD & DRINK",
  "TRAVEL",
  "GADGETS & MAKING",
  "DRONE / AERIAL",
  "STREET / LIFESTYLE",
  "PORTRAITS",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface GalleryItem {
  num: string;
  category: Exclude<Category, "ALL">;
  aspect: string;
  bg: string;
  caption: string;
}

export const galleryItems: GalleryItem[] = [
  { num: "01", category: "FOOD & DRINK", aspect: "aspect-[3/4]", bg: "bg-[#14110F]", caption: "Istry plating session. Where heritage meets the plate." },
  { num: "02", category: "DRONE / AERIAL", aspect: "aspect-square", bg: "bg-[#1A1510]", caption: "Kingston from above. DJI over the harbour at golden hour." },
  { num: "03", category: "TRAVEL", aspect: "aspect-[4/5]", bg: "bg-[#0F1419]", caption: "First light over the Blue Mountains. 5,200 ft and rising." },
  { num: "04", category: "GADGETS & MAKING", aspect: "aspect-[3/4]", bg: "bg-[#121210]", caption: "BambuLab midnight print. Watching layers build at 2 AM." },
  { num: "05", category: "STREET / LIFESTYLE", aspect: "aspect-[4/3]", bg: "bg-[#151317]", caption: "Downtown Kingston. The city never stops moving." },
  { num: "06", category: "PORTRAITS", aspect: "aspect-[3/4]", bg: "bg-[#17140F]", caption: "Portrait series. Real faces, real stories." },
  { num: "07", category: "GADGETS & MAKING", aspect: "aspect-square", bg: "bg-[#110F14]", caption: "Desk setup. Where code, design, and caffeine converge." },
  { num: "08", category: "FOOD & DRINK", aspect: "aspect-[4/5]", bg: "bg-[#191410]", caption: "Sunday kitchen. Scotch bonnet and five spice on the same stove." },
  { num: "09", category: "TRAVEL", aspect: "aspect-[3/4]", bg: "bg-[#0F1517]", caption: "Somewhere between here and there. The journey is the point." },
  { num: "10", category: "STREET / LIFESTYLE", aspect: "aspect-square", bg: "bg-[#141219]", caption: "Street corner conversations. The pulse of the city." },
  { num: "11", category: "DRONE / AERIAL", aspect: "aspect-[4/3]", bg: "bg-[#14150F]", caption: "Coastline run. Jamaica from 400 feet never gets old." },
  { num: "12", category: "PORTRAITS", aspect: "aspect-[4/5]", bg: "bg-[#15110F]", caption: "Candid moment. Unscripted, unfiltered." },
  { num: "13", category: "FOOD & DRINK", aspect: "aspect-[3/4]", bg: "bg-[#0F1114]", caption: "SuperPlus produce. Community starts at the table." },
  { num: "14", category: "GADGETS & MAKING", aspect: "aspect-[3/4]", bg: "bg-[#1A1610]", caption: "3D printed prototype. Think it, model it, hold it." },
  { num: "15", category: "TRAVEL", aspect: "aspect-square", bg: "bg-[#101419]", caption: "Golden hour. Chasing light across the island." },
];
