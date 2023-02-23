import { randomGuid } from '@b3networks/shared/common';
import { escape } from 'lodash';
import { RegExpPattern } from '../constant/patterns.const';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// `abc`
export class SingleCodeMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const singleCode = data.text.match(RegExpPattern.MARK_SINGLE_QUOTE);
    const matches: WidgetMatched[] = [];
    if (singleCode) {
      singleCode.forEach(item => {
        const replaceString: string = randomGuid();
        data.text = data.text.replace(item, replaceString);
        item = escape(item);
        matches.push({ random: replaceString, text: item });
      });
    }
    return matches;
  }

  compile(matches: WidgetMatched[], data: OutputProcessMessage) {
    matches.forEach(item => {
      let replaceItem = item.text;
      if (!this.hasHTML(item.text)) {
        const hasSpace = item.text.startsWith(' ');
        const hasBreakLine = item.text.startsWith('\n');

        const text = item.text.replace(/\`{1}/gm, '')?.trim();
        replaceItem = `<code class="codespan">${text}</code>`;

        if (hasSpace) {
          replaceItem = ' ' + replaceItem;
        } else if (hasBreakLine) {
          replaceItem = '<br />' + replaceItem;
        }
      }
      data.text = data.text.split(item.random).join(replaceItem);
    });
  }

  private hasHTML(text: string) {
    return /<\/?[a-z][\s\S]*>/i.test(text) && text.indexOf('ap ap-emoji') === -1;
  }
}
