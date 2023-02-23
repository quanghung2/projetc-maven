import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  AttachmentMessageData,
  ChatMessage,
  ConversationGroup,
  EmailIntegrationService,
  EmailMessageGeneral,
  MediaService,
  User
} from '@b3networks/api/workspace';
import { getFileType } from '@b3networks/chat/shared/core';
import { download, humanFileSize, renderLinkForCopy } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { ClipboardService } from 'ngx-clipboard';
import { ComposeEmailDialogData, ComposeEmailMessageComponent } from '../../compose/compose.component';

@Component({
  selector: 'b3n-email-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class EmailMessageComponent {
  user: User = new User();
  isSectionExpanded = false;
  enableShowHideBlock = false;
  hideBlock = true;

  conversationGroup: ConversationGroup;
  displayHTML: string;
  displayQuoteHTML: string;
  hasQuoteHTML: boolean;
  @Input() msg: ChatMessage = new ChatMessage();
  @Input() set message(message: ChatMessage) {
    if (typeof message.body.data === 'string') {
      this.emailIntegrationService
        .getEmailBlobData(message.convo, message.id, message.body.data)
        .subscribe(emailMessage => {
          const newMessage: Partial<ChatMessage> = {
            ...message,
            body: {
              ...message.body,
              data: emailMessage
            }
          };
          this.msg = new ChatMessage(newMessage);
          this.setDataDisplayHTML();
        });
    } else {
      this.msg = new ChatMessage(message);
      this.setDataDisplayHTML();
    }
  }
  @Input() set convo(convo: ConversationGroup) {
    this.conversationGroup = convo;
  }
  @Input() set users(userList: User[]) {
    this.user = userList.find(user => user.userUuid === this.msg.user);
    if (!this.user) {
      this.user = new User({ displayName: this.msg?.body?.data?.fromAddresses[0]?.name });
    }
  }

  humanFileSize = humanFileSize;
  getFileType = getFileType;

  @Output() reload: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private emailIntegrationService: EmailIntegrationService,
    private mediaService: MediaService,
    private dialog: MatDialog,
    private toastService: ToastService,
    private router: Router,
    private clipboardService: ClipboardService
  ) {}

  get displayEmailText() {
    return this.getEmailMessageText(this.msg.body.data);
  }

  copyLink() {
    this.clipboardService.copyFromContent(
      renderLinkForCopy(this.router) + `&convoChildId=${this.conversationGroup.publicConversationId}`
    );
    this.toastService.success('Copy link successfully!');
  }

  composeEmail(type: 'normal' | 'reply' | 'forward' | 'forward as new') {
    const dialogRef = this.dialog.open(ComposeEmailMessageComponent, {
      width: '1000px',
      data: <ComposeEmailDialogData>{
        msg: this.msg.body.data,
        isComposeAsNew: type === 'normal',
        isReply: type === 'reply',
        isForward: type === 'forward',
        isForwardAsNew: type === 'forward as new',
        time: new Date(this.msg.ts),
        conversationGroup: type === 'reply' || type === 'forward' ? this.conversationGroup : null
      },
      disableClose: true,
      panelClass: 'position-relative'
    });

    dialogRef.afterClosed().subscribe(data => {
      if (data && data.isReload) {
        this.reload.emit();
      }
    });
  }

  stopPropagation($event: MouseEvent) {
    $event.stopPropagation();
  }

  download(attachment: AttachmentMessageData) {
    if (attachment && (attachment.mediaUuid || attachment.fileUuid)) {
      const mediaUuid = attachment.mediaUuid ? attachment.mediaUuid : attachment.fileUuid;
      this.mediaService.getMediaImgOriginal(mediaUuid, this.conversationGroup.id).subscribe(res => {
        download(res['url'], attachment.name);
      });
    }
  }

  private getEmailMessageText(msg: EmailMessageGeneral) {
    let text = msg.text;

    text = this.htmlToPlaintext(text);
    if (text) {
      text = text.split('<br>').join(' ');
      text = text.split('\n').join(' ');
    }
    return text;
  }

  private htmlToPlaintext(text) {
    return text ? String(text).replace(/<[^>]+>/gm, '') : '';
  }

  private setDataDisplayHTML() {
    this.displayHTML = this.msg.body.data?.htmlText;

    this.hasQuoteHTML = false;
    if (!!this.msg.body.data?.htmlQuoted) {
      this.hasQuoteHTML = true;
      this.displayQuoteHTML = '<br>' + this.msg.body.data?.htmlQuoted;
    } else {
      if (!!this.msg.body.data?.htmlText && this.msg.body.data?.htmlText?.indexOf('gmail_quote') > -1) {
        const div = document.createElement('div');
        div.innerHTML = this.msg.body.data.htmlText;
        const quote = div.querySelector('div.gmail_quote');
        if (quote) {
          this.hasQuoteHTML = true;
          this.displayQuoteHTML = '<br>' + quote.outerHTML;
          quote.remove();
          const innerHTML = this.removeInputInsideHTMLText(div.innerHTML);
          this.displayHTML = innerHTML;
        }
      }
    }
  }

  private removeInputInsideHTMLText(htmlText: string) {
    const div = document.createElement('div');
    div.innerHTML = htmlText;
    const inputs = div.querySelectorAll('input#convoUuid');
    if (inputs.length > 0) {
      inputs.forEach(e => e.remove());
    }

    // remove br last
    let text = div.innerHTML;

    while (text.substring(text.length - 4) === '<br>') {
      text = text.slice(0, text.length - 4);
    }

    return text;
  }
}
