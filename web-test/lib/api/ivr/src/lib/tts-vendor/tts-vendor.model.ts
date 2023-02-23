export interface TtsVendor2 {
  code: string;
  language: string;
  vendor: string;
  gender: string;
  mappingName: string;
  voiceName: string;
  voiceCode: string;
}

export function createTtsVendor(params: Partial<TtsVendor2>) {
  return {} as TtsVendor2;
}
