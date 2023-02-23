import { randomGuid } from '@b3networks/shared/common';
import { RegExpPattern } from '../constant/patterns.const';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// *abc*
export class BoldMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const matched = data.text.match(RegExpPattern.MARK_BOLD);
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
      replaceItem = `<strong class='bold'>${text}</strong>`;
      if (hasSpace) {
        replaceItem = ' ' + replaceItem;
      }
      data.text = data.text.replace(item.random, replaceItem);
    });
  }
}
