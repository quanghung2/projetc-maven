export class FileResp {
  s3Key: string;
  fileUrl: string;
  mediaUuid: string;

  constructor(s3Key?: string, fileUrl?: string, mediaUuid?: string) {
    this.s3Key = s3Key;
    this.fileUrl = fileUrl;
    this.mediaUuid = mediaUuid;
  }
}

export enum MediaConversationType {
  team = 'team', // for directchat
  group = 'group', // for groupchat
  livechat = 'livechat',
  customer = 'customer',
  whatsapp = 'whatsapp',
  email = 'email',
  emailpublic = 'email_public'
}

export enum UploadForMode {
  general = 'general',
  email = 'email'
}
