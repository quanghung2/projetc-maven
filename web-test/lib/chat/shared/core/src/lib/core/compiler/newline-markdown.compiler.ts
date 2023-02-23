import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// \n => br tag
export class NewLineMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(): WidgetMatched[] {
    return [];
  }

  compile(mathes: WidgetMatched[], data: OutputProcessMessage, codeMatches: WidgetMatched[]) {
    if (codeMatches.length > 0) {
      // special case, code markdown dont need <br/>
      codeMatches.forEach(match => {
        const splits = data.text.split(match.random);
        data.text = `${splits[0].trimRight()}${match.random}`;
        if (splits[1]) {
          data.text += splits[1].trimLeft();
        }
      });
    }
    data.text = data.text.replace(/\n/g, '<br />');
  }
}
