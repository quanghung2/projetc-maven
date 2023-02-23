export interface ContactCustomer {
  uuid: string;
  name: string;
}

export interface ContactNumber {
  number: string;
}

export interface ContactEmail {
  email: string;
}

export class Contact {
  uuid: string;
  givenName: string;
  familyName: string;
  displayName: string;
  fullName: string;

  customer: ContactCustomer;
  numbers: ContactNumber[];
  emails: ContactEmail[];
  contactLists: ContactList[];
  type: UserContactType;

  // ui
  chatCustomerId: string; // id chat
  isTemporary: boolean;
  isNotExisted: boolean; // uuid is guid random

  constructor(obj?: Partial<Contact>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }

  get typeContactList() {
    return this.contactLists?.length > 0 ? this.contactLists[0].type : null;
  }

  get emailString() {
    if (this.emails?.length < 1) {
      return '';
    } else if (this.emails?.length > 1) {
      return `${this.emails?.length} emails`;
    }

    return this.emails?.[0]?.email;
  }

  get emailList() {
    return this.emails?.map(e => e.email).toString();
  }

  get numberString() {
    if (this.numbers?.length < 1) {
      return '';
    } else if (this.numbers?.length > 1) {
      return `${this.numbers?.length} numbers`;
    }

    // return mask(this.numbers[0].number);
    return this.numbers?.[0]?.number;
  }

  get numberList() {
    // return this.numbers.map(n => mask(n.number)).toString();
    return this.numbers.map(n => n.number).toString();
  }
}

export interface StoreContactReq {
  customerUuid?: string;
  givenName?: string;
  familyName?: string;
  displayName: string;
  email?: string;
  number?: string;
  type: UserContactType;
}

export enum ContactFilterBy {
  ORGANIZATION = 'ORGANIZATION',
  CUSTOMER = 'CUSTOMER'
}

export interface ContactList {
  /**
   * type = company => uuid is orgUuid
   * type = personal => uuid is identityUser
   * */
  uuid: string;
  type: ContactType;
}

export enum ContactType {
  personal = 'personal',
  company = 'company'
}

export enum UserContactType {
  visitor = 'visitor',
  customer = 'customer'
}

export interface ContactsFilterState {
  type: ContactFilterBy;
  keyword: string;
}

export interface DesktopContact {
  name?: string;
  number: string;
}
