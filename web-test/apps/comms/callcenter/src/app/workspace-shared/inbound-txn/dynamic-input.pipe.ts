import { Pipe, PipeTransform } from '@angular/core';
import { EnumTypeInput, FieldContact } from '@b3networks/api/integration';
import { format, parse } from 'date-fns';

@Pipe({
  name: 'dynamicInput'
})
export class DynamicInputPipe implements PipeTransform {
  transform(item: FieldContact): string {
    if (item.value === undefined || item.value === null || item.value === '') {
      return 'None';
    }

    if (item.type === EnumTypeInput.Select || item.type === EnumTypeInput.Nested_select) {
      return item.options.find(x => x.value === item.value).label || 'None';
    }

    if (item.type === EnumTypeInput.Radio) {
      const find = item.options.find(x => x.value === item.value);
      return find ? find.label : 'None';
    }

    if (item.type === EnumTypeInput.Date) {
      return format(parse(item.value as string, 'yyyy-MM-dd', new Date()), 'dd/MM/yyyy');
    }

    return item.value as string;
  }
}
