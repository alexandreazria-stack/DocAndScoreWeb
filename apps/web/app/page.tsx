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
import { CalculatorScreen } from "@/components/screens/CalculatorScreen";
import { BottomNav } from "@/components/ui/BottomNav";
import { useState, useEffect } from "react";
import { supabase, loadProfile, saveProfile } from "@/lib/supabase";
import type { Questionnaire } from "@/lib/types";
import type { Calculator } from "@/lib/calculators/types";

export default function Home() {
  const {
    screen, doctor, activeTab, selectedTest, result,
    setScreen, setDoctor, setActiveTab, setSelectedTest, setResult, goHome, logout,
  } = useAppStore();
  const [showPatientDemo, setShowPatientDemo] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [selectedCalculator, setSelectedCalculator] = useState<Calculator | null>(null);

  // Listen for Supabase auth state
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session) {
          const profile = await loadProfile();
          if (profile) {
            setDoctor(profile);
            setScreen("app");
          } else {
            setScreen("onboarding");
          }
        }
      } catch {
        if (session) setScreen("onboarding");
      } finally {
        setAuthReady(true);
      }
    }).catch(() => {
      setAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && screen === "login") {
        const profile = await loadProfile();
        if (profile) {
          setDoctor(profile);
          setScreen("app");
        } else {
          setScreen("onboarding");
        }
      }
      if (!session) {
        setScreen("login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = () => setScreen("onboarding");
  const handleOnboarding = async (profile: { title: string; lastName: string; firstName: string; specialty: string }) => {
    setDoctor(profile);
    await saveProfile(profile);
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
  const handleSelectCalculator = (calc: Calculator) => {
    setSelectedCalculator(calc);
    setScreen("calculator");
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    logout();
  };

  const shell = (children: React.ReactNode) => (
    <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, overflow: "auto", background: "#EAEFF3", zIndex: 9999 }} className="font-display text-ds-text">
      {children}
    </div>
  );

  if (!authReady) return shell(
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
      <div className="w-10 h-10 border-3 border-ds-sky/20 border-t-ds-sky rounded-full animate-spin" />
    </div>
  );

  if (screen === "login") return shell(<LoginScreen onLogin={handleLogin} />);
  if (screen === "onboarding") return shell(<OnboardingScreen onComplete={handleOnboarding} />);

  if (!doctor) return shell(<LoginScreen onLogin={handleLogin} />);

  if (screen === "calculator" && selectedCalculator) return shell(
    <CalculatorScreen
      calculator={selectedCalculator}
      doctor={doctor}
      onBack={goHome}
    />
  );

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
          onSelectCalculator={handleSelectCalculator}
        />
      )}
      {screen === "app" && activeTab === "search" && (
        <SearchScreen
          onBack={() => setActiveTab("dashboard")}
          onSelectTest={handleSelectTest}
          onSelectQR={handleSelectQR}
          onSelectCalculator={handleSelectCalculator}
        />
      )}
      {screen === "app" && activeTab === "settings" && (
        <SettingsScreen doctor={doctor} onLogout={handleLogout} />
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
