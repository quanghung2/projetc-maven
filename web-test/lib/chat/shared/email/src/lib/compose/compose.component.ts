import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, HostListener, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { S3Service, Status as StautsUploader, UploadEvent } from '@b3networks/api/file';
import {
  AttachmentMessageData,
  CannedResponse,
  CannedResponseQuery,
  CannedResponseStatus,
  ConversationGroup,
  ConversationGroupReq,
  ConversationGroupService,
  ConversationMetadata,
  ConversationReq,
  ConversationType,
  EmailAddress,
  EmailInbox,
  EmailIntegrationQuery,
  EmailIntegrationService,
  EmailMessageGeneral,
  EmailSignature,
  EmailUploadRequest,
  GroupType,
  MediaService,
  Member,
  MeQuery,
  Privacy,
  RoleType,
  SendEmailInboxRequest,
  Status,
  User,
  UserQuery
} from '@b3networks/api/workspace';
import { getFileType, UploadDialogComponent, UploadDialogInput } from '@b3networks/chat/shared/core';
import {
  DestroySubscriberComponent,
  download,
  humanFileSize,
  MessageConstants,
  randomGuid
} from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { format } from 'date-fns';
import { QuillEditorComponent } from 'ngx-quill';
import * as QuillNamespace from 'quill';
import { Quill } from 'quill';
import { interval, Observable, Subscription } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';
import { ScheduleEmailComponent } from '../shared/dialog/schedule-email/schedule-email.component';
import { SendEmailWaitingDlg } from '../shared/dialog/send-email-waiting/send-email-waiting.component';
import { EditorFormats, EditorOptions } from './compose.const';
import { TempUploadPublicService } from './temp-upload-public.service';

const Quill_lib: any = QuillNamespace;

export interface ComposeEmailDialogData {
  msg: EmailMessageGeneral;
  isComposeAsNew?: boolean;
  isReply?: boolean;
  isForward?: boolean;
  isForwardAsNew?: boolean;
  isDraft?: boolean;
  isSchedule?: boolean;
  time?: Date;
  conversationGroup: ConversationGroup;
}

@Component({
  selector: 'b3n-email-compose-message',
  templateUrl: './compose.component.html',
  styleUrls: ['./compose.component.scss']
})
export class ComposeEmailMessageComponent extends DestroySubscriberComponent implements OnInit, OnDestroy {
  @ViewChild('emailQuillEditor', { static: false }) emailQuillEditor: QuillEditorComponent;
  editorOptions = EditorOptions;
  formats = EditorFormats;
  content = '';
  attachments: AttachmentMessageData[] = [];
  me: User;
  inboxes: EmailInbox[] = [];
  selectedInbox: EmailInbox;

  txtSubject = '';
  fromAddress: EmailAddress = { name: '', address: '' };
  toAddresses: EmailAddress[] = [];
  ccAddresses: EmailAddress[] = [];
  bccAddresses: EmailAddress[] = [];

  showCc = false;
  showBcc = false;

  cannedResponses: CannedResponse[] = [];
  signatures: EmailSignature[] = [];
  selectedSignature: EmailSignature;

  selectedSendText: 'send' | 'send and archive' | 'send later' = 'send';
  msg: EmailMessageGeneral;

  textHTMLEmailQuote: string;

  humanFileSize = humanFileSize;
  getFileType = getFileType;

  isLoading: boolean;
  loading$: Observable<boolean>;
  uploading: boolean;
  uploadEvent = <UploadEvent>{ status: StautsUploader.NONE, percentage: 0 };

  private oldDraft: EmailMessageGeneral;
  private autoSaveSubscription: Subscription;
  private conversationGroup: ConversationGroup;

