export interface JobConfig {
  name: string;
  category: string;
  firstRun: string;
  command: string;
  description: string;
  params: string;
  environmentVariables: Variable;
  epsilon: string;
  duration: string;
  uris: string[];
  parents: string[];
  disabled: boolean;
}

export interface Variable {
  name: string;
  value: string;
}
