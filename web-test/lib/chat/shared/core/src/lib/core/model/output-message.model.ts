export class OutputContentQuill {
  constructor(public mentions: string[], public msg: string) {}
}

export interface OutputProcessMessage {
  text: string;
  isTriggerDirective: boolean;
}

export interface WidgetCompile {
  preCompile(data: OutputProcessMessage): WidgetMatched[];
  compile(mathes: WidgetMatched[], data: OutputProcessMessage, moreCase?: any);
}

export interface WidgetMatched {
  random: string;
  text: string;
}
