
/**
 * http caller fro api
 */
export class APIFetcher {
  private _method: "GET" | "POST";
  private _secretKey?: string;
  private _baseUrl : string;
  private _body?: object;
  private _otherHeader?: object;

  /**
   * class constructor
   * @param {'GET' | 'POST'} method
   * @param {object} body
   */
  constructor(
    method: "GET" | "POST", 
    baseUrl: string, 
    body?: object,
    apiSecret?: string,
    otherHeader?: object
  ) {
    // set path and methods
    this._method = method;
    this._body = body;
    this._baseUrl = baseUrl;
    this._secretKey = apiSecret;
    this._otherHeader = otherHeader;
  }

  /**
   * http fetch method
   * @param {string} url
   * @return {Promise<Response>}
   */
  private _fetcher = async (url: string, headers?: any): Promise<Response | undefined> => {
    try {
      const response = await fetch(
        url,
        {
          method: this._method,
          headers: headers ?? {
            "Authorization": `Bearer ${this._secretKey}`,
            "Content-Type": "application/json",
            ...this._otherHeader
          },
          body: JSON.stringify(this._body),
        }
      );
      return response;
    } catch (error) {
    }
    return;
  };

  /**
     * call the api method
     * @return {Promise<Response>}
     */
  apiCall = async (endpoint?: string): Promise<Response | undefined> =>{
    // define the url
    const url = this._baseUrl+endpoint;
    return await this._fetcher(url);
  };

  
}