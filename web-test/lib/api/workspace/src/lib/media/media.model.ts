import { ConvoType, UserType } from '../enums.model';

export const PREFIX_ORIGINAL = '_Original';

export interface FileDetail {
  convoId: string; // mapping
  userId: string; // hyperspace
  name: string;
  uri: string; // storage://fileKey , legacy://media
  fileType: string; // "image/png"
  orgUuid: string; // hyperspace
  size: number;
  metadata: {
    width: number;
    height: number;
  };
  mediaId: string;
  createdTime: number;
  msgId: string;
}

export class Media {
  convoType: string;
  convoUuid: string;
  createdDateTime: string;
  id: string;
  identityUuid: string;
  mediaKey: string;
  mediaType: string;
  orgUuid: string;
  uuid: string;
  thumbnail: string;

  constructor(obj?: any) {
    Object.assign(this, obj);
  }

  get displayName() {
    return this.mediaKey.split('/').pop();
  }
}

export interface RequestCreateMedia {
  convoId: string;
  convoType: ConvoType;
  namespace: string;
  key: string;
  filename: string;
  fileType: string;
  size: number;
  userId: string;
  userType: UserType;
  wssToken: string;
  chatServer: string;
  metadata: {
    [key: string]: string | number;
    height: number;
    width: number;
  }; // to broadcast message

  hyperspaceId?: string;
}
