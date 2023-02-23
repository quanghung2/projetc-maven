import { randomGuid } from '@b3networks/shared/common';
import { RegExpPattern } from '../constant/patterns.const';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// ~abc~
export class StrikeMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const matched = data.text.match(RegExpPattern.MARK_STRIKE);
    const matches: WidgetMatched[] = [];
    if (matched) {
      matched.forEach(item => {
        const replaceString: string = randomGuid();
        data.text = data.text.replace(item, replaceString);
        matches.push({ random: replaceString, text: item });
      });
    }
    return matches;
  }

  compile(matches: WidgetMatched[], data: OutputProcessMessage) {
    matches.forEach(item => {
      let replaceItem = item.text;
      const hasSpace = item.text.startsWith(' ');

      let text = item.text.trim().substr(1);
      text = text.substr(0, text.length - 1);
      replaceItem = `<span class="strike">${text}</span>`;
      if (hasSpace) {
        replaceItem = ' ' + replaceItem;
      }
      data.text = data.text.replace(item.random, replaceItem);
    });
  }
}
