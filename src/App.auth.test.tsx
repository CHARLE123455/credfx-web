import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { TOKEN_KEY } from "./lib/api";
import { installFetchMock, lastBody } from "./test/mockFetch";

const adminUser = {
  createdAt: "2024-01-01T00:00:00.000Z",
  id: "u1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  role: "USER",
  isVerified: true,
};

const emptyDashboard = {
  "/wallet": { body: { data: { balances: [] } } },
  "/fx/rates": { body: { data: { rates: {}, source: "live" } } },
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("App bootstrap", () => {
  it("shows the login screen when no token is stored", async () => {
    installFetchMock({});

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("injects the stylesheet and styles exactly once", async () => {
    installFetchMock({});

    const { unmount } = render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    unmount();
    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });

    expect(document.querySelectorAll("#credfx-styles")).toHaveLength(1);
    expect(document.querySelectorAll('link[rel="stylesheet"]')).toHaveLength(1);
  });

  it("restores the session from a stored token", async () => {
    localStorage.setItem(TOKEN_KEY, "tok-123");
    installFetchMock({ "/auth/me": { body: { data: adminUser } }, ...emptyDashboard });

    render(<App />);

    expect(await screen.findByRole("heading", { name: /Good day, Ada/ })).toBeInTheDocument();
  });

  it("drops an invalid token and falls back to the login screen", async () => {
    localStorage.setItem(TOKEN_KEY, "expired");
    installFetchMock({ "/auth/me": { status: 401, body: { message: "Token expired" } } });

    render(<App />);

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("login", () => {
  it("stores the access token and opens the dashboard", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock({
      "/auth/login": { body: { data: { accessToken: "tok-abc", user: adminUser } } },
      ...emptyDashboard,
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    await screen.findByRole("heading", { name: /Good day, Ada/ });
    expect(localStorage.getItem(TOKEN_KEY)).toBe("tok-abc");
    expect(lastBody(fetchMock, "/auth/login")).toEqual({ email: "ada@example.com", password: "secret123" });
  });

  it("submits on Enter from the password field", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock({
      "/auth/login": { body: { data: { accessToken: "tok-abc", user: adminUser } } },
      ...emptyDashboard,
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123{Enter}");

    await screen.findByRole("heading", { name: /Good day, Ada/ });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/auth/login"))).toHaveLength(1);
  });

  it("shows the server error and keeps the user on the login screen", async () => {
    const user = userEvent.setup();
    installFetchMock({ "/auth/login": { status: 401, body: { message: "Invalid credentials" } } });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "wrong");
    await user.click(screen.getByRole("button", { name: "Sign In" }));

    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it("signs the user out and clears the token", async () => {
    const user = userEvent.setup();
    localStorage.setItem(TOKEN_KEY, "tok-123");
    installFetchMock({ "/auth/me": { body: { data: adminUser } }, ...emptyDashboard });

    render(<App />);
    await screen.findByRole("heading", { name: /Good day, Ada/ });
    await user.click(screen.getByText("Sign Out"));

    await screen.findByRole("heading", { name: "Welcome back" });
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });
});

describe("registration and verification", () => {
  it("registers, then advances to the OTP screen", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock({ "/auth/register": { body: { message: "OTP sent to your email" } } });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.click(screen.getByText("Create one"));
    await user.type(screen.getByLabelText("First name"), "Ada");
    await user.type(screen.getByLabelText("Last name"), "Obi");
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("OTP sent to your email")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/auth/register")).toEqual({
      email: "ada@example.com",
      password: "secret123",
      firstName: "Ada",
      lastName: "Obi",
    });

    expect(await screen.findByRole("heading", { name: "Check your email" }, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText("ada@example.com")).toBeInTheDocument();
  });

  it("shows a registration failure without leaving the form", async () => {
    const user = userEvent.setup();
    installFetchMock({ "/auth/register": { status: 409, body: { message: "Email already registered" } } });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.click(screen.getByText("Create one"));
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    expect(await screen.findByText("Email already registered")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create account" })).toBeInTheDocument();
  });

  it("verifies the OTP against the pending email and returns to login", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock({
      "/auth/register": { body: { message: "OTP sent" } },
      "/auth/verify": { body: { message: "verified" } },
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.click(screen.getByText("Create one"));
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await user.type(await screen.findByLabelText("OTP Code", {}, { timeout: 3000 }), "123456");
    await user.click(screen.getByRole("button", { name: "Verify Email" }));

    expect(await screen.findByText("Verified! Redirecting to login…")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/auth/verify")).toEqual({ email: "ada@example.com", otp: "123456" });

    expect(await screen.findByRole("heading", { name: "Welcome back" }, { timeout: 3000 })).toBeInTheDocument();
  });

  it("reports a rejected OTP", async () => {
    const user = userEvent.setup();
    installFetchMock({
      "/auth/register": { body: { message: "OTP sent" } },
      "/auth/verify": { status: 400, body: { message: "Invalid OTP" } },
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.click(screen.getByText("Create one"));
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await user.type(await screen.findByLabelText("OTP Code", {}, { timeout: 3000 }), "000000");
    await user.click(screen.getByRole("button", { name: "Verify Email" }));

    expect(await screen.findByText("Invalid OTP")).toBeInTheDocument();
  });

  it("resends the OTP to the pending email", async () => {
    const user = userEvent.setup();
    const fetchMock = installFetchMock({
      "/auth/register": { body: { message: "OTP sent" } },
      "/auth/resend-otp": { body: { message: "resent" } },
    });

    render(<App />);
    await screen.findByRole("heading", { name: "Welcome back" });
    await user.click(screen.getByText("Create one"));
    await user.type(screen.getByLabelText("Email address"), "ada@example.com");
    await user.type(screen.getByLabelText("Password"), "secret123");
    await user.click(screen.getByRole("button", { name: "Create Account" }));

    await user.click(await screen.findByRole("button", { name: "Resend OTP" }, { timeout: 3000 }));

    await waitFor(() => expect(screen.getByText("New OTP sent!")).toBeInTheDocument());
    expect(lastBody(fetchMock, "/auth/resend-otp")).toEqual({ email: "ada@example.com" });
  });
});
