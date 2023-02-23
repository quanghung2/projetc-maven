import { Injectable } from '@angular/core';
import { randomGuid } from '@b3networks/shared/common';
import { escape } from 'lodash';
import { BoldMarkdownCompiler } from '../compiler/bold-markdown.compiler';
import { ChannelMarkdownCompiler } from '../compiler/channel-markdown.compiler';
import { CodeMarkdownCompiler } from '../compiler/code-markdown.compiler';
import { EmojiMarkdownCompiler } from '../compiler/emoji-markdown.compiler';
import { HighlightLinkMarkdownCompiler } from '../compiler/highlight-link-markdown.compiler';
import { ItalicMarkdownCompiler } from '../compiler/italic-markdown.compiler';
import { LinkMarkdownCompiler } from '../compiler/link-markdown.compiler';
import { MentionMarkdownCompiler } from '../compiler/mention-markdown.compiler';
import { NewLineMarkdownCompiler } from '../compiler/newline-markdown.compiler';
import { SingleCodeMarkdownCompiler } from '../compiler/single-code-markdown.compiler';
import { StrikeMarkdownCompiler } from '../compiler/strike-markdown.compiler';
import { RegExpPattern } from '../constant/patterns.const';
import { Match, MatchType } from '../model/match.model';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

export interface InfoMarkdown {
  hyperId: string;
  noCode: boolean;
  noSingleCode: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class MarkdownService {
  constructor() {}

  // dont modify class name, attribute, tag name because use in quill,directive,clipboard,style,...
  // add new prop if handle other cases
  compile(textMessage: string, config?: InfoMarkdown): OutputProcessMessage {
    const output: OutputProcessMessage = {
      text: textMessage,
      isTriggerDirective: false
    };

    if (!textMessage) {
      return output;
    }

    const codeMatches = !config?.noCode ? this.getCompiler(MatchType.BLOCKQUOTE).preCompile(output) : null;
    const singleCodeMatches = !config?.noSingleCode ? this.getCompiler(MatchType.CODE).preCompile(output) : null;

    let highlightMatches: WidgetMatched[] = [],
      linkMatches: WidgetMatched[] = [];
    try {
      // highlight link href: [abc xyz](https://google.com)
      highlightMatches = this.getCompiler(MatchType.HIGHLIGHT_LINK).preCompile(output);
      // link href
      linkMatches = this.getCompiler(MatchType.LINK).preCompile(output);
    } catch {}

    const boldMatches = this.getCompiler(MatchType.BOLD).preCompile(output);
    // const strikeMatches = this.getCompiler(MatchType.STRIKE).preCompile(output);

    const mentionMatchs = this.getCompiler(MatchType.MENTION).preCompile(output); // 1
    const channelmatchs = this.getCompiler(MatchType.CHANNEL).preCompile(output); // 2
    // const italicMatches = this.getCompiler(MatchType.ITALIC).preCompile(output); // 3

    // The magic here
    // https://stackoverflow.com/questions/34040338/replace-string-containing-in-javascript-regex
    output.text = escape(output.text);

    if (!config?.noCode) {
      // \n => br tag
      this.getCompiler(MatchType.NEW_LINE).compile(null, output, codeMatches);
    }

    // this.getCompiler(MatchType.ITALIC).compile(italicMatches, output); // 3
    this.getCompiler(MatchType.CHANNEL).compile(channelmatchs, output, config?.hyperId); // 2
    this.getCompiler(MatchType.MENTION).compile(mentionMatchs, output, config?.hyperId); // 1

    // :adore:
    const emojiMatches = this.getCompiler(MatchType.EMOJI).preCompile(output);
    this.getCompiler(MatchType.EMOJI).compile(emojiMatches, output);

    // ```abc```
    if (!config?.noCode) {
      this.getCompiler(MatchType.BLOCKQUOTE).compile(codeMatches, output);
    }

    // `abc`
    if (!config?.noSingleCode) {
      this.getCompiler(MatchType.CODE).compile(singleCodeMatches, output);
    }

    // *abc*
    this.getCompiler(MatchType.BOLD).compile(boldMatches, output);
    // ~abc~
    // this.getCompiler(MatchType.STRIKE).compile(strikeMatches, output);

    try {
      this.getCompiler(MatchType.HIGHLIGHT_LINK).compile(highlightMatches, output);
      this.getCompiler(MatchType.LINK).compile(linkMatches, output);
    } catch {}

    return output;
  }

  removeMentionEmojiOnMarkdown(msg: string, mentions: { value: string; id: string; denotationChar: string }[]): string {
    if (!this.containMarkdown(msg)) {
      return msg;
    }

    const markdownReplace = this.replaceMarkdownByRandomUuid(msg);
    let message = markdownReplace.msgOutput || '';

    for (let i = markdownReplace.matchs.length - 1; i >= 0; i--) {
      const match = markdownReplace.matchs[i];
      let matchStr = match.matched;

      for (let j = 0; j < mentions.length; j++) {
        if (mentions[j].denotationChar === '@') {
          const mention = `<@${mentions[j].id}>`;
          while (matchStr.indexOf(mention) >= 0) {
            matchStr = matchStr.replace(mention, `@${mentions[j].value}`);
          }
        } else {
          const mention = `<#${mentions[j].id}>`;
          while (matchStr.indexOf(mention) >= 0) {
            matchStr = matchStr.replace(mention, `#${mentions[j].value}`);
          }
        }
      }

      // message = message.replace(match.replaceString, matchStr);
      message = message.split(match.replaceString).join(matchStr);
    }

    return message;
  }

  private containMarkdown(text: string): boolean {
    if (!text) {
      return false;
    }

    if (text.match(RegExpPattern.MARK_QUOTE)) {
      return true;
    }

    if (text.match(RegExpPattern.MARK_SINGLE_QUOTE)) {
      return true;
    }

    if (text.match(RegExpPattern.MARK_BOLD)) {
      return true;
    }

    if (text.match(RegExpPattern.MARK_STRIKE)) {
      return true;
    }

    return false;
  }

  /// replace all block of markdown by a random string.
  private replaceMarkdownByRandomUuid(msg: string): { matchs: Match[]; msgOutput: string } {
    const matchedArr: Match[] = [];
    const matchedArrUrl: Match[] = [];
    const isURL = msg.match(RegExpPattern.URL);
    let tmp;

    if (isURL) {
      tmp = this.processMatches(msg, MatchType.URL);
      matchedArrUrl.push(...tmp.matcheds);
    }

    tmp = this.processMatches(msg, MatchType.BLOCKQUOTE);
    matchedArr.push(...tmp.matcheds);

    tmp = this.processMatches(tmp.output, MatchType.CODE);
    matchedArr.push(...tmp.matcheds);

    tmp = this.processMatches(tmp.output, MatchType.BOLD);
    matchedArr.push(...tmp.matcheds);

    tmp = this.processMatches(tmp.output, MatchType.STRIKE);
    matchedArr.push(...tmp.matcheds);

    matchedArrUrl.forEach(item => {
      tmp.output = tmp.output.replace(item.replaceString, item.matched);
    });

    return { matchs: matchedArr, msgOutput: tmp.output };
  }

  // Replace a specific type of markdown by a random string
  private processMatches(msg: string, matchType: MatchType): { matcheds: Match[]; output: string } {
    let matches = null;
    if (matchType === MatchType.BLOCKQUOTE) {
      matches = msg.match(RegExpPattern.MARK_QUOTE);
    }

    if (matchType === MatchType.CODE) {
      matches = msg.match(RegExpPattern.MARK_SINGLE_QUOTE);
    }

    if (matchType === MatchType.BOLD) {
      matches = msg.match(RegExpPattern.MARK_BOLD);
    }

    if (matchType === MatchType.STRIKE) {
      matches = msg.match(RegExpPattern.MARK_STRIKE);
    }

    let output: string = msg;
    const tmp = [];

    if (matches) {
      matches.filter(item => {
        const replaceString = randomGuid();
        tmp.push(new Match(matchType, item, replaceString));
        output = output.replace(item, replaceString);
      });
    }

    return { matcheds: tmp, output: output };
  }

  private getCompiler(type: MatchType) {
    let tranformer: WidgetCompile;
    switch (type) {
      case MatchType.BLOCKQUOTE:
        tranformer = new CodeMarkdownCompiler();
        break;
      case MatchType.CODE:
        tranformer = new SingleCodeMarkdownCompiler();
        break;
      case MatchType.CHANNEL:
        tranformer = new ChannelMarkdownCompiler();
        break;
      case MatchType.EMOJI:
        tranformer = new EmojiMarkdownCompiler();
        break;
      case MatchType.MENTION:
        tranformer = new MentionMarkdownCompiler();
        break;
      case MatchType.LINK:
        tranformer = new LinkMarkdownCompiler();
        break;
      case MatchType.HIGHLIGHT_LINK:
        tranformer = new HighlightLinkMarkdownCompiler();
        break;
      case MatchType.NEW_LINE:
        tranformer = new NewLineMarkdownCompiler();
        break;
      case MatchType.ITALIC:
        tranformer = new ItalicMarkdownCompiler();
        break;
      case MatchType.STRIKE:
        tranformer = new StrikeMarkdownCompiler();
        break;
      case MatchType.BOLD:
        tranformer = new BoldMarkdownCompiler();
        break;
    }
    return tranformer;
  }
}
