import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { TOKEN_KEY } from "./lib/api";
import { installFetchMock, lastBody, type Responder } from "./test/mockFetch";

const profile = (role: string) => ({
  createdAt: "2024-01-01T00:00:00.000Z",
  id: "u1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  role,
  isVerified: true,
});

const tx = (over: Partial<Record<string, unknown>> = {}) => ({
  id: "t1",
  reference: "REF-1",
  type: "FUNDING",
  fromCurrency: "NGN",
  toCurrency: "NGN",
  amount: 5000,
  convertedAmount: 0,
  rateUsed: 0,
  status: "SUCCESS",
  createdAt: "2024-03-05T10:00:00.000Z",
  ...over,
});

const renderApp = (role: string, overrides: Record<string, Responder> = {}) => {
  const fetchMock = installFetchMock({
    "/auth/me": { body: { data: profile(role) } },
    "/wallet": { body: { data: { balances: [] } } },
    "/fx/rates": { body: { data: { rates: { USD: 0.00065 }, source: "live" } } },
    ...overrides,
  });
  render(<App />);
  return fetchMock;
};

beforeEach(() => {
  localStorage.setItem(TOKEN_KEY, "tok-123");
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("navigation", () => {
  it("hides the admin tab from non-admin users", async () => {
    renderApp("USER");

    await screen.findByRole("heading", { name: /Good day, Ada/ });
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
  });

  it("shows the admin tab for admins", async () => {
    renderApp("ADMIN", { "/admin/users": { body: { data: { users: [], total: 0 } } } });

    await screen.findByRole("heading", { name: /Good day, Ada/ });
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });
});

describe("FX rates page", () => {
  const openFx = async (u: ReturnType<typeof userEvent.setup>) => {
    await screen.findByRole("heading", { name: /Good day, Ada/ });
    await u.click(screen.getByText("FX Rates"));
  };

  it("lists rates for the selected base and excludes the base itself", async () => {
    const u = userEvent.setup();
    renderApp("USER", {
      "/fx/rates": { body: { data: { rates: { NGN: 1, USD: 0.00065, EUR: 0.0006 }, source: "live" } } },
    });

    await openFx(u);

    expect(await screen.findByText("US Dollar")).toBeInTheDocument();
    expect(screen.getByText("Euro")).toBeInTheDocument();
    expect(screen.queryByText("Nigerian Naira")).not.toBeInTheDocument();
    expect(screen.getByText("🟢 Live · Refreshes every 5 min")).toBeInTheDocument();
  });

  it("formats tiny rates in exponential notation and others to 4 decimals", async () => {
    const u = userEvent.setup();
    renderApp("USER", {
      "/fx/rates": { body: { data: { rates: { USD: 0.00065, ZAR: 0.012345 }, source: "cache" } } },
    });

    await openFx(u);

    expect(await screen.findByText("6.500e-4")).toBeInTheDocument();
    expect(screen.getByText("0.0123")).toBeInTheDocument();
    expect(screen.getByText("📦 Cached · Refreshes every 5 min")).toBeInTheDocument();
  });

  it("refetches rates when the base currency changes", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("USER");

    await openFx(u);
    await screen.findByText("US Dollar");
    await u.selectOptions(screen.getByLabelText("Base currency"), "USD");

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/fx/rates?base=USD"))).toBe(true),
    );
  });

  it("refetches rates when Refresh is clicked", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("USER");

    await openFx(u);
    await screen.findByText("US Dollar");
    const before = fetchMock.mock.calls.filter(([url]) => String(url).includes("/fx/rates")).length;
    await u.click(screen.getByRole("button", { name: "Refresh" }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/fx/rates")).length).toBe(before + 1),
    );
  });
});

describe("Transactions page", () => {
  const openTransactions = async (u: ReturnType<typeof userEvent.setup>) => {
    await screen.findByRole("heading", { name: /Good day, Ada/ });
    await u.click(screen.getByText("Transactions"));
  };

  it("renders each transaction row with formatted amounts and dates", async () => {
    const u = userEvent.setup();
    renderApp("USER", {
      "/transactions": {
        body: {
          data: {
            transactions: [
              tx(),
              tx({ id: "t2", reference: "REF-2", type: "TRADE", toCurrency: "USD", amount: 1000, convertedAmount: 0.65, rateUsed: 0.00065 }),
            ],
            total: 2,
          },
        },
      },
    });

    await openTransactions(u);

    expect(await screen.findByText("REF-1")).toBeInTheDocument();
    expect(screen.getByText("2 total records")).toBeInTheDocument();
    expect(screen.getByText("↓ FUNDING")).toBeInTheDocument();
    expect(screen.getByText("↗ TRADE")).toBeInTheDocument();
    expect(screen.getByText("0.6500")).toBeInTheDocument();
    expect(screen.getByText("0.00065")).toBeInTheDocument();
    expect(screen.getAllByText("05 Mar 2024")).toHaveLength(2);
  });

  it("shows an empty state when there are no transactions", async () => {
    const u = userEvent.setup();
    renderApp("USER", { "/transactions": { body: { data: { transactions: [], total: 0 } } } });

    await openTransactions(u);

    expect(await screen.findByText("No transactions found")).toBeInTheDocument();
    expect(screen.getByText("0 total records")).toBeInTheDocument();
  });

  it("requests the selected type filter and resets to page 1", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("USER", {
      "/transactions": { body: { data: { transactions: [tx()], total: 1 } } },
    });

    await openTransactions(u);
    await screen.findByText("REF-1");
    await u.selectOptions(screen.getByLabelText("Filter by type"), "TRADE");

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("page=1&limit=20&type=TRADE"))).toBe(true),
    );
  });

  it("pages through results", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("USER", {
      "/transactions": { body: { data: { transactions: [tx()], total: 45 } } },
    });

    await openTransactions(u);

    expect(await screen.findByText("Page 1 of 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "← Prev" })).toBeDisabled();

    await u.click(screen.getByRole("button", { name: "Next →" }));

    expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument();
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes("page=2"))).toBe(true);
    expect(screen.getByRole("button", { name: "← Prev" })).toBeEnabled();
  });

  it("hides pagination when everything fits on one page", async () => {
    const u = userEvent.setup();
    renderApp("USER", { "/transactions": { body: { data: { transactions: [tx()], total: 5 } } } });

    await openTransactions(u);

    await screen.findByText("REF-1");
    expect(screen.queryByRole("button", { name: "Next →" })).not.toBeInTheDocument();
  });
});

