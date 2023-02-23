export enum StatusMessage {
  failed = 'failed'
  // successed = 'successed'
}

export class AttachmentMessageData {
  name: string;
  uri: string;
  fileType: string;
  size: number;
  width: number;
  height: number;
  fileUuid: string;
  s3Key: string;
  mediaUuid: string;
  mediaId: string;

  static create(file: File, uri: string, fileUuid: string, s3Key: string, mediaUuid?: string): AttachmentMessageData {
    const rs = new AttachmentMessageData();

    rs.name = file.name;
    rs.uri = uri;
    rs.fileType = file.name.split('.').pop();
    rs.size = file.size;
    rs.fileUuid = fileUuid;
    rs.s3Key = s3Key;
    rs.mediaUuid = mediaUuid;

    return rs;
  }

  constructor(obj?: Partial<AttachmentMessageData>) {
    if (obj) {
      Object.assign(this, obj);

      if (obj['mediaId']) {
        this.mediaUuid = obj['mediaId'];
      }
    }
  }
}

export interface AttachmentMessageDataV2 {
  attachment: AttachmentMessageData;
  waSentStatus: {
    status: StatusMessage;
  };
}
