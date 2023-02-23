export class CaseActivity {
  id: number;
  description: string;

  affectedId?: number;
  affectedUuid?: string;
  affectedName?: string;
  affectedPhotoUrl?: string;
  affectedScope?: string;

  eventType: string;
  type: 'event' | 'comment';
  formattedType: string;

  orgUuid: string;

  triggeredByUuid: string;
  triggeredByName: string;
  triggeredByPhotoUrl: string;

  createdAt: number;
  updatedAt: number;

  constructor(obj?: Partial<CaseActivity>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
  get photoUrlHtml() {
    return this.triggeredByPhotoUrl ? `url(${this.triggeredByPhotoUrl})` : '';
  }

  get byNameHtml() {
    return this.triggeredByUuid ? this.triggeredByName : this.description.split(':')[0].replace('<p>', '');
  }
}

export interface CreateCaseCommentReq {
  sid?: number;
  caseId?: number;
  description?: string;
  mentionIds?: string[];
  descriptionRaw?: string;
  formattedType?: 'html';
}
