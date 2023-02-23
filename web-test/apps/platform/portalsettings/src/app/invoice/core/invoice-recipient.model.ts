export class InvoiceRecipient {
  id: number;
  name: string;
  email: string;

  constructor(email?: string) {
    this.email = email;
  }

  isValid(): boolean {
    return this.email != null && this.email !== '';
  }
}
