export interface SubmitFormRequest {
  mid: string; //messageId
  payload: any;
}

export interface IntegrationTypeResponse {
  isApprovalBot: boolean;
}
