export interface ManipulationProfile {
  name: string;
  conditions: Conditions[];
  statements: Statements[];
  antiactions: Antiactions[];
}
export interface Conditions {
  variable: string;
  pattern: string;
}
export interface Statements {
  reference: string;
  pattern: string;
  target: string;
  values: string[];
}
export interface Antiactions {
  action: string;
  param: string;
}
