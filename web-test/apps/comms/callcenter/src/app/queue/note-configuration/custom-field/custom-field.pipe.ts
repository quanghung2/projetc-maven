import { Pipe, PipeTransform } from '@angular/core';
import { TypeCustomField } from '@b3networks/api/callcenter';

@Pipe({
  name: 'customField'
})
export class CustomFieldPipe implements PipeTransform {
  transform(type: TypeCustomField): string {
    if (type === TypeCustomField.textField) {
      return 'Text Field';
    }
    if (type === TypeCustomField.numberField) {
      return 'Number Field';
    }
    if (type === TypeCustomField.singleChoiceField) {
      return 'Single Choice Field';
    }
    if (type === TypeCustomField.multipleChoiceField) {
      return 'Multiple Choice Field';
    }
    return type;
  }
}
