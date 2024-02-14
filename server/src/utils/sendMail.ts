import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
import { IEmailOptions } from "../interfaces/emailOptionType";
import config from "../config";

const sendMail = async (options: IEmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: config.SMTP.host,
    port: Number(config.SMTP.port || "587"),
    service: config.SMTP.service,
    auth: {
      user: config.SMTP.mail,
      pass: config.SMTP.password,
    },
  });
  const { email, subject, template, data } = options;

  //   Get the path of the Template file!
  const templatePath = path.join(__dirname, "../mails", template);

  //   Render the email template with EJS file
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: config.SMTP.mail,
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};

export default sendMail;
