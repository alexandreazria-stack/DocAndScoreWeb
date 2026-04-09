import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResultScreen } from "@/components/screens/ResultScreen";
import type { TestResult, Doctor } from "@/lib/types";

// ── Fixtures ───────────────────────────────────────────────────────────────────

const mockDoctor: Doctor = {
  title: "Dr.",
  firstName: "Jean",
  lastName: "Martin",
  specialty: "general",
  email: "jean.martin@example.com",
};

const mockResult: TestResult = {
  test: {
    id: "phq9",
    acronym: "PHQ-9",
    name: "Patient Health Questionnaire",
    description: "Dépression",
    icon: "🧠",
    category: "psy",
    specialties: ["psy"],
    pathology: "Dépression",
    duration: "3 min",
    isPro: false,
    maxScore: 27,
    scoring: [
      { min: 0, max: 4, label: "Minimal", severity: "normal", color: "#2FAF7E" },
      { min: 5, max: 9, label: "Léger", severity: "mild", color: "#e8943a" },
      { min: 10, max: 27, label: "Modéré à sévère", severity: "moderate", color: "#e05252" },
    ],
    questions: [],
  },
  answers: {},
  totalScore: 6,
  scoring: { min: 5, max: 9, label: "Léger", severity: "mild", color: "#e8943a" },
};

// ──────────────────────────────────────────────────────────────────────────────

beforeEach(() => vi.clearAllMocks());

describe("ResultScreen", () => {
  it("displays the test acronym", () => {
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    expect(screen.getAllByText("PHQ-9").length).toBeGreaterThan(0);
  });

  it("displays the scoring label", () => {
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    expect(screen.getAllByText("Léger").length).toBeGreaterThan(0);
  });

  it("PDF button is disabled until patient name is entered", async () => {
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    const pdfBtn = screen.getByRole("button", { name: /générer le pdf/i });
    expect(pdfBtn).toBeDisabled();
  });

  it("PDF button enables after entering patient name", async () => {
    const user = userEvent.setup();
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    await user.type(screen.getByPlaceholderText("Nom"), "Dupont");
    expect(screen.getByRole("button", { name: /générer le pdf/i })).not.toBeDisabled();
  });

  it("shows PDF preview after clicking generate", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    await user.type(screen.getByPlaceholderText("Nom"), "Dupont");
    await user.click(screen.getByRole("button", { name: /générer le pdf/i }));
    expect(screen.getByText(/aperçu du pdf/i)).toBeInTheDocument();
    // "DUPONT" is a text node inside a mixed-content element — use toHaveTextContent
    expect(container).toHaveTextContent("DUPONT");
  });

  it("copy button calls clipboard.writeText and shows confirmation", async () => {
    // Spy on the vi.fn() already set up in tests/setup.ts
    const writeSpy = vi.spyOn(navigator.clipboard, "writeText");

    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={vi.fn()} />
    );
    fireEvent.change(screen.getByPlaceholderText("Nom"), { target: { value: "Dupont" } });
    fireEvent.click(screen.getByRole("button", { name: /générer le pdf/i }));
    fireEvent.click(screen.getByText(/📋 Copier/));

    // UI feedback: button switches to "✓ Copié !"
    await waitFor(() => {
      expect(screen.getByText(/Copié/)).toBeInTheDocument();
    });
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("PHQ-9"));
  });

  it("calls onBack when back button is clicked", () => {
    const onBack = vi.fn();
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={onBack} onHome={vi.fn()} />
    );
    // ← is the first button in the header
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it("calls onHome when home link is clicked", () => {
    const onHome = vi.fn();
    render(
      <ResultScreen result={mockResult} doctor={mockDoctor} onBack={vi.fn()} onHome={onHome} />
    );
    fireEvent.click(screen.getByText(/retour à l'accueil/i));
    expect(onHome).toHaveBeenCalled();
  });
});