  @HostListener('drop', ['$event']) onDrop(event: DragEvent | any) {
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer.files) as File[];
    this.uploadMultipleFiles(files);
  }

  constructor(
    private elr: ElementRef,
    private emailIntegrationService: EmailIntegrationService,
    private dialog: MatDialog,
    private s3Service: S3Service,
    private uploadPublicService: TempUploadPublicService,
    private userQuery: UserQuery,
    private conversationGroupService: ConversationGroupService,
    private dialogRef: MatDialogRef<ComposeEmailMessageComponent>,
    private toastService: ToastService,
    private meQuery: MeQuery,
    private cannedResponseQuery: CannedResponseQuery,
    private mediaService: MediaService,
    private emailIntegrationQuery: EmailIntegrationQuery,
    @Inject(MAT_DIALOG_DATA) public data: ComposeEmailDialogData
  ) {
    super();
    this.msg = data.msg;
    this.conversationGroup = data.conversationGroup;

    if (data.isComposeAsNew) {
      this.toAddresses = [...data.msg.toAddresses];
    } else if (data.isReply) {
      this.txtSubject = data.msg.subject?.toUpperCase()?.startsWith('RE:')
        ? data.msg.subject
        : `RE: ${data.msg.subject}`;
      this.fromAddress = data.msg.fromAddresses[0];
      this.toAddresses = [...data.msg.toAddresses];
      this.ccAddresses = [...data.msg.ccAddresses];
      this.bccAddresses = [...data.msg.bccAddresses];
      this.textHTMLEmailQuote = this.getTextHtmlReplyDisplay();
    } else if (data.isForward) {
      this.txtSubject = data.msg.subject?.toUpperCase()?.startsWith('FW:')
        ? data.msg.subject
        : `FW: ${data.msg.subject}`;
      this.fromAddress = data.msg.fromAddresses[0];
      this.textHTMLEmailQuote = this.getTextHtmlForwardDisplay();
    } else if (data.isForwardAsNew) {
      this.txtSubject = data.msg.subject?.toUpperCase()?.startsWith('FW:')
        ? data.msg.subject
        : `FW: ${data.msg.subject}`;
      this.textHTMLEmailQuote = this.getTextHtmlForwardDisplay();
    } else if (data.isDraft) {
      this.txtSubject = data.msg.subject;
      this.fromAddress = data.msg.fromAddresses[0];
      this.toAddresses = [...data.msg.toAddresses];
      this.ccAddresses = [...data.msg.ccAddresses];
      this.bccAddresses = [...data.msg.bccAddresses];
      this.content = data.msg.text;

      if (data?.msg?.htmlQuoted) {
        this.textHTMLEmailQuote = '<br>' + data.msg?.htmlQuoted;
      } else {
        if (!!data.msg?.htmlText && data.msg?.htmlText?.indexOf('gmail_quote') > -1) {
          const div = document.createElement('div');
          div.innerHTML = data.msg.htmlText;
          const quote = div.querySelector('div.gmail_quote');
          if (quote) {
            this.textHTMLEmailQuote = '<br>' + quote.outerHTML;
            quote.remove();
            const innerHTML = this.removeInputInsideHTMLText(div.innerHTML);
            this.content = innerHTML;
          }
        }
      }
    } else if (data.isSchedule) {
      this.fromAddress = data.msg.fromAddresses[0];
      this.toAddresses = [...data.msg.toAddresses];
      this.ccAddresses = [...data.msg.ccAddresses];
      this.bccAddresses = [...data.msg.bccAddresses];
    }
  }

  override destroy() {
    this.autoSaveSubscription.unsubscribe();
  }

  ngOnInit(): void {
    const Block = Quill_lib.import('blots/block');
    Block.tagName = 'DIV';
    Quill_lib.register(Block, true);

    this.loading$ = this.emailIntegrationQuery.loading$;
    this.me = this.meQuery.getMe();
    this.inboxes = this.emailIntegrationQuery.getInboxBelongToAgent();
    if (!this.conversationGroup) {
      this.createNewChannel();
    }
    this.getEmailSignatures();
    this.getCannedResponse();
    this.setSelectedInbox();
    this.getAttachments();
    this.autoSaveSubscription = interval(60000).subscribe(() => this.saveDraft(true));
  }

  getEditorInstance(editorInstance: Quill) {
    const toolbar = editorInstance.getModule('toolbar');
    toolbar.addHandler('image', this.imageHandler);

    const clipboard = editorInstance.getModule('clipboard');
    clipboard.addMatcher('img', function (node, delta) {
      if (delta && delta.ops.length > 0) {
        const img = delta.ops[0];
        if (
          img &&
          img.insert &&
          img.insert.image &&
          (img.insert.image.includes('wpmediaf/email_public') || img.insert.image.includes('ui.b3networks.com'))
        ) {
          return delta;
        }
      }
      delta.ops = [];
      return delta;
    });
  }

  imageHandler = (image, callback) => {
    this.elr.nativeElement.querySelector('#fileInputComposeInline')?.click();
  };

  closeDialog(isReload = false) {
    this.dialogRef.close({ isReload: isReload });
  }

  addAddress(newAddress: EmailAddress, type: 'to' | 'cc' | 'bcc') {
    switch (type) {
      case 'to':
        this.toAddresses = [...this.toAddresses, newAddress];
        break;
      case 'cc':
        this.ccAddresses = [...this.ccAddresses, newAddress];
        break;
      case 'bcc':
        this.bccAddresses = [...this.bccAddresses, newAddress];
        break;
    }
  }

  deleteAddress(address: EmailAddress, type: 'to' | 'cc' | 'bcc') {
    switch (type) {
      case 'to':
        this.toAddresses.splice(this.findAddressIndex(this.toAddresses, address), 1);
        break;
      case 'cc':
        this.ccAddresses.splice(this.findAddressIndex(this.ccAddresses, address), 1);
        break;
      case 'bcc':
        this.bccAddresses.splice(this.findAddressIndex(this.bccAddresses, address), 1);
        break;
    }
  }

  download(attachment: AttachmentMessageData) {
    if (attachment && (attachment.mediaUuid || attachment.fileUuid)) {
      const mediaUuid = attachment.mediaUuid ? attachment.mediaUuid : attachment.fileUuid;
      this.mediaService.getMediaImgOriginal(mediaUuid, this.conversationGroup.id).subscribe(res => {
        download(res['url'], attachment.name);
      });
    }
  }

  chooseResponse(item: CannedResponse) {
    this.txtSubject = item.subject || this.txtSubject;

    // insert content to current position
    const selection = this.emailQuillEditor.quillEditor.getSelection(true);
    this.emailQuillEditor.quillEditor.clipboard.dangerouslyPasteHTML(selection.index, item.content);
    this.content = this.emailQuillEditor.quillEditor.root.innerHTML;
  }

  sendAndArchive() {
    this.selectedSendText = 'send and archive';
    this.compose(true);
  }

  compose(isArchive = false) {
    if (this.validateEmailReq()) {
      const dialogRef = this.dialog.open(SendEmailWaitingDlg, {
        width: '600px',
        disableClose: true
      });

      dialogRef.afterClosed().subscribe(isProcess => {
        if (isProcess) {
          this.send(isArchive);
        }
      });
    }
  }

  archive() {
    const archivedReq = new ConversationGroupReq();
    archivedReq.status = Status.spam;
    this.conversationGroupService
      .updateGroupConversation(this.conversationGroup.id, archivedReq)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(() => {
        this.closeDialog(true);
      });
  }

  schedule() {
    this.selectedSendText = 'send later';
    if (this.validateEmailReq()) {
      const data: SendEmailInboxRequest = new SendEmailInboxRequest();
      data.convoUuid = this.conversationGroup.publicConversationId;
      data.emailMessage = this.buildSendEmailMessageRequest();
      const dialogRef = this.dialog.open(ScheduleEmailComponent, {
        width: '400px',
        data: data
      });

      dialogRef.afterClosed().subscribe(isSchedule => {
        if (isSchedule) {
          this.closeDialog();
        }
      });
    }
  }

  saveDraft(autoSave = false) {
    const emailReq = this.buildSendEmailMessageRequest(false);
    if (autoSave && JSON.stringify(emailReq) === JSON.stringify(this.oldDraft)) {
      return;
    }
    this.oldDraft = emailReq;
    const blob: Blob = new Blob([JSON.stringify(emailReq, null, 2)], { type: 'application/json' });
    this.s3Service
      .generalUpload(blob, 'workspace', `${this.conversationGroup.id}/draft_`)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(directUploadResponse => {
        if (directUploadResponse.fileKey) {
          const draftRequest: EmailUploadRequest = {
            convoUuid: this.conversationGroup.id,
            s3Key: directUploadResponse.fileKey
          };
          this.emailIntegrationService
            .saveDraft(draftRequest)
            .pipe(takeUntil(this.destroySubscriber$))
            .subscribe(
              () => {
                const newConvo = new ConversationGroup({
                  ...this.conversationGroup,
                  description: this.txtSubject,
                  firstEmailRecipient: emailReq?.toAddresses.length > 0 ? emailReq.toAddresses[0].address : null,
                  draft: {
                    emailMessage: emailReq,
                    convoUuid: draftRequest.convoUuid,
                    s3Key: draftRequest.s3Key,
                    createdBy: this.me.uuid,
                    updatedAt: new Date()
                  }
                }).withMeUuid(this.me.userUuid);
                this.conversationGroupService.addConversation2Store(newConvo);
                this.toastService.success('Draft saved');
                if (!autoSave) {
                  this.closeDialog();
                }
              },
              error => {
                this.showError(error);
              }
            );
        }
      });
  }

  deleteDraft() {
    this.emailIntegrationService.deleteDraft(this.conversationGroup.id).subscribe(
      () => {
        const newConvo: ConversationGroup = new ConversationGroup({
          ...this.conversationGroup,
          draft: null
        }).withMeUuid(this.me.userUuid);
        this.conversationGroupService.addConversation2Store(newConvo);
        this.closeDialog();
      },
      error => {
        this.showError(error);
      }
    );
  }

  deleteAttachment(item: AttachmentMessageData) {
    this.attachments = [...this.attachments.filter(att => att.s3Key !== item.s3Key)];
  }

  uploadInline(event) {
    const files = Array.from(event.target.files) as File[];
    if (files.length > 0) {
      this.handleUploadFileInline(files[0]);
      event.target.value = '';
    }
  }

  upload(event: any) {
    const files = Array.from(event.target.files) as File[];
    this.uploadMultipleFiles(files);
  }

  private validateEmailReq() {
    if (!this.selectedInbox) {
      this.toastService.error('Please select a sender');
      return false;
    }

    return true;
  }

  private handleUploadFileInline(file: File) {
    this.uploadEvent = <UploadEvent>{ status: StautsUploader.NONE, percentage: 0 };

    if (!file.type.startsWith('image/')) {
      return;
    }

    const key = file.name;
    this.uploading = true;
    const uploader = this.uploadPublicService.uploadPublicAssets(file, key);
    if (uploader) {
      uploader.subscribe(
        res => {
          this.uploadEvent = res;
          if (this.uploadEvent.status === StautsUploader.COMPLETED) {
            const range = this.emailQuillEditor.quillEditor.getSelection();
            const img = `<img src="${uploader.fileUrl}"></img>`;
            const index = range ? range.index : 0;
            this.emailQuillEditor.quillEditor.clipboard.dangerouslyPasteHTML(index, img);
            this.content = this.emailQuillEditor.quillEditor.root.innerHTML;
            this.uploading = false;
          }
        },
        err => {
          this.toastService.error(err);
          this.uploading = false;
        }
      );
    } else {
      this.uploadEvent = <UploadEvent>{ status: StautsUploader.NONE, percentage: 0 };
      this.uploading = false;
    }
  }
  private getAttachments() {
    if (this.data.isDraft && this.msg && this.msg.attachments && this.msg.attachments.length) {
      this.attachments = this.msg.attachments;
    }
  }

  private createNewChannel() {
    const req = new ConversationGroupReq();
    req.name = `${randomGuid()}:${new Date().toLocaleString()}`;
    req.description = '';
    req.privacy = Privacy.public;
    req.status = Status.temp;
    req.type = GroupType.Email;
    req.conversations.push(new ConversationReq());
    req.conversations[0].members = this.userQuery.getAgentByUuid(this.me.uuid).map(x => x.identityUuid);
    req.conversations[0].role = RoleType.member;
    req.conversations[0].conversationType = ConversationType.public;

    this.isLoading = true;
    this.conversationGroupService
      .createNewConversationGroup(req)
      .pipe(
        takeUntil(this.destroySubscriber$),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(
        newConvo => (this.conversationGroup = newConvo),
        error => {
          this.showError(error);
          this.closeDialog();
        }
      );
  }

  private getEmailSignatures(): void {
    this.emailIntegrationQuery.signatures$.pipe(takeUntil(this.destroySubscriber$)).subscribe(emailSignatures => {
      this.signatures = emailSignatures;
      if (this.signatures.length > 0) {
        this.selectedSignature = this.signatures.find(x => x.isDefault === 'true') || this.signatures[0];
      }
    });
  }

  private getCannedResponse(): void {
    this.cannedResponseQuery.selectEmailCannedResponses$
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(cannedResponses => {
        this.cannedResponses = cannedResponses.filter(
          canned =>
            canned.status === CannedResponseStatus.active &&
            this.inboxes.findIndex(inbox => canned.inbox === inbox.uuid)
        );
      });
  }

  private setSelectedInbox(): void {
    if (this.inboxes.length === 0) {
      this.toastService.error('There is no inbox');
      this.closeDialog();
    } else {
      if (this.inboxes.length === 1) {
        this.selectedInbox = this.inboxes[0];
      }
      if (this.fromAddress && this.fromAddress.address) {
        const selectedFromAddress = this.inboxes.find(inbox => inbox.incommingEmail === this.fromAddress.address);
        if (selectedFromAddress) {
          this.selectedInbox = selectedFromAddress;
        } else {
          this.selectedInbox = <EmailInbox>{
            name: this.data.msg.toAddresses[0].name,
            incommingEmail: this.data.msg.toAddresses[0].address
          };
          if (this.data.isReply) {
            this.toAddresses = [this.fromAddress];
          }
        }
      }
    }
  }

  private send(isArchive: boolean) {
    const req = new SendEmailInboxRequest();
    req.convoUuid = this.conversationGroup.publicConversationId;
    req.emailMessage = this.buildSendEmailMessageRequest();

    if (!this.data.isReply && !this.data.isForward && !this.data.isForwardAsNew) {
      req.isCreate = true;
    }

    this.emailIntegrationService
      .sendEmail(req)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(
        () => {
          const members: Member[] = [
            ...this.conversationGroup.members,
            {
              chatUserUuid: this.me.userUuid,
              role: RoleType.member
            }
          ];
          const firstConvoChild = new ConversationMetadata({
            ...this.conversationGroup.conversations[0],
            members: members
          });
          const newConvo = new ConversationGroup({
            ...this.conversationGroup,
            status: Status.opened,
            conversations: [firstConvoChild],
            lastMessage: new Date().toString(),
            firstEmailRecipient: req.emailMessage.toAddresses[0].address,
            description: req.emailMessage.subject,
            draft: null,
            emailInboxUuid: this.selectedInbox.uuid
          }).withMeUuid(this.me.userUuid);
          this.conversationGroupService.addConversation2Store(newConvo);
          if (isArchive) {
            this.archive();
          } else {
            this.closeDialog(true);
          }
        },
        error => {
          if (error.code === 'email.exceedMaximum') {
            this.toastService.error('Your email exceeds 10Mb');
          } else {
            this.showError(error);
          }
        }
      );
  }

  private buildSendEmailMessageRequest(withSignature = true): EmailMessageGeneral {
    this.content = this.content || '';

    const email: EmailMessageGeneral = new EmailMessageGeneral();
    email.fromAddresses = [];

    const displayName = this.selectedSignature ? this.selectedSignature.senderInfo : this.me.displayName;
    if (this.selectedInbox) {
      email.fromAddresses.push({
        name: displayName,
        address: this.selectedInbox.incommingEmail
      });
    }

    email.toAddresses = this.toAddresses;
    email.ccAddresses = this.ccAddresses;
    email.bccAddresses = this.bccAddresses;
    email.charset = 'UTF-8';
    email.htmlText = this.content;

    if (this.selectedSignature && withSignature) {
      email.htmlText += `<br>${this.selectedSignature.content}`;
    }

    if (this.data.isForward) {
      email.htmlText += `<br><br>` + this.getTextHtmlForwardDisplay();
      email.actionType = 'forward';
      email.previousEmailHtml = this.getTextHtmlForwardDisplay();
    } else if (this.data.isReply) {
      email.actionType = 'reply';
      email.inReplyTo = this.msg.inReplyTo;
      email.previousEmailHtml = this.data.msg.htmlText;
      email.htmlText += `<br><br>` + this.getTextHtmlReplyDisplay();
      delete email.replyToAddresses;
    } else if (this.data.isDraft) {
      email.htmlText += `<br><br>` + this.textHTMLEmailQuote;
    }

    email.text = this.emailQuillEditor.quillEditor.getText();
    if (email.text === '\n') {
      email.text = '';
    }
    email.subject = this.txtSubject;
    email.attachments = this.attachments;

    email.htmlText = this.removeInputInsideHTMLText(email.htmlText);

    return email;
  }

  private findAddressIndex(addressArray: EmailAddress[], address: EmailAddress) {
    return addressArray.findIndex(addr => addr.address === address.address);
  }

  private uploadMultipleFiles(files: File[]) {
    if (!files || files.length === 0) {
      return;
    }
    if (files.length > 0) {
      this.uploadFile(files, 0);
    }
  }

  private uploadFile(models: File[], index: number) {
    const dialog = this.dialog.open(UploadDialogComponent, {
      width: '500px',
      disableClose: true,
      data: <UploadDialogInput>{
        file: models[index],
        ticket: this.conversationGroup,
        index: index + 1,
        max: models.length,
        isNoStore: true
      }
    });

    dialog.afterClosed().subscribe(
      (message: AttachmentMessageData) => {
        // next
        this.attachments = [...this.attachments, message];
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, index);
        }
      },
      _ => {
        // next
        index = index + 1;
        if (index < models.length) {
          this.uploadFile(models, index);
        }
      }
    );
  }

  private showError(error: HttpErrorResponse) {
    this.toastService.error(error && error.message ? error.message : MessageConstants.GENERAL_ERROR);
  }

  private getTextHtmlReplyDisplay() {
    const date = format(this.data.time, "ccc, LLL dd, yyyy 'at' h:mm a");
    let txtFrom = `&lt;${this.msg.fromAddresses[0].address}&gt;`;
    if (this.msg.fromAddresses[0].name) {
      txtFrom = `<strong>${this.msg.fromAddresses[0].name}</strong>&lt;<a href="mailto:${this.msg.fromAddresses[0].address}">${this.msg.fromAddresses[0].address}</a>&gt;`;
    }
    const content = this.data.msg.htmlText;

    return `<div class="gmail_quote">
    <div dir="ltr" class="gmail_attr">
      On ${date} ${txtFrom} wrote: <br />
    </div>
    <blockquote
      class="gmail_quote"
      style="margin: 0px 0px 0px 0.8ex; border-left: 1px solid rgb(204, 204, 204); padding-left: 1ex"
    >
    ${content}
    </blockquote>
  </div>`;
  }

  private getTextHtmlForwardDisplay() {
    let txtFrom = `From: <span>&lt;${this.msg.fromAddresses[0].address}&gt;</span><br>`;
    if (this.msg.fromAddresses[0].name) {
      txtFrom = `From: <strong>${this.msg.fromAddresses[0].name}</strong> <span>&lt;${this.msg.fromAddresses[0].address}&gt;</span><br>`;
    }
    const txtDate = `Date: ${this.data.time.toLocaleString()}<br>`;
    const txtSubject = `Subject: ${this.msg.subject}<br>`;
    const txtTo = 'To: ' + this.msg.toAddresses.map(x => `${x.name} &lt;${x.address}&gt;`).join(', ') + '<br>';
    let txtCc = '';
    if (this.msg.ccAddresses && this.msg.ccAddresses.length > 0) {
      txtCc = 'Cc: ' + this.msg.ccAddresses.map(x => `${x.name} &lt;${x.address}&gt;`).join(', ') + '<br>';
    }
    let txtBcc = '';
    if (this.msg.bccAddresses && this.msg.bccAddresses.length > 0) {
      txtBcc = 'Bcc: ' + this.msg.bccAddresses.map(x => `${x.name} &lt;${x.address}&gt;`).join(', ') + '<br>';
    }

    const content = this.data.msg.htmlText;

    return `<div class="gmail_quote">
    <div dir="ltr" class="gmail_attr">
    ---------- Forwarded message ---------<br>${txtFrom}${txtDate}${txtSubject}${txtTo}${txtCc}${txtBcc}
    <br>
    </div>
    <div>
    ${content}
    </div>
  </div>`;
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
