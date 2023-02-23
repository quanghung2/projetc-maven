import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ComplianceAction, SipGateway, SipGatewayQuery, SipGatewayService } from '@b3networks/api/bizphone';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize, map } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-sip-compliance',
  templateUrl: './store-sip-compliance.component.html',
  styleUrls: ['./store-sip-compliance.component.scss']
})
export class StoreSipComplianceComponent implements OnInit {
  type: 'create' | 'edit';
  sipgw: SipGateway;

  sipCtrl = new UntypedFormControl();
  form: UntypedFormGroup;

  selectedSipgws: SipGateway[] = [];
  sipGws$: Observable<SipGateway[]>;

  ctaTitle: string;
  ctaAction: string;

  progressing: boolean;

  readonly complianceActions = [ComplianceAction.BLOCK, ComplianceAction.CHECK_AND_ASK];

  @ViewChild('sipGWInput') sipGWInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) sipgw: SipGateway,
    private sipGwQuery: SipGatewayQuery,
    private sipGwService: SipGatewayService,
    private fb: UntypedFormBuilder,
    private toastrService: ToastService,
    private dialogRef: MatDialogRef<StoreSipComplianceComponent>
  ) {
    this.sipgw = sipgw;
    this.type = this.sipgw ? 'edit' : 'create';
    if (this.type === 'create') {
      this.ctaTitle = 'Create compliance';
      this.ctaAction = 'Create';
    } else {
      this.ctaTitle = 'Update compliance';
      this.ctaAction = 'Update';
    }

    this.initUI();
  }

  ngOnInit(): void {
    if (this.type === 'create') {
      this.sipGws$ = this.sipGwQuery.sipGWsHasNotCompliance$;

      this.sipCtrl.valueChanges.pipe(debounceTime(300)).subscribe(q => {
        const selectedSips = this.selectedSipgws.map(s => s.sipUsername);
        this.sipGws$ = this.sipGwQuery
          .selectSipGWsHasNotCompliances(q)
          .pipe(map(items => items.filter(i => selectedSips.indexOf(i.sipUsername) === -1)));
      });
    }
  }

  remove(sipgw: SipGateway): void {
    const index = this.selectedSipgws.findIndex(e => e.sipUsername === sipgw.sipUsername);
    if (index >= 0) {
      this.selectedSipgws.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedSipgws.push(event.option.value);
    this.sipGWInput.nativeElement.value = '';
    this.sipCtrl.setValue(null);
  }

  update() {
    if (this.type === 'create' && !this.selectedSipgws.length) {
      this.toastrService.warning('Please select extension to config');
      return;
    }
    const req = this.form.value;
    if (this.type === 'create') {
      req.selected = this.selectedSipgws.map(e => e.sipUsername);
    }

    this.progressing = true;
    this.sipGwService
      .updateComplicances(req)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          const message = this.type === 'create' ? `Create compliance successfully` : `Update compliance successfully`;
          this.toastrService.success(message);
          this.dialogRef.close(true);
        },
        error => {
          this.toastrService.warning(error.messsage);
        }
      );
  }

  displayFn(item: SipGateway): string {
    return item ? item.sipUsername : '';
  }

  private initUI() {
    if (this.sipgw) {
      this.form = this.fb.group({
        selected: this.fb.array([this.sipgw.sipUsername], Validators.required),
        action: this.fb.group({
          dnc: this.fb.control(this.sipgw.dncAction, Validators.required),
          consent: this.fb.control(this.sipgw.consentAction, Validators.required)
        })
      });
    } else {
      this.form = this.fb.group({
        action: this.fb.group({
          dnc: this.fb.control('', Validators.required),
          consent: this.fb.control('', Validators.required)
        })
      });
    }
  }
}
