"use client";
import { useAppStore } from "@/stores/useAppStore";
import { LoginScreen } from "@/components/screens/LoginScreen";
import { OnboardingScreen } from "@/components/screens/OnboardingScreen";
import { DashboardScreen } from "@/components/screens/DashboardScreen";
import { SearchScreen } from "@/components/screens/SearchScreen";
import { TestScreen } from "@/components/screens/TestScreen";
import { ResultScreen } from "@/components/screens/ResultScreen";
import { QRScreen } from "@/components/screens/QRScreen";
import { PatientScreen } from "@/components/screens/PatientScreen";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState } from "react";
import type { Questionnaire } from "@/lib/types";

export default function Home() {
  const {
    screen, doctor, activeTab, selectedTest, result,
    setScreen, setDoctor, setActiveTab, setSelectedTest, setResult, goHome,
  } = useAppStore();
  const [showPatientDemo, setShowPatientDemo] = useState(false);

  const handleLogin = () => setScreen("onboarding");
  const handleOnboarding = (profile: { title: string; lastName: string; firstName: string; specialty: string }) => {
    setDoctor(profile);
    setScreen("app");
  };
  const handleSelectTest = (test: Questionnaire) => {
    setSelectedTest(test);
    setScreen("test");
  };
  const handleSelectQR = (test: Questionnaire) => {
    setSelectedTest(test);
    setScreen("qr");
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", background: "#EAEFF3", zIndex: 9999 }} className="font-display text-ds-text">
      {children}
    </div>
  );

  if (screen === "login") return shell(<LoginScreen onLogin={handleLogin} />);
  if (screen === "onboarding") return shell(<OnboardingScreen onComplete={handleOnboarding} />);

  if (!doctor) return shell(<LoginScreen onLogin={handleLogin} />);

  if (showPatientDemo && selectedTest) {
    return shell(
      <PatientScreen
        test={selectedTest}
        doctor={doctor}
        onComplete={() => { setShowPatientDemo(false); goHome(); }}
      />
    );
  }

  return shell(
    <>
      {screen === "app" && activeTab === "dashboard" && (
        <DashboardScreen
          doctor={doctor}
          onNavigate={setActiveTab}
          onSelectTest={handleSelectTest}
          onSelectQR={handleSelectQR}
        />
      )}
      {screen === "app" && activeTab === "search" && (
        <SearchScreen
          onBack={() => setActiveTab("dashboard")}
          onSelectTest={handleSelectTest}
          onSelectQR={handleSelectQR}
        />
      )}
      {screen === "app" && activeTab === "settings" && (
        <SettingsScreen doctor={doctor} />
      )}
      {screen === "test" && selectedTest && (
        <TestScreen
          test={selectedTest}
          onBack={goHome}
          onResult={(r) => { setResult(r); setScreen("result"); }}
        />
      )}
      {screen === "result" && result && (
        <ResultScreen
          result={result}
          doctor={doctor}
          onBack={() => setScreen("test")}
          onHome={goHome}
        />
      )}
      {screen === "qr" && selectedTest && (
        <QRScreen
          test={selectedTest}
          doctor={doctor}
          onBack={goHome}
          onResult={(r) => { setResult(r); setScreen("result"); }}
          onShowPatient={() => setShowPatientDemo(true)}
        />
      )}
      {screen === "app" && <BottomNav active={activeTab} onNavigate={setActiveTab} />}
    </>
  );
}
