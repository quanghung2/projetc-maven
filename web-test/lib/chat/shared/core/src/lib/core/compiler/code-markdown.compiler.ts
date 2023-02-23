import { randomGuid } from '@b3networks/shared/common';
import { escape } from 'lodash';
import { RegExpPattern } from '../constant/patterns.const';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// ```abc```
export class CodeMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const codePreMatched = data.text.match(RegExpPattern.CODE);
    const matches: WidgetMatched[] = [];
    if (codePreMatched) {
      codePreMatched.forEach(item => {
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
      const text = item.text.replace(/\`{3}/gm, '')?.trim();
      replaceItem = `<pre class="code">${text}</pre>`;
      // data.text = data.text.replace(item.random, replaceItem);
      data.text = data.text.split(item.random).join(replaceItem);
    });
  }
}
