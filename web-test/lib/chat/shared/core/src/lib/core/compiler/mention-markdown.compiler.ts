import { randomGuid } from '@b3networks/shared/common';
import { UNKNOWN_USER } from '../constant/common.const';
import { RegExpPattern } from '../constant/patterns.const';
import { MatchType } from '../model/match.model';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// @user
export class MentionMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const mentionMatched = data.text.match(RegExpPattern.MENTION);
    const mentionMatchs: WidgetMatched[] = [];
    if (mentionMatched) {
      mentionMatched.forEach(item => {
        const replaceString: string = randomGuid();
        data.text = data.text.replace(item, replaceString);
        mentionMatchs.push({ random: replaceString, text: item });
      });
    }
    return mentionMatchs;
  }

  compile(mathes: WidgetMatched[], data: OutputProcessMessage, hyperId: string) {
    mathes.forEach(item => {
      let replaceItem = item.text;
      const mentionString: string = item.text.slice(item.text.indexOf('<@') + 2, item.text.length).replace('>', '');
      if ('everyone' === mentionString) {
        replaceItem = `<pre data-user-uuid="everyone" data-user-chatUuid="everyone" class="message_mention">@everyone</pre>`;
      } else {
        // default
        data.isTriggerDirective = true;
        replaceItem = `<pre 
        ${hyperId ? ` data-hyper-id="${hyperId}"` : ''} 
        data-user-chatUuid="${mentionString}"
        data-cannot-render='${MatchType.MENTION}'
        class="message_mention cannotRender">@${UNKNOWN_USER}</pre>`;
      }
      data.text = data.text.replace(item.random, replaceItem);
    });
  }
}
