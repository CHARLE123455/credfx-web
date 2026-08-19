import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { TOKEN_KEY } from "./lib/api";
import { installFetchMock, lastBody, type Responder } from "./test/mockFetch";

const user = {
  createdAt: "2024-01-01T00:00:00.000Z",
  id: "u1",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Obi",
  role: "USER",
  isVerified: true,
};

const rates = { USD: 0.00065, EUR: 0.0006, NGN: 1 };

const balances = [
  { id: "b1", currency: "NGN", balance: 150000 },
  { id: "b2", currency: "USD", balance: 65 },
];

const renderDashboard = (overrides: Record<string, Responder> = {}) => {
  const fetchMock = installFetchMock({
    "/auth/me": { body: { data: user } },
    "/wallet": { body: { data: { balances } } },
    "/fx/rates": { body: { data: { rates, source: "live" } } },
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

describe("Dashboard", () => {
  it("renders one card per balance with its currency name", async () => {
    renderDashboard();

    expect(await screen.findByText("Nigerian Naira")).toBeInTheDocument();
    expect(screen.getByText("US Dollar")).toBeInTheDocument();
    expect(screen.getByText("150,000")).toBeInTheDocument();
  });

  it("totals foreign balances into their NGN equivalent", async () => {
    renderDashboard();

    // 150,000 NGN + 65 USD / 0.00065 = 250,000 NGN
    expect(await screen.findByText("₦250,000.00")).toBeInTheDocument();
  });

  it("skips balances that have no rate for the total", async () => {
    renderDashboard({
      "/wallet": { body: { data: { balances: [...balances, { id: "b3", currency: "XAF", balance: 999 }] } } },
    });

    expect(await screen.findByText("₦250,000.00")).toBeInTheDocument();
    expect(screen.getByText("💱")).toBeInTheDocument();
  });

  it("shows an empty state when the wallet has no balances", async () => {
    renderDashboard({ "/wallet": { body: { data: { balances: [] } } } });

    expect(await screen.findByText("No balances yet. Fund your wallet to get started.")).toBeInTheDocument();
    expect(screen.getByText("₦0.00")).toBeInTheDocument();
  });

  it("keeps rendering when the wallet request fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderDashboard({ "/wallet": { status: 500, body: { message: "boom" } } });

    expect(await screen.findByText("No balances yet. Fund your wallet to get started.")).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});

describe("Fund modal", () => {
  it("funds the selected currency and reloads the wallet", async () => {
    const u = userEvent.setup();
    const fetchMock = renderDashboard({ "/wallet/fund": { body: { message: "ok" } } });

    await u.click(await screen.findByRole("button", { name: "Fund Wallet" }));
    await u.type(screen.getByLabelText("Amount"), "500");
    await u.selectOptions(screen.getByLabelText("Currency"), "USD");
    await u.click(screen.getByRole("button", { name: "Fund USD Wallet" }));

    expect(await screen.findByText("Wallet funded successfully!")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/wallet/fund")).toEqual({ amount: 500, currency: "USD" });
    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes("/wallet?") || String(url).endsWith("/wallet")).length).toBeGreaterThan(1);
  });

  it("disables the submit button until an amount is entered", async () => {
    const u = userEvent.setup();
    renderDashboard();

    await u.click(await screen.findByRole("button", { name: "Fund Wallet" }));
    expect(screen.getByRole("button", { name: "Fund NGN Wallet" })).toBeDisabled();

    await u.type(screen.getByLabelText("Amount"), "10");
    expect(screen.getByRole("button", { name: "Fund NGN Wallet" })).toBeEnabled();
  });

  it("shows the server error and stays open", async () => {
    const u = userEvent.setup();
    renderDashboard({ "/wallet/fund": { status: 400, body: { message: "Amount too small" } } });

    await u.click(await screen.findByRole("button", { name: "Fund Wallet" }));
    await u.type(screen.getByLabelText("Amount"), "1");
    await u.click(screen.getByRole("button", { name: "Fund NGN Wallet" }));

    expect(await screen.findByText("Amount too small")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Fund Wallet" })).toBeInTheDocument();
  });

  it("closes on backdrop click", async () => {
    const u = userEvent.setup();
    renderDashboard();

    await u.click(await screen.findByRole("button", { name: "Fund Wallet" }));
    const heading = screen.getByRole("heading", { name: "Fund Wallet" });
    await u.click(document.querySelector(".cf-backdrop") as HTMLElement);

    await waitFor(() => expect(heading).not.toBeInTheDocument());
  });
});

describe("Convert modal", () => {
  it("previews the converted amount at the live rate", async () => {
    const u = userEvent.setup();
    renderDashboard();

    await u.click(await screen.findByRole("button", { name: "Convert" }));
    await u.type(screen.getByLabelText("Amount (NGN)"), "100000");

    const preview = await screen.findByText("65.000000 USD");
    expect(preview).toBeInTheDocument();
    expect(screen.getByText("Rate: 1 NGN = 0.00065 USD · Zero fee")).toBeInTheDocument();
  });

  it("blocks conversion between identical currencies", async () => {
    const u = userEvent.setup();
    renderDashboard();

    await u.click(await screen.findByRole("button", { name: "Convert" }));
    await u.type(screen.getByLabelText("Amount (NGN)"), "1000");
    await u.selectOptions(screen.getByLabelText("To currency"), "NGN");

    expect(screen.getByRole("button", { name: "Convert Now" })).toBeDisabled();
  });

  it("submits the conversion and reports success", async () => {
    const u = userEvent.setup();
    const fetchMock = renderDashboard({ "/wallet/convert": { body: { message: "ok" } } });

    await u.click(await screen.findByRole("button", { name: "Convert" }));
    await u.type(screen.getByLabelText("Amount (NGN)"), "1000");
    await u.click(screen.getByRole("button", { name: "Convert Now" }));

    expect(await screen.findByText("Conversion successful!")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/wallet/convert")).toEqual({ fromCurrency: "NGN", toCurrency: "USD", amount: 1000 });
  });

  it("surfaces a conversion failure", async () => {
    const u = userEvent.setup();
    renderDashboard({ "/wallet/convert": { status: 400, body: { message: "Insufficient balance" } } });

    await u.click(await screen.findByRole("button", { name: "Convert" }));
    await u.type(screen.getByLabelText("Amount (NGN)"), "1000");
    await u.click(screen.getByRole("button", { name: "Convert Now" }));

    expect(await screen.findByText("Insufficient balance")).toBeInTheDocument();
  });
});

describe("Trade modal", () => {
  it("breaks down base cost, 0.5% fee and total", async () => {
    const u = userEvent.setup();
    renderDashboard();

    await u.click(await screen.findByRole("button", { name: "Trade" }));
    await u.type(screen.getByLabelText("Exact USD amount to buy"), "65");

    // 65 USD / 0.00065 = 100,000 NGN base cost, 500 NGN fee, 100,500 NGN total
    const card = (await screen.findByText("Base cost")).closest("div")?.parentElement as HTMLElement;
    expect(within(card).getByText("100000.0000 NGN")).toBeInTheDocument();
    expect(within(card).getByText("500.0000 NGN")).toBeInTheDocument();
    expect(within(card).getByText("100500.0000 NGN")).toBeInTheDocument();
  });

  it("sends the exact target amount and reports success", async () => {
    const u = userEvent.setup();
    const fetchMock = renderDashboard({ "/wallet/trade": { body: { message: "ok" } } });

    await u.click(await screen.findByRole("button", { name: "Trade" }));
    await u.type(screen.getByLabelText("Exact USD amount to buy"), "10");
    await u.click(screen.getByRole("button", { name: "Buy 10 USD" }));

    expect(await screen.findByText("Trade executed!")).toBeInTheDocument();
    expect(lastBody(fetchMock, "/wallet/trade")).toEqual({ sourceCurrency: "NGN", targetCurrency: "USD", targetAmount: 10 });
  });

  it("surfaces a trade failure", async () => {
    const u = userEvent.setup();
    renderDashboard({ "/wallet/trade": { status: 400, body: { message: "Insufficient NGN" } } });

    await u.click(await screen.findByRole("button", { name: "Trade" }));
    await u.type(screen.getByLabelText("Exact USD amount to buy"), "10");
    await u.click(screen.getByRole("button", { name: "Buy 10 USD" }));

    expect(await screen.findByText("Insufficient NGN")).toBeInTheDocument();
  });
});
