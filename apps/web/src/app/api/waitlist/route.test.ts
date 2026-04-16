import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("POST /api/waitlist", () => {
  beforeEach(() => {
    // Ensure no Resend envs — isolates test to local-log path
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_AUDIENCE_ID;
    delete process.env.NOTIFY_EMAIL;
    // Prevent noisy logs during test runs
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  function makeRequest(body: unknown): Request {
    return new Request("http://localhost:3000/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("returns 200 + loggedLocally:true for a valid email", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }) as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({
      ok: true,
      savedToResend: false,
      notifiedAdmin: false,
      loggedLocally: true,
    });
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email" }) as any);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/valid email/i);
  });

  it("returns 400 when email is missing entirely", async () => {
    const res = await POST(makeRequest({}) as any);
    expect(res.status).toBe(400);
  });
});
