import { Directive, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ValidCheckService } from '../service/valid-check.service';

@Directive({
  selector: '[startWithRequired]'
})
export class CheckRequiredListDirective implements OnChanges {
  @Input() startWithRequired: string[];

  constructor(private validCheckService: ValidCheckService) {}

  ngOnChanges(changes: SimpleChanges) {
    changes['startWithRequired']
      ? this.validCheckService.checkInvalidConditionBlock(changes['startWithRequired'].currentValue)
      : this.validCheckService.checkInvalidConditionBlock([]);
  }
}
