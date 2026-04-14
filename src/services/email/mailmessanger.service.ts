import { EmailPayload } from '@breedware/global-utility';
import { defineString } from 'firebase-functions/params';

const apikey = defineString("EMAIL_API_KEY");

export class EmailMessanger {
  private url = "https://api.brevo.com/v3/smtp/email";
  private data: any = {};
  private headers: any;

  constructor({
    subject,
    content,
    sender,
    receivers,
    replyTo,
    carbonCopy,
    blindCarbonCopy,
  }: EmailPayload) {
    this.data.sender = sender;
    this.data.to = receivers;
    this.data.subject = subject;
    this.data.htmlContent = content;
    this.data.cc = carbonCopy;
    this.data.bcc = blindCarbonCopy;
    this.data.replyTo = replyTo;

    // ✅ Correct use of param
    this.headers = {
      "Content-Type": "application/json",
      accept: "application/json",
      "api-key": apikey.value()
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
