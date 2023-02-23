export enum TypeOperator {
  comparison = 'comparison',
  logical = 'logical',
  and = 'and',
  or = 'or',
  equal = 'equal',
  notEqual = 'notEqual',
  isNull = 'isNull',
  isNotNull = 'isNotNull',
  isTrue = 'isTrue',
  isFalse = 'isFalse'
}

export interface Operator {
  operator: string;
  isUnary: boolean;
  dataType: string;
  label: string;
  type: TypeOperator;
}
