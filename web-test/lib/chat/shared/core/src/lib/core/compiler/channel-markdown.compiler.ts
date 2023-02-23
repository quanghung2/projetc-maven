import { randomGuid } from '@b3networks/shared/common';
import { RegExpPattern } from '../constant/patterns.const';
import { MatchType } from '../model/match.model';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// #channel
export class ChannelMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const channelMatched = data.text.match(RegExpPattern.CHANNEL);
    const channelMatchs: WidgetMatched[] = [];
    if (channelMatched) {
      channelMatched.forEach(item => {
        const replaceString: string = randomGuid();
        data.text = data.text.replace(item, replaceString);
        channelMatchs.push({ random: replaceString, text: item });
      });
    }
    return channelMatchs;
  }

  compile(mathes: WidgetMatched[], data: OutputProcessMessage, hyperId: string) {
    mathes.forEach(item => {
      let replaceItem = item.text;
      const channelString: string = item.text.slice(item.text.indexOf('<#') + 2, item.text.length).replace('>', '');
      data.isTriggerDirective = true;
      replaceItem = `<a class="message_mention_channel cannotRender" 
      ${hyperId ? ` data-hyper-id="${hyperId}"` : ''}
      data-channel='${channelString}' data-cannot-render='${MatchType.CHANNEL}'>#Unknown channel</a>`;
      data.text = data.text.replace(item.random, replaceItem);
    });
  }
}
