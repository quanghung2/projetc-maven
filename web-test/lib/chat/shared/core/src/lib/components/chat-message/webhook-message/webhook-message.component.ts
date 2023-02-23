import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChatMessage, InteractiveBlockType, InteractiveMessageData, MessageBody } from '@b3networks/api/workspace';
import { OutputProcessMessage } from '../../../core/model/output-message.model';
import { MarkdownService } from '../../../core/service/markdown.service';

@Component({
  selector: 'csh-webhook-message',
  templateUrl: './webhook-message.component.html',
  styleUrls: ['./webhook-message.component.scss']
})
export class WebhookMessageComponent implements OnChanges {
  @Input() message: ChatMessage;

  dataMessage: InteractiveMessageData;
  renderHeaderMarkdown: string;
  isErrorFormat: boolean;
  builtTextMessage: OutputProcessMessage;

  readonly BlockType = InteractiveBlockType;

  constructor(private markdownService: MarkdownService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['message']) {
      this.isErrorFormat =
        !this.message.body?.data ||
        typeof this.message.body?.data === 'string' ||
        !(<InteractiveMessageData>this.message.body?.data)?.blocks;

      if (this.isErrorFormat) {
        this.message = Object.assign(new ChatMessage(), this.message);
        this.message.body = new MessageBody({
          text: 'Unrenderable message!'
        });
        return;
      }

      this.dataMessage = this.message.body.data as InteractiveMessageData;
      this.dataMessage?.blocks.forEach(item => {
        if (item?.text.type === InteractiveBlockType.markdown && typeof item?.text.text === 'string') {
          // this.renderContainerMarkdown = this.markdownService.compile(item?.text.text).text;
          this.builtTextMessage = this.markdownService.compile(item?.text.text);
        }
      });
      this.renderHeaderMarkdown = this.markdownService.compile(this.message.body?.text)?.text;
    }
  }
}
