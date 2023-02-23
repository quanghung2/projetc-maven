import { format } from 'date-fns';

export class AnnouncementResp {
  id: number;
  title: string;
  content: string;
  createdAt: number;
  modifiedAt: number;
  displayDate: string;
  creator: CreatorAndEditorDetail;
  editor: CreatorAndEditorDetail;

  constructor(obj?: Partial<AnnouncementResp>) {
    if (obj) {
      Object.assign(this, obj);

      this.displayDate = this.modifiedAt
        ? format(new Date(this.modifiedAt * 1000), 'MMM do')
        : format(new Date(this.createdAt * 1000), 'MMM do');
    }
  }
}

export interface CreatorAndEditorDetail {
  name: string;
  uuid: string;
}

export interface PostCreateAnnouncementReq {
  title: string;
  content: string;
}

export interface PutUpdateAnnouncementReq {
  title: string;
  content: string;
  status: 'ACTIVE' | 'DISABLED';
}
