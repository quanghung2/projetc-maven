import { Component, Input, OnInit, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionDisplay,
  ContactDisplayDetail,
  EnumTypeActionContact,
  EnumTypeInput,
  FieldContact,
  IntegrationService,
  ParamsRequestContract,
  RespCreateContact
} from '@b3networks/api/integration';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { DynamicInputComponent } from '../dynamic-input/dynamic-input.component';

@Component({
  selector: 'b3n-contact-display',
  templateUrl: './contact-display.component.html',
  styleUrls: ['./contact-display.component.scss']
})
export class ContactDisplayComponent implements OnInit {
  @Input() contact: ActionDisplay;
  @Input() phoneNumber: string;

  @ViewChildren(DynamicInputComponent) dynamicInputComp: QueryList<DynamicInputComponent>;
  readonly EnumTypeActionContact = EnumTypeActionContact;

  listContactEdit: InfoContactEditing[] = []; // cache data before edit
  enumTypeInput = EnumTypeInput;
  propPhoneField: FieldContact;

  constructor(
    private fb: UntypedFormBuilder,
    private integrationService: IntegrationService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  directProfile(url: string) {
    const a = document.createElement('a');
    a.target = '_blank';
    a.href = url;
    a.click();
  }

  onCancel(item: ContactDisplayDetail, index: number) {
    this.contact.data.contacts[index] = this.listContactEdit.find(x => x.index === index).contact;
    this.contact.data.contacts[index].isEditing = false;
    // remove contact editing
    this.listContactEdit = this.listContactEdit.filter(x => x.index !== index);
  }

  onEdit(item: ContactDisplayDetail, index: number) {
    this.listContactEdit.push(new InfoContactEditing(index, item));
    item.isEditing = true;
  }

  onSave(item: ContactDisplayDetail, index: number) {
    const root: UntypedFormGroup = this.fb.group({});
    this.dynamicInputComp.forEach((comp, i) => {
      root.addControl(`${i}`, comp.control);
    });
    // trigger validator all form control with MyErrorStateMatcher
    root.markAllAsTouched();
    if (root.invalid) {
      return;
    }

    const contact = this.contact.data.contacts[index];
    item.isSaving = true;
    this.integrationService
      .createorUpdateContactByEndpoint(
        X.orgUuid,
        this.contact.data.updateEndpoint,
        new ParamsRequestContract({
          properties: contact.properties,
          contactId: contact.id,
          phoneNumber: this.phoneNumber
        })
      )
      .pipe(finalize(() => (item.isSaving = false)))
      .subscribe(
        (res: RespCreateContact[]) => {
          if (res && res.length > 0) {
            // errror from BE
            const model = res[0];
            if (model.code === EnumTypeActionContact.ErrorCreate) {
              this.toastService.error(model.data.errorMsg);
            }
          } else {
            // clear cache edit
            item.isEditing = false;
            item.isSaving = false;
            this.listContactEdit = this.listContactEdit.filter(x => x.index !== index);
            this.toastService.success('Contact has been edited!');
          }
        },
        err => {
          this.toastService.error(err.message);
        }
      );
  }
}

export class InfoContactEditing {
  index: number;
  contact: ContactDisplayDetail;
  constructor(index: number, contact: ContactDisplayDetail) {
    this.index = index;
    this.contact = JSON.parse(JSON.stringify(contact));
  }
}
