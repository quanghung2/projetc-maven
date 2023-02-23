import { UntypedFormArray } from '@angular/forms';

export class ParamsRequestContract {
  properties: FieldContact[];
  contactId: string;
  phoneNumber: string;
  txnUuid: string;

  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class LabelValue {
  value: string;
  label: string;
  options: LabelValue[]; // for nested select
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.options) {
        this.options = this.options.map(x => new LabelValue(x)) || [];
      }
    }
  }
}

export class IntegrationModel {
  crmIntegrated: boolean;
  constructor(obj?: Partial<IntegrationModel>) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum EnumTypeInput {
  Textarea = 'textarea',
  Text = 'text',
  Date = 'date',
  File = 'file',
  Number = 'number',
  Select = 'select',
  Nested_select = 'nested_select',
  Radio = 'radio',
  Checkbox = 'checkbox',
  Booleancheckbox = 'booleancheckbox'
}

export class ContactUser {
  callUuid: string;
  phoneNumber: string;
}

export enum EnumTypeActionContact {
  Display = 'display_possible_contacts',
  Create = 'display_create_contact_dialog',
  DisplayTicket = 'display_possible_ticket',
  CreateTicket = 'display_create_ticket_dialog',
  ErrorCreate = 'display_vendor_error'
}

export class FieldContact {
  name: string;
  label: string;
  value: string | FieldContact[]; // FieldContact for nested select
  type: EnumTypeInput;
  required: boolean;
  options: LabelValue[] | UntypedFormArray | any; // FormArray for nested select
  dependentProperties: DependentProperty[]; // for nested select
  level: number; // for nested select
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.options) {
        this.options = this.options.map(x => new LabelValue(x)) || [];
      }
      if (obj.dependentProperties) {
        this.dependentProperties = this.dependentProperties.map(x => new DependentProperty(x)) || [];
      }
    }
  }
}

export class DependentProperty {
  label: string;
  level: number;
  name: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export class ActionContactModel {
  code: EnumTypeActionContact;
  action: ActionDisplay | ActionCreate | ActionError;
  constructor(obj?: any) {
    if (obj) {
      this.code = obj.code;
      if (this.code === EnumTypeActionContact.Display) {
        this.action = new ActionDisplay(obj);
      } else if (this.code === EnumTypeActionContact.Create || this.code === EnumTypeActionContact.CreateTicket) {
        this.action = new ActionCreate(obj);
      } else if (this.code === EnumTypeActionContact.ErrorCreate) {
        this.action = new ActionError(obj);
      }
    }
  }
}

export class RespCreateContact {
  code: EnumTypeActionContact;
  data: {
    errorMsg: string;
  };
  order: number;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

// CREATE ACTION ----------- Head
export class ActionCreate {
  code: EnumTypeActionContact;
  data: ContactCreateData = new ContactCreateData();
  order: number;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.data = new ContactCreateData(obj.data);
    }
  }
}

export class ContactCreateData {
  properties: FieldContact[] = [];
  creationEndpoint: CreateOrUpdateEndPoint = new CreateOrUpdateEndPoint();
  updateEndpoint: CreateOrUpdateEndPoint = new CreateOrUpdateEndPoint();
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      if (obj.properties) {
        this.properties = this.properties.map(item => new FieldContact(item));
      }
      this.creationEndpoint = new CreateOrUpdateEndPoint(obj.creationEndpoint);
      this.updateEndpoint = new CreateOrUpdateEndPoint(obj.updateEndpoint);
    }
  }
}

export class CreateOrUpdateEndPoint {
  url: string;
  params: EnumParamsCreateContact[];
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

export enum EnumParamsCreateContact {
  orgUuid = 'orgUuid',
  properties = 'properties',
  contactId = 'contactId',
  phoneNumber = 'phoneNumber',
  txnUuid = 'txnUuid'
}
// CREATE ACTION ----------- Footer

// DISPLAY ACTION ----------- Head
export class ActionDisplay {
  code: EnumTypeActionContact;
  data: ContactDisplayData = new ContactDisplayData();
  order: number;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.data = new ContactDisplayData(obj.data);
    }
  }
}

export class ContactDisplayData {
  contacts: ContactDisplayDetail[] = [];
  properties: FieldContact[] = [];
  updateEndpoint: CreateOrUpdateEndPoint;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.updateEndpoint = new CreateOrUpdateEndPoint(obj.updateEndpoint);
      if (obj.properties) {
        this.properties = this.properties.map(item => new FieldContact(item));
        this.contacts = this.contacts.map(item => new ContactDisplayDetail(item, this.properties));
      } else {
        this.contacts = this.contacts.map(item => new ContactDisplayDetail(item));
      }
    }
  }
}

export class ContactDisplayDetail {
  id: string;
  profileUrl: string;
  properties: FieldContact[] = [];

  // customize UI
  isEditing = false;
  isSaving = false;
  constructor(obj?: any, propHasType?: FieldContact[]) {
    if (obj) {
      Object.assign(this, obj);

      // map value
      if (propHasType) {
        this.properties.forEach((item, index) => {
          if (propHasType[index].type) {
            item.type = propHasType[index].type;
          }
          if (propHasType[index].options) {
            item.options = propHasType[index].options;
          }
        });
      } else {
        this.properties = this.properties.map(item => new FieldContact(item));
      }
    }
  }
}
// DISPLAY ACTION ----------- Footer

// ERROR ACTION ----------- Head
export class ActionError {
  code: EnumTypeActionContact;
  data: ContactErrorData = new ContactErrorData();
  order: number;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
      this.data = new ContactErrorData(obj.data);
    }
  }
}

export class ContactErrorData {
  errorMsg: string;
  constructor(obj?: any) {
    if (obj) {
      Object.assign(this, obj);
    }
  }
}

// ERROR ACTION ----------- Footer
