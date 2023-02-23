import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ValidCheckService } from '../service/valid-check.service';

@Directive({
  selector: '[phoneNumAddedRequired]'
})
export class PhoneNumAddedListRequiredDirective implements OnChanges {
  @Input() phoneNumAddedRequired: number;

  constructor(private validCheckService: ValidCheckService) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['phoneNumAddedRequired']) {
      changes['phoneNumAddedRequired'].currentValue > 0
        ? this.validCheckService.setInvalidTransferForm(false)
        : this.validCheckService.setInvalidTransferForm(true);
    }
  }
}
