import { KeyValue } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { MatSelectChange } from '@angular/material/select';
import { CustomFieldParams, Integration } from '@b3networks/api/ivr';
import { FreshdeskService } from './freshdesk.service';
import { ControlContainer, NgForm } from '@angular/forms';
import { finalize } from 'rxjs/operators';

class FreshDeskField {
  ticketFieldId: number;
  label: string;
  value: string;
  choices: any[];
  type: string;
  level: number;
  treeChoices: any[];

  get isNestedField() {
    return this.level > 1;
  }
}

@Component({
  selector: 'b3n-fresh-desk',
  templateUrl: './fresh-desk.component.html',
  styleUrls: ['./fresh-desk.component.scss'],
  viewProviders: [{ provide: ControlContainer, useExisting: NgForm }]
})
export class FreshDeskComponent implements OnInit, OnChanges {
  @Input() integration: Integration;

  fetching: boolean;

  fields: FreshDeskField[];
  customFields: FreshDeskField[];

  constructor(private freshdeskService: FreshdeskService) {}

  ngOnInit() {
    this.loadFreshdeskFields();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.integration.extra.custom_fields) {
      this.integration.extra.custom_fields = <CustomFieldParams>{};
    }
  }

  get haveRequiredFields() {
    return this.integration.subDomain && this.integration.apiKey && this.integration.registeredEmail;
  }

  loadFreshdeskFields() {
    if (this.haveRequiredFields) {
      this.initFields();
    }
  }

  customFieldsChanged(event: MatSelectChange, changedField: any) {
    this.resetChildFields(changedField);
    changedField.value = event.value;

    if (!event.value && changedField.type in this.integration.extra.custom_fields) {
      delete this.integration.extra.custom_fields[changedField.type];
    } else if (changedField.value) {
      this.integration.extra.custom_fields[changedField.type] = changedField.value;

      const nestedField = this.customFields.find(
        field => field.ticketFieldId === changedField.ticketFieldId && field.level === changedField.level + 1
      );
      if (nestedField) {
        let choices = nestedField.treeChoices;
        for (let i = 1; i <= nestedField.level; i++) {
          const parentField = this.customFields.find(
            field => field.level === i && field.ticketFieldId === nestedField.ticketFieldId
          );
          if (parentField && parentField.value) {
            choices = choices[parentField.value];
          }
        }
        if (choices instanceof Array) {
          nestedField.choices = choices.map(item => {
            return { key: item, value: item };
          });
        } else {
          nestedField.choices = Object.keys(choices).map(item => {
            return { key: item, value: item };
          });
        }
      }
    }
  }

  private resetChildFields(parentField: any) {
    if (parentField) {
      this.customFields
        .filter(field => {
          return field.level > parentField.level && field.ticketFieldId === parentField.ticketFieldId;
        })
        .forEach(child => {
          child.choices = [];
          child.value = '';
          if (child.type in this.integration.extra.custom_fields) {
            delete this.integration.extra.custom_fields[child.type];
          }
        });
    }
  }

  private initFields() {
    this.fetching = true;
    this.fields = [];
    this.customFields = [];
    this.freshdeskService
      .fetchTickedFields(this.integration.subDomain, this.integration.apiKey)
      .pipe(finalize(() => (this.fetching = false)))
      .subscribe(
        fields => {
          fields.forEach(field => {
            let choices: KeyValue<any, any>[];
            if (field.choices) {
              choices = [];
              if (field.isStatus) {
                field.choices = field.choices as { [TKey in number]: string[] };
                for (const choiceKey in field.choices) {
                  if (choiceKey in field.choices) {
                    choices.push({ key: +choiceKey, value: field.choices[choiceKey][0] });
                  }
                }
              } else if (field.choices instanceof Array) {
                field.choices = field.choices as string[];
                for (const choiceKey in field.choices) {
                  if (choiceKey in field.choices) {
                    choices.push({ key: field.choices[choiceKey], value: field.choices[choiceKey] });
                  }
                }
              } else if (field.isNestedTicketFields) {
                for (const choiceKey in field.choices) {
                  if (choiceKey in field.choices) {
                    choices.push({ key: choiceKey, value: choiceKey });
                  }
                }
              } else {
                field.choices = field.choices as { [Tkey in string]: number };
                for (const choiceKey in field.choices) {
                  if (choiceKey in field.choices) {
                    choices.push({ key: field.choices[choiceKey], value: choiceKey });
                  }
                }
              }
            }

            let fieldType = field.name;
            if (field.name === 'group') {
              fieldType = 'group_id';
            } else if (field.name === 'product') {
              fieldType = 'product_id';
            } else if (field.name === 'ticket_type') {
              fieldType = 'type';
            }

            if (field.isRequired) {
              this.fields.push(
                Object.assign(new FreshDeskField(), {
                  label: field.label,
                  value: this.integration.extra[fieldType] || '',
                  choices: choices,
                  type: fieldType,
                  level: 1
                })
              );
            } else {
              this.customFields.push(
                Object.assign(new FreshDeskField(), {
                  ticketFieldId: field.id,
                  label: field.label,
                  value: this.integration.extra.custom_fields[fieldType] || '',
                  choices: choices,
                  type: fieldType,
                  level: 1
                })
              );

              //Only custom field have the nested type
              if (field.isNestedTicketFields) {
                field.nested_ticket_fields
                  .sort((a, b) => a.level - b.level) // order by level
                  .forEach(se => {
                    choices = field.choices;
                    for (let i = 1; i < se.level; i++) {
                      const parentField = this.customFields.find(
                        nestedField => nestedField.level === i && nestedField.ticketFieldId === se.ticket_field_id
                      );
                      if (parentField && parentField.value) {
                        choices = choices[parentField.value];
                      } else {
                        choices = [];
                      }
                    }

                    if (choices instanceof Array) {
                      choices = choices.map(item => {
                        return { key: item, value: item };
                      });
                    } else if (choices != null) {
                      choices = Object.keys(choices).map(item => {
                        return { key: item, value: item };
                      });
                    }

                    this.customFields.push(
                      Object.assign(new FreshDeskField(), {
                        ticketFieldId: se.ticket_field_id,
                        label: se.label,
                        value: this.integration.extra.custom_fields[se.name] || '',
                        choices: choices,
                        type: se.name,
                        level: se.level,
                        treeChoices: field.choices
                      })
                    );
                  });
              }
            }
          });
        },
        (err: any) => {}
      );
  }
}
