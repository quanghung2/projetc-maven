export interface Item {
  label: string;
  type: string;
  options: string[];
  expand?: boolean;
}

export declare type TemplateModule = 'callcenter' | 'flow' | 'survey';

export interface GetNoteTemplate {
  module: TemplateModule;
}

export class NoteTemplate {
  templateUuid: string;
  title: string;
  module: string;
  items: Item[];

  constructor(obj?: Partial<NoteTemplate>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}
