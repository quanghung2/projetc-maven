import { Injectable } from '@angular/core';
import { FileService } from '@b3networks/api/file';

@Injectable({ providedIn: 'root' })
export class EditorServiceService {
  domParser: DOMParser = new DOMParser();

  constructor(private fileService: FileService) {}

  extractData(content: string) {
    const result = <EditorContentOutput>{ mentions: [] };

    const contentHtml = this.domParser.parseFromString(content, 'text/html');

    const mentionTags: HTMLCollection = contentHtml.getElementsByClassName('mention');
    for (let i = 0; i < mentionTags.length; i++) {
      const mention = mentionTags[i];
      result.mentions.push(mention.getAttribute('data-user-id'));
    }

    const imgEles = contentHtml.getElementsByTagName('img');
    for (let i = 0; i < imgEles.length; i++) {
      if (imgEles[i].src.includes('base64,')) {
        imgEles[i].src = '';
      }
    }

    result.html = contentHtml.body.innerHTML;

    return result;
  }

  buildRenderContent(rawContent: string) {
    const result = rawContent;

    return result;
  }
}

export interface EditorContentOutput {
  html: string;
  text: string;
  mentions: string[];
}
