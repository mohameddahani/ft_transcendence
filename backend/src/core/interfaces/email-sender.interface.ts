export interface EmailSender {
  send(options: {
    from: string;
    to: string;
    subject: string;
    html: string;
  }): Promise<void>;
}
