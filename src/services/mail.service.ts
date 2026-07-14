export class MailService {
  static async sendDeletedEmail(email: string, name?: string) {
    console.log("==============");
    console.log("Send Mail");
    console.log(email);
    console.log(name);
    console.log("==============");
  }
}
