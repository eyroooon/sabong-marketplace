import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WaitlistForm } from "./waitlist-form";

describe("<WaitlistForm />", () => {
  beforeEach(() => {
    // Reset global fetch before each test
    vi.stubGlobal("fetch", vi.fn());
    // localStorage mock for jsdom
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => store[k] ?? null,
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the email input and Sumali Na button", () => {
    render(<WaitlistForm />);

    expect(
      screen.getByPlaceholderText("ikaw@email.com"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /sumali na/i }),
    ).toBeInTheDocument();
  });

  it("POSTs to /api/waitlist and shows success state on 200 response", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true, loggedLocally: true }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistForm source="test-source" />);

    await user.type(
      screen.getByPlaceholderText("ikaw@email.com"),
      "test@example.com",
    );
    await user.click(screen.getByRole("button", { name: /sumali na/i }));

    // Success state appears
    expect(
      await screen.findByText("Salamat! Naka-list ka na."),
    ).toBeInTheDocument();

    // Fetch was called with correct payload
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/waitlist");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({
      email: "test@example.com",
      source: "test-source",
    });
  });

  it("shows error message when API returns an error response", async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Please provide a valid email address." }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<WaitlistForm />);

    await user.type(
      screen.getByPlaceholderText("ikaw@email.com"),
      "valid-looking@example.com",
    );
    await user.click(screen.getByRole("button", { name: /sumali na/i }));

    expect(
      await screen.findByText("Please provide a valid email address."),
    ).toBeInTheDocument();

    // Form is still visible (not in success state)
    expect(
      screen.getByRole("button", { name: /sumali na/i }),
    ).toBeInTheDocument();
  });
});
