import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";

export type PayMongoEWalletType = "gcash" | "grab_pay" | "paymaya";

export interface PayMongoSourceResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      status: string;
      type: string;
      redirect: {
        checkout_url: string;
        failed: string;
        success: string;
      };
      [key: string]: any;
    };
  };
}

export interface PayMongoPaymentIntentResponse {
  data: {
    id: string;
    type: string;
    attributes: {
      amount: number;
      currency: string;
      status: string;
      client_key: string;
      next_action?: {
        type: string;
        redirect?: { url: string; return_url: string };
      };
      [key: string]: any;
    };
  };
}

/**
 * PayMongo integration service.
 *
 * Uses the native fetch API against https://api.paymongo.com/v1.
 * When PAYMONGO_SECRET_KEY is not set, isConfigured() returns false
 * and callers should fall back to the simulated payment flow.
 */
@Injectable()
export class PayMongoService {
  private readonly logger = new Logger(PayMongoService.name);
  private readonly apiKey: string;
  private readonly webhookSecret: string;
  private readonly baseUrl = "https://api.paymongo.com/v1";

  constructor(private config: ConfigService) {
    this.apiKey = this.config.get<string>("PAYMONGO_SECRET_KEY", "") || "";
    this.webhookSecret =
      this.config.get<string>("PAYMONGO_WEBHOOK_SECRET", "") || "";
  }

  /**
   * Returns true if a PayMongo secret key is configured.
   * Callers should check this and fall back to simulated payments otherwise.
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Returns true if a PayMongo webhook signing secret is configured.
   */
  hasWebhookSecret(): boolean {
    return !!this.webhookSecret;
  }

  getWebhookSecret(): string {
    return this.webhookSecret;
  }

  private headers(): Record<string, string> {
    // PayMongo uses HTTP Basic auth with the secret key as the username
    // and an empty password.
    const token = Buffer.from(this.apiKey + ":").toString("base64");
    return {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  /**
   * Create a Payment Intent for card payments.
   *
   * @param amount Amount in the main currency unit (PHP). Will be converted to centavos.
   */
  async createPaymentIntent(
    amount: number,
    description: string,
    metadata: Record<string, any>,
  ): Promise<PayMongoPaymentIntentResponse> {
    const res = await fetch(`${this.baseUrl}/payment_intents`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            payment_method_allowed: ["card", "gcash", "paymaya"],
            payment_method_options: {
              card: { request_three_d_secure: "any" },
            },
            currency: "PHP",
            description,
            metadata,
          },
        },
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`createPaymentIntent failed: ${res.status} ${body}`);
      throw new Error(`PayMongo error: ${body}`);
    }

    return (await res.json()) as PayMongoPaymentIntentResponse;
  }

  /**
   * Create a Source for e-wallet payments (GCash, GrabPay, Maya).
   * Returns an object whose checkout_url can be used to redirect the buyer.
   *
   * @param type "gcash" | "grab_pay" | "paymaya"
   * @param amount Amount in PHP (main currency unit). Converted to centavos.
   * @param successUrl URL to return to after a successful payment.
   * @param failedUrl URL to return to after a failed payment.
   */
  async createSource(
    type: PayMongoEWalletType,
    amount: number,
    successUrl: string,
    failedUrl: string,
    metadata?: Record<string, any>,
  ): Promise<PayMongoSourceResponse> {
    const attributes: Record<string, any> = {
      amount: Math.round(amount * 100),
      currency: "PHP",
      type,
      redirect: { success: successUrl, failed: failedUrl },
    };
    if (metadata) {
      attributes.metadata = metadata;
    }

    const res = await fetch(`${this.baseUrl}/sources`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ data: { attributes } }),
    });

    if (!res.ok) {
      const body = await res.text();
      this.logger.error(`createSource failed: ${res.status} ${body}`);
      throw new Error(`PayMongo error: ${body}`);
    }

    return (await res.json()) as PayMongoSourceResponse;
  }

  /**
   * Retrieve a previously-created Source.
   */
  async getSource(sourceId: string): Promise<PayMongoSourceResponse> {
    const res = await fetch(`${this.baseUrl}/sources/${sourceId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PayMongo error: ${body}`);
    }
    return (await res.json()) as PayMongoSourceResponse;
  }

  /**
   * Retrieve a payment intent (for card flows).
   */
  async getPaymentIntent(
    intentId: string,
  ): Promise<PayMongoPaymentIntentResponse> {
    const res = await fetch(`${this.baseUrl}/payment_intents/${intentId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`PayMongo error: ${body}`);
    }
    return (await res.json()) as PayMongoPaymentIntentResponse;
  }

  /**
   * Create a Payment using a chargeable Source. Called after a source.chargeable
   * webhook to actually capture funds.
   */
  async createPaymentFromSource(
    sourceId: string,
    amount: number,
    description: string,
  ): Promise<any> {
    const res = await fetch(`${this.baseUrl}/payments`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        data: {
          attributes: {
            amount: Math.round(amount * 100),
            currency: "PHP",
            description,
            source: { id: sourceId, type: "source" },
          },
        },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      this.logger.error(
        `createPaymentFromSource failed: ${res.status} ${body}`,
      );
      throw new Error(`PayMongo error: ${body}`);
    }
    return await res.json();
  }

  /**
   * Verify the `Paymongo-Signature` header sent with a webhook request.
   *
   * The header has the format: `t=<timestamp>,te=<test_signature>,li=<live_signature>`.
   * The signed payload is `<timestamp>.<raw_body>`, and each signature is an
   * HMAC-SHA256 of that signed payload using the webhook secret.
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    secret: string,
  ): boolean {
    if (!signature || !secret) return false;

    const parts = signature.split(",").reduce<Record<string, string>>(
      (acc, part) => {
        const [key, value] = part.split("=");
        if (key && value) acc[key.trim()] = value.trim();
        return acc;
      },
      {},
    );

    const timestamp = parts["t"];
    const testSig = parts["te"];
    const liveSig = parts["li"];

    if (!timestamp || (!testSig && !liveSig)) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const computed = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Use timing-safe comparison when possible.
    const safeEquals = (a: string, b: string) => {
      if (!a || !b || a.length !== b.length) return false;
      try {
        return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
      } catch {
        return false;
      }
    };

    return (
      (!!testSig && safeEquals(computed, testSig)) ||
      (!!liveSig && safeEquals(computed, liveSig))
    );
  }
}
