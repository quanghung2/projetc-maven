import { randomGuid } from '@b3networks/shared/common';
import { EmojiList } from '../../components/quill-editor/emoji/emoji-list';
import { RegExpPattern } from '../constant/patterns.const';
import { Match, MatchType } from '../model/match.model';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// emoji :adore:
export class EmojiMarkdownCompiler implements WidgetCompile {
  constructor() {}

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const emojiMatched = data.text.match(RegExpPattern.EMOJI);
    const matchs: WidgetMatched[] = [];
    if (emojiMatched) {
      emojiMatched.forEach(item => {
        const replaceString: string = randomGuid();
        data.text = data.text.replace(item, replaceString);
        matchs.push({ random: replaceString, text: item });
      });
    }
    return matchs;
  }

  compile(mathes: WidgetMatched[], data: OutputProcessMessage) {
    mathes.forEach(item => {
      let replaceItem = item.text;
      const findEmoji = EmojiList.find(x => x.shortname === item.text);
      const matched = new Match(MatchType.EMOJI, item.text, item.random);
      if (findEmoji) {
        replaceItem = this.formatEmojiByHTML(matched, findEmoji, data.text);
      }
      data.text = data.text.replace(item.random, replaceItem);
    });
  }

  private formatEmojiByHTML(item: Match, emoji: any, processingTextMessage: string) {
    return `<span class="tooltip"><i class="ap ap-emoji ap-${emoji.name} ${
      processingTextMessage === item.replaceString ? 'emoji-chat' : ''
    }">${item.matched}</i><span class="tooltiptext">${item.matched}</span></span>`;
  }
}
