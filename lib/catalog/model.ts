export type Conference = {
  id: number; name: string; start: string; end?: string; venue: string; banner?: string; agenda?: string;
  accessLink?: string; speciality?: string; amount: string; type: "Paid" | "Free"; status: "Upcoming" | "Live" | "Recorded"; attendees: number;
};
export type Faculty = { id: number; name: string; email: string; phone: string; institute: string; speciality: string };
export type Speciality = { id: number; name: string };
export type FacultyVideo = { id: number; facultyId: number; title: string; speciality: string; link: string; type: "Paid" | "Free"; amount: string };
export type Member = { name: string; email: string; phoneCode: string; mobile: string; institute: string; speciality: string };

export const initialVideos: FacultyVideo[] = [
  { id: 1, facultyId: 1, title: "Robotic surgery: the next frontier", speciality: "Uro-Oncology", link: "https://video.meditalk.in/robotics", type: "Free", amount: "Free" },
  { id: 2, facultyId: 2, title: "A practical guide to ureteroscopy", speciality: "Endourology", link: "https://video.meditalk.in/ureteroscopy", type: "Paid", amount: "INR 499" },
  { id: 3, facultyId: 1, title: "Immunotherapy in advanced disease", speciality: "Uro-Oncology", link: "https://video.meditalk.in/immunotherapy", type: "Paid", amount: "INR 299" },
];
export const initialSpecialities: Speciality[] = [
  { id: 1, name: "Uro-Oncology" }, { id: 2, name: "Endourology" }, { id: 3, name: "Andrology" },
  { id: 4, name: "Pediatric Urology" }, { id: 5, name: "Reconstructive Urology" }, { id: 6, name: "General Urology" }, { id: 7, name: "Other" },
];
export const initialConferences: Conference[] = [
  { id: 1, name: "Advances in Uro-Oncology 2026", start: "Oct 18, 2026 | 09:00 AM", venue: "Taj Palace, New Delhi", banner: "/conference-placeholder.svg", speciality: "Uro-Oncology", amount: "INR 2,500", type: "Paid", status: "Upcoming", attendees: 248 },
  { id: 2, name: "Endourology Masterclass", start: "Oct 12, 2026 | 10:30 AM", venue: "Online | Meditalk Live", banner: "/conference-placeholder.svg", speciality: "Endourology", amount: "Free", type: "Free", status: "Live", attendees: 186 },
  { id: 3, name: "Urology Update 2025", start: "Dec 08, 2025 | 09:00 AM", venue: "ITC Grand Chola, Chennai", banner: "/conference-placeholder.svg", speciality: "General Urology", amount: "INR 1,800", type: "Paid", status: "Recorded", attendees: 524 },
];
export const initialFaculty: Faculty[] = [
  { id: 1, name: "Dr. Arjun Mehta", email: "arjun.mehta@meditalk.in", phone: "+91 98765 43210", institute: "Apollo Hospitals, Delhi", speciality: "Uro-Oncology" },
  { id: 2, name: "Dr. Priya Nair", email: "priya.nair@meditalk.in", phone: "+91 98470 12345", institute: "CMC Vellore", speciality: "Endourology" },
  { id: 3, name: "Dr. Rohan Iyer", email: "rohan.iyer@meditalk.in", phone: "+91 98400 87654", institute: "Manipal Hospital, Bengaluru", speciality: "Andrology" },
];
