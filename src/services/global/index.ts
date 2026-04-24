import { DVAInformation, FundTransferInformation } from "@breedware/global-utility";

interface Response {status: boolean, message: string}

export class BreedwareService {
  private _liveUrl = "https://api.breedware.com";
  private _testUrl = "https://sandbox.breedware.com";
  private _baseUrl: string;
  private _secretKey: string;

  constructor(breedwareSecret: string, isDev: boolean) {
    // Secret is initialized once when the class is instantiated
    this._secretKey = breedwareSecret;
    this._baseUrl = isDev ? this._testUrl: this._liveUrl;
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
        throw new Error(`Breedware API Error: ${(data as any).message || "Unknown Error"}`);
      }
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * save dedicated virtual accounts
   * globally
   * @param data 
   * @returns 
   */
  async saveDVA(data: DVAInformation): Promise<Response> {
    try {
        await this._fetcher('/dva', "POST", data);
        return {status: true, message: "DVA created successfully"}
    } catch (error) {
        return {status: false, message: "Unable to save information"}
    }
  }


  /**
   * save transfers to accounts
   * @param data 
   * @returns 
   */
  async saveFundTransfer(data: FundTransferInformation): Promise<Response> {
    try {
        await this._fetcher('/fundtransfer', "POST", data);
        return {status: true, message: "Fund transfer initiated"}
    } catch (error) {
        return {status: false, message: "Unable to initiate fund transfer"}
    }
  }
}