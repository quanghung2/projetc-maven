import { Component, EventEmitter, Input, OnInit, Output, QueryList, ViewChildren } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
  ActionCreate,
  ActionDisplay,
  EnumTypeActionContact,
  EnumTypeInput,
  FieldContact,
  IntegrationService,
  ParamsRequestContract
} from '@b3networks/api/integration';
import { X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';
import { DynamicInputComponent } from '../dynamic-input/dynamic-input.component';

@Component({
  selector: 'b3n-contact-create',
  templateUrl: './contact-create.component.html',
  styleUrls: ['./contact-create.component.scss']
})
export class ContactCreateComponent implements OnInit {
  @Input() contact: ActionCreate;
  @Input() phoneNumber: string;
  @Input() txnUuid: string;
  @Output() contactDisplay = new EventEmitter<ActionDisplay>();

  @ViewChildren(DynamicInputComponent) dynamicInputComp: QueryList<DynamicInputComponent>;

  isCreating = false;
  constructor(
    private fb: UntypedFormBuilder,
    private integrationService: IntegrationService,
    private toastService: ToastService
  ) {}

  ngOnInit() {}

  onSave() {
    const root: UntypedFormGroup = this.fb.group({});
    this.dynamicInputComp.forEach((comp, index) => {
      root.addControl(`${index}`, comp.control);
    });
    // trigger validator all form control with MyErrorStateMatcher
    root.markAllAsTouched();
    if (root.invalid) {
      return;
    }

    const backup = Object.assign([], this.contact.data.properties);
    this.transferInputNestedSelectToSelect(this.contact.data.properties);
    this.isCreating = true;
    this.integrationService
      .createorUpdateContactByEndpoint(
        X.orgUuid,
        this.contact.data.creationEndpoint,
        new ParamsRequestContract({
          properties: this.contact.data.properties,
          phoneNumber: this.phoneNumber,
          txnUuid: this.txnUuid
        })
      )
      .pipe(finalize(() => (this.isCreating = false)))
      .subscribe(
        (res: any) => {
          if (res && (<any[]>res).length > 0) {
            const model = res[0];
            if (model.code === EnumTypeActionContact.ErrorCreate) {
              this.toastService.error(model.data.errorMsg);
            }
          } else {
            this.convertCreateToDisplayModel(this.contact, res.id);
            this.toastService.success('New contact has been added');
          }
        },
        err => {
          this.contact.data.properties = backup;
          this.toastService.error(err.message);
        }
      );
  }

  private convertCreateToDisplayModel(contact: ActionCreate, idContact: string) {
    const display = new ActionDisplay({
      code:
        this.contact.code === EnumTypeActionContact.CreateTicket
          ? EnumTypeActionContact.DisplayTicket
          : EnumTypeActionContact.Display,
      order: 0,
      data: {
        contacts: [
          {
            id: idContact,
            profileUrl: null,
            properties: contact.data.properties
          }
        ],
        updateEndpoint: contact.data.updateEndpoint
      }
    });
    this.contactDisplay.emit(display);
  }

  private transferInputNestedSelectToSelect(prop: FieldContact[]) {
    const indexNested = prop.findIndex(x => x.type === EnumTypeInput.Nested_select);
    if (indexNested > -1) {
      const values = prop[indexNested]?.value as FieldContact[];
      if (values && values.length > 0) {
        values.forEach(value => {
          const model = new FieldContact(value);
          // model.type = EnumTypeInput.Select;
          prop.push(model);
        });
      }
      // remove nested
      prop.splice(indexNested, 1);
    }
  }
}
