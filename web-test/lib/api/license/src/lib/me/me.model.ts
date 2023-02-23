export interface Me {
  features: string[];
}

export function createMe(params: Partial<Me>) {
  return params as Me;
}
