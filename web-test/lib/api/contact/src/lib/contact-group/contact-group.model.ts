
export class ContactGroup {
  uuid: string;
  name: string;
  description: string;
  createdDateTime: Date;
  status: string;

  constructor(obj?: Partial<ContactGroup>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export interface RequestCreateGroup {
  name: string;
  description: string;
  contactUuids?: string[];
}

export interface RequestUploadContact {
  // contactList?: ContactList[]; // ignore if upload company contacts
  // type: UserContactType; // customer
  // bucket: string;
  key: string;
}
