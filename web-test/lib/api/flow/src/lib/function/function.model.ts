export interface Arguments {
  name: string;
  type: string;
  dataType: string;
}

export class FunctionVariable {
  name: string;
  token: string;
  arguments: Arguments[];
  returnType: string;

  constructor(obj?: Partial<FunctionVariable>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface ArgumentOperator {
  name: string;
  dataType: string;
}

export interface FunctionOperator {
  name: string;
  token: string;
  arguments: ArgumentOperator[];
  returnType: string;
}
