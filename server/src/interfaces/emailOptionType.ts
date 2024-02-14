export interface IEmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}
