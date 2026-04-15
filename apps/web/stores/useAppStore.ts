"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Doctor, TestResult, Screen, AppTab } from "@/lib/types";
import type { Questionnaire } from "@/lib/types";

interface AppState {
  screen: Screen;
  doctor: Doctor | null;
  activeTab: AppTab;
  selectedTest: Questionnaire | null;
  result: TestResult | null;
  favoriteIds: string[];
  devBypass: boolean;

  setScreen: (screen: Screen) => void;
  setDoctor: (doctor: Doctor) => void;
  setActiveTab: (tab: AppTab) => void;
  setSelectedTest: (test: Questionnaire | null) => void;
  setResult: (result: TestResult | null) => void;
  toggleFavorite: (id: string) => void;
  setDevBypass: (v: boolean) => void;
  goHome: () => void;
  logout: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      screen: "login",
      doctor: null,
      activeTab: "dashboard",
      selectedTest: null,
      result: null,
      favoriteIds: [],
      devBypass: false,

      setScreen: (screen) => set({ screen }),
      setDoctor: (doctor) => set({ doctor }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedTest: (test) => set({ selectedTest: test }),
      setResult: (result) => set({ result }),
      toggleFavorite: (id) =>
        set((s) => ({
          favoriteIds: s.favoriteIds.includes(id)
            ? s.favoriteIds.filter((x) => x !== id)
            : [...s.favoriteIds, id],
        })),
      setDevBypass: (v) => set({ devBypass: v }),
      goHome: () =>
        set({
          screen: "app",
          activeTab: "dashboard",
          selectedTest: null,
          result: null,
        }),
      logout: () =>
        set({
          doctor: null,
          devBypass: false,
          screen: "login",
          activeTab: "dashboard",
          selectedTest: null,
          result: null,
        }),
    }),
    {
      name: "ds_app",
      partialize: (state) => ({
        doctor: state.doctor,
        favoriteIds: state.favoriteIds,
        devBypass: state.devBypass,
      }),
    }
  )
);
