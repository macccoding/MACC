export interface Venture {
  num: string;
  name: string;
  role: string;
  year: string;
  tagline: string;
  meta: string;
  tags: string[];
  accent: string;
  description: string[] | string;
  stats: { value: string; label: string }[];
  images: { aspect: string; label: string }[];
  link: string;
  linkLabel: string;
}

export const ventures: Venture[] = [
  {
    num: "01",
    name: "ISTRY",
    role: "Founder",
    year: "2023",
    tagline: "Bespoke food & beverage. Whitelabeling. Events.",
    meta: "FOUNDER \u00b7 BESPOKE F&B",
    tags: ["FOOD & BEVERAGE", "WHITELABELING", "EVENTS", "CATERING"],
    accent: "#E5B820",
    description: [
      "Istry is a bespoke food and beverage company born from the belief that Jamaica deserves world-class culinary experiences wrapped in homegrown identity. We create whitelabel products, cater events, and develop original brands that sit at the intersection of Caribbean flavor and global ambition.",
      "Every product we develop, every event we cater, carries the same philosophy: quality without compromise, flavor without apology.",
      "What started as a side project has grown into a full-service operation with a growing client roster and a pipeline of products hitting shelves across Jamaica. We are just getting started.",
    ],
    stats: [
      { value: "2023", label: "YEAR FOUNDED" },
      { value: "JA", label: "BORN & BASED" },
      { value: "F&B", label: "INDUSTRY" },
      { value: "MINE", label: "BUILT FROM SCRATCH" },
    ],
    images: [
      { aspect: "aspect-[4/5]", label: "KITCHEN" },
      { aspect: "aspect-[3/2]", label: "EVENT SETUP" },
      { aspect: "aspect-[1/1]", label: "PRODUCT LINE" },
      { aspect: "aspect-[3/4]", label: "CATERING" },
      { aspect: "aspect-[16/9]", label: "TEAM" },
    ],
    link: "#",
    linkLabel: "VISIT ISTRY",
  },
  {
    num: "02",
    name: "SUPERPLUS",
    role: "Legacy",
    year: "EST.",
    tagline: "Family supermarket. Built by my grandmother. Kept alive by us.",
    meta: "LEGACY \u00b7 COMMUNITY RETAIL",
    tags: ["RETAIL", "COMMUNITY", "GROCERY", "FAMILY LEGACY"],
    accent: "#C41E3A",
    description: [
      "SuperPlus was built from the ground up by my grandmother, Hyacinth Gloria Chen. It was then carried forward by my uncles, my father, and my aunt. Today I\u2019m at the heart of a couple of the stores day-to-day \u2014 operating, advising, and keeping the family legacy alive.",
      "Running a community store in Jamaica is an education in patience, relationships, and resilience. Every shelf stocked, every credit extended to a neighbor who promises to pay Friday \u2014 it all adds up to something bigger than commerce. It is trust, built daily.",
      "This is where I learned everything. Retail, margins, community, and how to talk to anyone. SuperPlus isn\u2019t just a business \u2014 it\u2019s where I come from.",
    ],
    stats: [
      { value: "3", label: "GENERATIONS DEEP" },
      { value: "DAILY", label: "I\u2019M THERE" },
      { value: "ROOTS", label: "WHERE I STARTED" },
      { value: "LEGACY", label: "WHAT IT MEANS" },
    ],
    images: [
      { aspect: "aspect-[16/9]", label: "STOREFRONT" },
      { aspect: "aspect-[1/1]", label: "AISLES" },
      { aspect: "aspect-[4/5]", label: "THE COUNTER" },
      { aspect: "aspect-[3/2]", label: "COMMUNITY" },
    ],
    link: "#",
    linkLabel: "THE LEGACY",
  },
  {
    num: "03",
    name: "KEMI",
    role: "Founder",
    year: "2025",
    tagline: "AI product. Actively building.",
    meta: "FOUNDER \u00b7 ACTIVELY BUILDING",
    tags: ["AI", "PRODUCT", "CODE", "DESIGN"],
    accent: "#E5B820",
    description: [
      "Kemi is an AI product I\u2019m actively building \u2014 from concept to code to design to ship. It\u2019s born from running multiple businesses and realizing the tools I needed didn\u2019t exist, so I\u2019m making them.",
      "Built with Next.js, designed in Figma, and shipping from Mandeville. This is the intersection of everything I care about: technology, design, and solving real problems.",
      "Currently in active development. More to come.",
    ],
    stats: [
      { value: "AI", label: "POWERED" },
      { value: "1", label: "BUILDER" },
      { value: "2025", label: "IN PROGRESS" },
      { value: "\u221e", label: "ITERATIONS" },
    ],
    images: [
      { aspect: "aspect-[3/2]", label: "UI CONCEPT" },
      { aspect: "aspect-[1/1]", label: "LOGO MARK" },
      { aspect: "aspect-[4/5]", label: "INTERFACE" },
    ],
    link: "#",
    linkLabel: "STAY TUNED",
  },
  {
    num: "04",
    name: "CARICOM FREIGHT",
    role: "Family",
    year: "EST.",
    tagline: "Family freight & logistics. Keeping goods moving across the Caribbean.",
    meta: "FAMILY \u00b7 LOGISTICS",
    tags: ["FREIGHT", "LOGISTICS", "SHIPPING", "CARIBBEAN"],
    accent: "#C41E3A",
    description: [
      "Caricom Freight is the family logistics business. Caribbean shipping infrastructure that keeps goods moving across the islands.",
      "This is my father\u2019s world \u2014 the logistics backbone that supports everything from retail inventory to commercial freight. Being close to this operation gives me a perspective on supply chain and trade that most tech people never get.",
    ],
    stats: [
      { value: "JA", label: "BASED" },
      { value: "CARIB", label: "COVERAGE" },
      { value: "FAMILY", label: "OPERATED" },
      { value: "EST.", label: "GENERATION" },
    ],
    images: [
      { aspect: "aspect-[16/9]", label: "OPERATIONS" },
      { aspect: "aspect-[1/1]", label: "LOGISTICS" },
      { aspect: "aspect-[3/2]", label: "FLEET" },
    ],
    link: "#",
    linkLabel: "CARICOM FREIGHT",
  },
];
