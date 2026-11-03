export type PromotionalConference = {
  slug: string;
  name: string;
  shortName: string;
  subtitle: string;
  category: string;
  dates: string;
  venue: string;
  schedule: string[];
  theme: string;
  image: string;
};

export const promotionalConferences: PromotionalConference[] = [
  {
    slug: "nsicon-2026",
    name: "NSICON 2026",
    shortName: "NSICON",
    subtitle: "75th Year Celebrations of the Neurological Society of India",
    category: "Neurology",
    dates: "9–13 December 2026",
    venue: "The Forum – Celebration & Convention, near Club 07, Shela, Ahmedabad – 380058",
    schedule: [
      "9 December 2026 · Workshop",
      "10 December 2026 · CME",
      "11–13 December 2026 · Main conference",
    ],
    theme: "nsicon",
    image: "/nsicon2026.png",
  },
  {
    slug: "transmedcon-2026",
    name: "TRANSMEDCON 2026 · Bhubaneswar",
    shortName: "TRANSMEDCON",
    subtitle: "14th Annual National Conference of the Indian Society of Transfusion Medicine",
    category: "Transfusion Medicine",
    dates: "19–22 November 2026",
    venue: "Mayfair Hotels & Resorts, Bhubaneswar",
    schedule: [
      "19 November 2026 · Pre-conference workshop",
      "20–22 November 2026 · Conference",
    ],
    theme: "transmedcon",
    image: "/transmedcon2026.png",
  },
  {
    slug: "ampicon-2026",
    name: "AMPICON 2026 · Goa",
    shortName: "AMPICON",
    subtitle: "47th Annual Conference of the Association of Medical Physicists of India",
    category: "Medical Physics",
    dates: "10–12 December 2026",
    venue: "Ravindra Bhavan, Goa",
    schedule: ["10–12 December 2026 · Annual conference"],
    theme: "ampicon",
    image: "/ampicon2026.png",
  },
  {
    slug: "isnacc-2027",
    name: "ISNACC 2027 · Bhubaneswar",
    shortName: "ISNACC",
    subtitle: "28th Annual Conference of the Indian Society of Neuroanaesthesiology and Critical Care",
    category: "Neuroanaesthesiology & Critical Care",
    dates: "21–23 January 2027",
    venue: "Bhubaneswar, Odisha",
    schedule: ["21–23 January 2027 · Annual conference"],
    theme: "isnacc",
    image: "/isnacc2027.png",
  },
];
