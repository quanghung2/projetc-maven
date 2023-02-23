import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import { InvoiceStatus, UserInvoiceQuery, UserInvoiceService } from '@b3networks/api/invoice';
import { DestroySubscriberComponent } from '@b3networks/shared/common';
import { getYear, setYear } from 'date-fns';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'poi-invoices-action-bar',
  templateUrl: './action-bar.component.html',
  styleUrls: ['./action-bar.component.scss']
})
export class InvoicesActionBarComponent extends DestroySubscriberComponent implements OnChanges {
  readonly searchStatus: KeyValue<InvoiceStatus, string>[] = [
    { key: InvoiceStatus.sent, value: 'Waiting payment' },
    { key: InvoiceStatus.paid, value: 'Paid' }
  ];

  formGroup: UntypedFormGroup;
  isLoading: boolean;

  @Input() filterDate: Date;
  @Input() selectedStatus: InvoiceStatus | '';
  @Input() isDownloading: boolean;
  @Input() selectedInvoiceCount: number;

  @Output() downloadChange = new EventEmitter();

  constructor(
    private fb: UntypedFormBuilder,
    private invoiceService: UserInvoiceService,
    private userInvoiceQuery: UserInvoiceQuery
  ) {
    super();
    this.formGroup = this.fb.group({
      date: [''],
      filterSearch: ['']
    });
    this.userInvoiceQuery.loading$.pipe(takeUntil(this.destroySubscriber$)).subscribe(isLoading => {
      this.isLoading = isLoading;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.formGroup.controls['date'].setValue(this.filterDate);
    this.formGroup.controls['filterSearch'].setValue(this.selectedStatus);
  }

  chosenYearHandler(normalizedYear: Date) {
    let ctrlValue = this.formGroup.controls['date'].value;
    ctrlValue = setYear(ctrlValue, getYear(new Date(normalizedYear)));
    this.formGroup.controls['date'].setValue(ctrlValue);
  }

  chosenMonthHandler(normalizedMonth: Date, picker) {
    this.formGroup.controls['date'].setValue(normalizedMonth);
    this.invoiceService.updateFilterDate(normalizedMonth);
    picker.close();
  }

  onChangeStatus(event: MatSelectChange) {
    this.invoiceService.updateSlectedStatus(event.value);
  }

  downloadSelected() {
    this.downloadChange.emit();
  }

  onRefresh() {
    this.invoiceService.updateFilterDate(new Date());
  }
}
