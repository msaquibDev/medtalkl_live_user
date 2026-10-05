"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import type { Conference, Faculty, FacultyVideo, Speciality } from "@/lib/catalog/model";
import { initialConferences, initialFaculty, initialSpecialities, initialVideos } from "@/lib/catalog/model";

type Catalog = {
  conferences: Conference[]; setConferences: Dispatch<SetStateAction<Conference[]>>;
  faculty: Faculty[]; setFaculty: Dispatch<SetStateAction<Faculty[]>>;
  videos: FacultyVideo[]; setVideos: Dispatch<SetStateAction<FacultyVideo[]>>;
  specialities: Speciality[]; setSpecialities: Dispatch<SetStateAction<Speciality[]>>;
};
const CatalogContext = createContext<Catalog | null>(null);
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [conferences, setConferences] = useState(initialConferences);
  const [faculty, setFaculty] = useState(initialFaculty);
  const [videos, setVideos] = useState(initialVideos);
  const [specialities, setSpecialities] = useState(initialSpecialities);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("meditalk-admin-data") || localStorage.getItem("meditalk-content") || "null") as Partial<Catalog> | null;
      if (saved?.conferences) setConferences(saved.conferences);
      if (saved?.faculty) setFaculty(saved.faculty);
      if (saved?.videos) setVideos(saved.videos);
      if (saved?.specialities) setSpecialities(saved.specialities);
    } catch { /* Keep bundled catalog if saved content is unavailable. */ }
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("meditalk-content", JSON.stringify({ conferences, faculty, videos, specialities }));
  }, [hydrated, conferences, faculty, videos, specialities]);
  const value = useMemo(() => ({ conferences, setConferences, faculty, setFaculty, videos, setVideos, specialities, setSpecialities }), [conferences, faculty, videos, specialities]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}
export function useCatalog() {
  const value = useContext(CatalogContext);
  if (!value) throw new Error("useCatalog must be used within CatalogProvider");
  return value;
}
