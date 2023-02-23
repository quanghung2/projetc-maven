import { COMMA, ENTER } from '@angular/cdk/keycodes';
import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { Extension } from '@b3networks/api/bizphone';
import { CallerIdService } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { Observable } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'b3n-admin-tools-caller-id',
  templateUrl: './admin-tools-caller-id.component.html',
  styleUrls: ['./admin-tools-caller-id.component.scss']
})
export class AdminToolsCallerIdComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() extension: Extension;
  @Output() assignedNumbersChange = new EventEmitter<string[]>();
  @ViewChild('fruitInput') fruitInput: ElementRef<HTMLInputElement>;

  selectable = true;
  removable = true;
  separatorKeysCodes: number[] = [ENTER, COMMA];
  numberCtrl = new UntypedFormControl();
  filteredNumbers: Observable<string[]>;
  numbers: string[];
  allNumbers: string[];

  constructor(private callerIdService: CallerIdService) {
    super();
    this.onChangeSelectedNumbers();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes['extension']) {
      if (this.extension?.transferCallerIdConfig.assignedCallerIds)
        this.numbers =
          this.extension?.transferCallerIdConfig?.assignedCallerIds?.length > 0
            ? [...this.extension.transferCallerIdConfig.assignedCallerIds]
            : [];
    }
  }

  ngOnInit(): void {
    this.callerIdService
      .getAll(true)
      .pipe(takeUntil(this.destroySubscriber$))
      .subscribe(numbers => {
        this.allNumbers = numbers || [];
      });
  }

  onChangeSelectedNumbers() {
    this.filteredNumbers = this.numberCtrl.valueChanges.pipe(
      startWith(''),
      map((value: string | null) => (value ? this._filter(value) : this.allNumbers.slice())),
      map(numbers => numbers.filter(number => !this.numbers?.includes(number)))
    );
  }

  remove(number: string): void {
    const index = this.numbers.indexOf(number);

    if (index >= 0) {
      this.numbers.splice(index, 1);
    }
    this.assignedNumbersChange.emit(this.numbers);

    this.onChangeSelectedNumbers();
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.viewValue;
    if (!this.numbers.includes(value)) {
      this.numbers.push(event.option.viewValue);
    }
    this.assignedNumbersChange.emit(this.numbers);
    this.fruitInput.nativeElement.value = '';
    this.numberCtrl.setValue(null);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allNumbers.filter(number => number.toLowerCase().includes(filterValue));
  }
}
