import { defineBoolean, defineString } from "firebase-functions/params";

const secret = defineString("AFRICAS_TALKING_SECRET");
export const atUsername = defineString("AFRICAS_TALKING_USERNAME");
const is_dev = defineBoolean("IS_DEV");


export class AfricasTalkingAPI {
  private _baseUrl = is_dev.value() ? 
  "https://api.sandbox.africastalking.com/version1"
  : "https://api.africastalking.com/version1";
  private _username: string;
  private _apiKey: string;

  constructor() {
    this._username = atUsername.value();
    this._apiKey = secret.value();
  }

  /**
   * Core Fetcher handles both GET and POST
   */
  private async _fetcher(
    path: string, 
    method: "GET" | "POST" = "POST", 
    body?: object, 
    isBulk: boolean = false
  ): Promise<any> {
    
    // 1. Build URL with Username for GET requests if needed
    // Some AT GET endpoints require username as a query param
    const url = new URL(`${this._baseUrl}${path}`);
    if (method === "GET") {
      url.searchParams.append("username", this._username);
    }

    const headers: Record<string, string> = {
      "apiKey": this._apiKey,
      "Accept": "application/json",
    };

    let requestBody: string | undefined;

    // 2. Handle POST Body encoding
    if (method === "POST" && body) {
      const payload = { username: this._username, ...body };
      
      if (isBulk) {
        headers["Content-Type"] = "application/json";
        requestBody = JSON.stringify(payload);
      } else {
        headers["Content-Type"] = "application/x-www-form-urlencoded";
        requestBody = new URLSearchParams(payload as any).toString();
      }
    }

    const response = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
    });

    // AT returns 201 for successful SMS sends, 200 for others
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AT API Error: ${(errorData as any).errorMessage || response.statusText}`);
    }

    return response.json();
  }

  /** --- POST METHODS --- **/

  async sendMessage(to: string, message: string, from?: string) {
    return this._fetcher("/messaging", "POST", { to, message, from });
  }

  async sendBulkMessages(phoneNumbers: string[], message: string, senderId?: string) {
    return this._fetcher("/messaging/bulk", "POST", { phoneNumbers, message, senderId }, true);
  }

  /** --- GET METHODS --- **/

  /** Check your current SMS balance/user data */
  async getUserData() {
    // Note: User data is a different base URL usually, 
    // but for version1/user, this works:
    return this._fetcher("/user", "GET");
  }

  /** Fetch messages sent to your shortcode/inbox */
  async fetchMessages(lastReceivedId: number = 0) {
    return this._fetcher(`/messaging?lastReceivedId=${lastReceivedId}`, "GET");
  }
}