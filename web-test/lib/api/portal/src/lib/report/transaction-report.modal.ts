export interface GetTransactionReportReq {
  domain: string;
  month: string;
  type: string;
}

export interface TransactionReportResp {
  fileUrl: string;
  lastModified: number;
}
