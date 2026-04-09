import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginScreen } from "@/components/screens/LoginScreen";

// ── Mock Supabase ──────────────────────────────────────────────────────────────
// vi.hoisted ensures these exist before vi.mock factory runs (hoisting requirement)
const { mockSignIn, mockSignUp, mockOAuth } = vi.hoisted(() => ({
  mockSignIn: vi.fn(),
  mockSignUp: vi.fn(),
  mockOAuth: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signInWithOAuth: mockOAuth,
    },
  },
}));

// ──────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ error: null });
  mockSignUp.mockResolvedValue({ error: null });
  mockOAuth.mockResolvedValue({ error: null });
});

describe("LoginScreen", () => {
  it("renders connexion form by default", () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    expect(screen.getByPlaceholderText(/dr\.martin/i)).toBeInTheDocument();
    expect(screen.getByText("Se connecter")).toBeInTheDocument();
  });

  it("submit button is disabled when email is invalid", () => {
    render(<LoginScreen onLogin={vi.fn()} />);
    const btn = screen.getByRole("button", { name: /se connecter/i });
    expect(btn).toBeDisabled();
  });

  it("submit button becomes enabled with valid email and password", async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/dr\.martin/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/minimum 8/i), "password123");

    const btn = screen.getByRole("button", { name: /se connecter/i });
    expect(btn).not.toBeDisabled();
  });

  it("calls signInWithPassword on valid submit", async () => {
    const user = userEvent.setup();
    const onLogin = vi.fn();
    render(<LoginScreen onLogin={onLogin} />);

    await user.type(screen.getByPlaceholderText(/dr\.martin/i), "test@example.com");
    await user.type(screen.getByPlaceholderText(/minimum 8/i), "password123");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows error message on failed sign in", async () => {
    mockSignIn.mockResolvedValue({ error: { message: "Invalid credentials" } });
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    await user.type(screen.getByPlaceholderText(/dr\.martin/i), "bad@example.com");
    await user.type(screen.getByPlaceholderText(/minimum 8/i), "wrongpass");
    await user.click(screen.getByRole("button", { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText("Invalid credentials")).toBeInTheDocument();
    });
  });

  it("switches to sign-up mode and validates password match", async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    await user.click(screen.getByText("Créer un compte"));
    expect(screen.getByPlaceholderText(/retapez/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/dr\.martin/i), "new@example.com");
    await user.type(screen.getByPlaceholderText(/minimum 8/i), "password123");
    await user.type(screen.getByPlaceholderText(/retapez/i), "different456");

    expect(screen.getByText(/ne correspondent pas/i)).toBeInTheDocument();
  });

  it("calls signUp with emailRedirectTo on valid sign-up", async () => {
    const user = userEvent.setup();
    render(<LoginScreen onLogin={vi.fn()} />);

    await user.click(screen.getByText("Créer un compte"));
    await user.type(screen.getByPlaceholderText(/dr\.martin/i), "new@example.com");
    await user.type(screen.getByPlaceholderText(/minimum 8/i), "password123");
    await user.type(screen.getByPlaceholderText(/retapez/i), "password123");
    await user.click(screen.getByRole("button", { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "new@example.com",
          password: "password123",
          options: expect.objectContaining({ emailRedirectTo: expect.any(String) }),
        })
      );
    });
  });
});
