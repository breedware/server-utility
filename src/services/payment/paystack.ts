
export class PaystackPayment {
  private _baseUrl = "https://api.paystack.co";
  private _secretKey: string;

  constructor(paystackSecret: string) {
    // Secret is initialized once when the class is instantiated
    this._secretKey = paystackSecret;
  }

  /**
   * Generic Fetcher logic
   */
  private async _fetcher(path: string, method: "GET" | "POST" | "PUT" | "DELETE" = "GET", body?: object): Promise<any> {
    try {
      const response = await fetch(`${this._baseUrl}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this._secretKey}`,
          "Content-Type": "application/json",
        },
        body: method !== "GET" && body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(`Paystack API Error: ${(data as any).message || "Unknown Error"}`);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /** --- TRANSACTIONS --- **/

  async initializeTransaction(body: { email: string; amount: number; split_code?: string; reference?: string, metadata?: any }) {
    return this._fetcher("/transaction/initialize", "POST", body);
  }

  async confirmPayment(reference: string) {
    return this._fetcher(`/transaction/verify/${reference}`, "GET");
  }

  /** --- BANKS & RESOLUTION --- **/

  async fetchBanks() {
    return this._fetcher("/bank?currency=NGN&enabled_for_verification=true", "GET");
  }

  async confirmBankAccountNumber(accNumber: string, bankCode: string) {
    return this._fetcher(`/bank/resolve?account_number=${accNumber}&bank_code=${bankCode}`, "GET");
  }

  /** --- SUBACCOUNTS & CUSTOMERS --- **/

  async saveSubaccount(body: {
    business_name: string;
    settlement_bank: string; // bank code
    account_number: string;
    percentage_charge: string; // main account percentage share
    primary_contact_email: string;
  }, code?: string): Promise<{
    status: boolean;
    message: string;
    data: {
      subaccount_code: string;
      active: boolean
    }
  }> {
    return code 
      ? this._fetcher(`/subaccount/${code}`, "PUT", body) 
      : this._fetcher("/subaccount", "POST", body);
  }

  async saveCustomer(body: { 
    email: string; 
    first_name?: string; 
    last_name?: string; 
    phone?: string 
  }): Promise<{
    status: boolean;
    message: string;
    data?: {
      email: string;
      customer_code: string;
    }
  }> {
    return this._fetcher("/customer", "POST", body);
  }

  /** --- DEDICATED VIRTUAL ACCOUNTS (DVA) --- **/
  async createDVA(body: { 
    first_name: string;
    last_name: string;
    preferred_bank?: string;
    customer: string;
  }): Promise<{
    status: boolean;
    message: string;
    data?: {
      bank: {name: string; id: string; slug: string};
      account_name: string;
      account_number: string;
      assigned: boolean;
      active: boolean;
      customer: {
        id: string;
        customer_code: string;
      }
    }
  }> {
    // Note: 'assign' is used for new customers. 
    return this._fetcher("/dedicated_account", "POST", body);
  }

  async assignDVA(body: { 
    email: string;
    first_name: string;
    last_name: string;
    preferred_bank: string;
    country: 'NG'
  }) {
    // Note: 'assign' is used for existing customers. 
    // If creating a brand new one, use the '/dedicated_account' POST endpoint.
    return this._fetcher("/dedicated_account/assign", "POST", body);
  }

  /** --- TRANSFERS --- **/

  async saveTransferRecipient(body: { 
    type: "nuban"; 
    name: string; 
    account_number: string;
     bank_code: string 
    }): Promise<{
      status: boolean;
      message: string;
      data: {
        recipient_code: string;
      }
    }> {
    return this._fetcher("/transferrecipient", "POST", body);
  }

  async initializeTransfer(body: { source: "balance"; amount: number; recipient: string; reason?: string }): Promise<any> {
    return this._fetcher("/transfer", "POST", body);
  }

  async finalizeTransfer(body: { transfer_code: string; otp: string }): Promise<any> {
    return this._fetcher("/finalize_transfer", "POST", body);
  }

  /** --- OTP SETTINGS --- **/

  async disableTransferOTP() {
    return this._fetcher("/transfer/disable_otp", "POST");
  }

  async finalizeDisableOTP(otp: string) {
    return this._fetcher("/transfer/disable_otp_finalize", "POST", { otp });
  }
}