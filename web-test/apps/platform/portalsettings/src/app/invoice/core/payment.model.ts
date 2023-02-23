export class Payment {
  id: number;
  invoiceId: number;
  amount: number;
  paymentAmount: number;
  paymentGateway: string;
  paymentReference: string;
  reference: string;
  issuedDate: number;
  issuedUser: string;
}
