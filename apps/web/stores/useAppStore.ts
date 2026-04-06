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

  setScreen: (screen: Screen) => void;
  setDoctor: (doctor: Doctor) => void;
  setActiveTab: (tab: AppTab) => void;
  setSelectedTest: (test: Questionnaire | null) => void;
  setResult: (result: TestResult | null) => void;
  goHome: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      screen: "login",
      doctor: null,
      activeTab: "dashboard",
      selectedTest: null,
      result: null,

      setScreen: (screen) => set({ screen }),
      setDoctor: (doctor) => set({ doctor }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedTest: (test) => set({ selectedTest: test }),
      setResult: (result) => set({ result }),
      goHome: () =>
        set({
          screen: "app",
          activeTab: "dashboard",
          selectedTest: null,
          result: null,
        }),
    }),
    {
      name: "ds_app",
      partialize: (state) => ({ doctor: state.doctor }),
    }
  )
);
