import { isLocalhost, randomGuid } from '@b3networks/shared/common';
import { ChatType } from '../constant/common.const';
import { RegExpPattern } from '../constant/patterns.const';
import { MatchType } from '../model/match.model';
import { OutputProcessMessage, WidgetCompile, WidgetMatched } from '../model/output-message.model';

// link href
export class LinkMarkdownCompiler implements WidgetCompile {
  private _url: string;
  constructor() {
    try {
      this._url = isLocalhost() ? null : this.getURL(window.parent.location.href);
    } catch {
      this._url = null;
    }
  }

  preCompile(data: OutputProcessMessage): WidgetMatched[] {
    const linkMatched = data.text.match(RegExpPattern.URL1);
    const matches: WidgetMatched[] = [];
    if (linkMatched) {
      linkMatched.forEach(item => {
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
      replaceItem = `<a href="${item.text}" target="_blank">${item.text}</a>`;

      // check equal domain + orgUuid + name application
      try {
        if (this.getURL(item.text) === this._url) {
          const url = new URL(item.text);
          const query = !!url.hash && url.hash?.includes('?') ? url.hash?.split('?')[1] : null;
          if (query) {
            const urlSearch = new URLSearchParams(query);
            const path = urlSearch.get('path');
            if (path) {
              const type = this.supportPreviewLink(path);
              if (type) {
                data.isTriggerDirective = true;
                replaceItem = `<a class='highlight-link cannotRender' href="${item.text}" 
                  target="_blank"
                  data-path="${path}"
                  data-query="${query}"
                  data-convo-type="${type}"
                  data-cannot-render='${MatchType.LINK}'>${item.text}</a>`;
              }
            }
          }
        }
      } catch (error) {
        console.log(error);
      }

      data.text = data.text.replace(item.random, replaceItem);
    });
  }

  private supportPreviewLink(path: string): ChatType {
    if (path.includes('/conversations/')) {
      return ChatType.channel;
    } else if (path.includes('/email/')) {
      return ChatType.email;
    }
    return null;
  }

  private getURL(href: string) {
    try {
      const location = new URL(href);
      if (href.includes('localhost')) {
        return `${location.origin}${location.pathname}`;
      }
      const hashNoParams = !!location.hash ? location.hash?.split('?')[0] : '';
      return `${location.origin}${location.pathname}${hashNoParams}`;
    } catch (error) {
      return null;
    }
  }
}
