
interface EmailPayload {
    subject: string;
    content: string;
    sender: {name: string; email: string;};
    receivers: {name: string; email: string;}[];
    replyTo?: {name: string; email: string};
    carbonCopy?: {name: string; email: string}[];
    blindCarbonCopy?: {name: string; email: string}[];
  }


export class EmailMessanger {
  private url = "https://api.brevo.com/v3/smtp/email";
  private data: any = {};
  private headers: any;

  constructor(param: EmailPayload, apiKey: string) {
    this.data.sender = param.sender;
    this.data.to = param.receivers;
    this.data.subject = param.subject;
    this.data.htmlContent = param.content;
    this.data.cc = param.carbonCopy;
    this.data.bcc = param.blindCarbonCopy;
    this.data.replyTo = param.replyTo;

    // ✅ Correct use of param
    this.headers = {
      "Content-Type": "application/json",
      accept: "application/json",
      "api-key": apiKey
    };
  }

  async send(): Promise<boolean> {
    try {
      const response = await fetch(this.url, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(this.data),
      });

      const json = await response.json();
      console.log("email return: ", json); // build on this

      if (!response.ok) {
        return false;
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