describe("Admin page", () => {
  const adminRoutes = {
    "/admin/users": { body: { data: { users: [profile("USER"), { ...profile("ADMIN"), id: "u2", email: "bo@example.com", firstName: "Bo", isVerified: false }], total: 2 } } },
    "/admin/analytics/summary": {
      body: {
        data: {
          users: { total: 2, verified: 1, unverified: 1 },
          transactions: { byType: [{ type: "FUNDING", count: "7" }], byCurrency: [] },
          topUsers: [],
        },
      },
    },
    "/admin/analytics/fx-trends": {
      body: { data: [{ baseCurrency: "NGN", rates: { USD: 0.00065 }, fetchedAt: "2024-03-05T10:00:00.000Z" }] },
    },
    "/admin/transactions": { body: { data: { transactions: [tx({ user: { id: "u1", email: "ada@example.com", firstName: "Ada", lastName: "Obi" } })], total: 1 } } },
  } satisfies Record<string, Responder>;

  const openAdmin = async (u: ReturnType<typeof userEvent.setup>) => {
    await screen.findByRole("heading", { name: /Good day, Ada/ });
    await u.click(screen.getByText("Admin"));
  };

  it("lists users with verification and role badges", async () => {
    const u = userEvent.setup();
    renderApp("ADMIN", adminRoutes);

    await openAdmin(u);

    expect(await screen.findByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
    expect(screen.getByText("bo@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make Admin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Make User" })).toBeInTheDocument();
  });

  it("promotes a user and reloads the list", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("ADMIN", { ...adminRoutes, "/admin/users/u1/role": { body: { message: "ok" } } });

    await openAdmin(u);
    await u.click(await screen.findByRole("button", { name: "Make Admin" }));

    expect(await screen.findByText("Role updated to ADMIN")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/admin/users/u1/role")).toEqual({ role: "ADMIN" });
  });

  it("reports a failed role change", async () => {
    const u = userEvent.setup();
    renderApp("ADMIN", {
      ...adminRoutes,
      "/admin/users/u1/role": { status: 403, body: { message: "Not allowed" } },
    });

    await openAdmin(u);
    await u.click(await screen.findByRole("button", { name: "Make Admin" }));

    expect(await screen.findByText("Not allowed")).toBeInTheDocument();
  });

  it("summarizes user and transaction analytics", async () => {
    const u = userEvent.setup();
    renderApp("ADMIN", adminRoutes);

    await openAdmin(u);
    await u.click(screen.getByRole("button", { name: "Analytics" }));

    expect(await screen.findByText("Total Users")).toBeInTheDocument();
    expect(screen.getAllByText("FUNDING").length).toBeGreaterThan(0);
    expect(screen.getByText("Total Transactions")).toBeInTheDocument();
    expect(screen.getByText("Daily Transaction Activity")).toBeInTheDocument();
    expect(screen.getByText("Recent Activity Log")).toBeInTheDocument();
  });

  it("defaults analytics counters to zero when the payload is empty", async () => {
    const u = userEvent.setup();
    renderApp("ADMIN", {
      ...adminRoutes,
      "/admin/analytics/summary": { body: { data: {} } },
      "/admin/transactions": { body: { data: {} } },
    });

    await openAdmin(u);
    await u.click(screen.getByRole("button", { name: "Analytics" }));

    await screen.findByText("Total Users");
    expect(screen.getAllByText("0").length).toBeGreaterThanOrEqual(3);
  });

  it("renders the fx trends tab", async () => {
    const u = userEvent.setup();
    const fetchMock = renderApp("ADMIN", adminRoutes);

    await openAdmin(u);
    await u.click(screen.getByRole("button", { name: "FX Trends" }));

    await waitFor(() =>
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes("/admin/analytics/fx-trends?base=NGN&limit=20"))).toBe(true),
    );
  });

  it("shows platform-wide transactions with their owning user", async () => {
    const u = userEvent.setup();
    renderApp("ADMIN", adminRoutes);

    await openAdmin(u);
    await u.click(screen.getByRole("button", { name: "All Transactions" }));

    expect((await screen.findAllByText("Ada Obi")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("ada@example.com").length).toBeGreaterThan(0);
  });

  it("keeps the panel usable when an admin request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const u = userEvent.setup();
    renderApp("ADMIN", { ...adminRoutes, "/admin/users": { status: 500, body: { message: "boom" } } });

    await openAdmin(u);

    expect(await screen.findByRole("heading", { name: "Admin Panel" })).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});
