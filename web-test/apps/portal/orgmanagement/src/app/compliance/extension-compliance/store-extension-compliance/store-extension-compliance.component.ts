import { Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  ComplianceAction,
  Extension,
  ExtensionQuery,
  ExtensionService,
  GetExtensionReq
} from '@b3networks/api/bizphone';
import { ToastService } from '@b3networks/shared/ui/toast';
import { Observable } from 'rxjs';
import { debounceTime, finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-store-extension-compliance',
  templateUrl: './store-extension-compliance.component.html',
  styleUrls: ['./store-extension-compliance.component.scss']
})
export class StoreExtensionComplianceComponent implements OnInit {
  type: 'create' | 'edit';
  extension: Extension;

  extensionCtrl = new UntypedFormControl();
  form: UntypedFormGroup;

  selectedExtensions: Extension[] = [];
  extensions$: Observable<Extension[]>;

  ctaTitle: string;
  ctaAction: string;

  progressing: boolean;

  readonly complianceActions = [ComplianceAction.BLOCK, ComplianceAction.CHECK_AND_ASK];

  @ViewChild('extensionInput') extensionInput: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) extension: Extension,
    private extensionQuery: ExtensionQuery,
    private extensionService: ExtensionService,
    private fb: UntypedFormBuilder,
    private toastrService: ToastService,
    private dialogRef: MatDialogRef<StoreExtensionComplianceComponent>
  ) {
    this.extension = extension;
    this.type = this.extension ? 'edit' : 'create';
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
      this.extensions$ = this.extensionQuery.selectAll();
      this.extensionService.getExtensions(<GetExtensionReq>{ isBypass: true }, { page: 0, perPage: 20 }).subscribe();

      this.extensionCtrl.valueChanges.pipe(debounceTime(300)).subscribe(q => {
        this.extensionService
          .getExtensions(
            <GetExtensionReq>{ isBypass: true, keyword: q, excludeExtKeys: this.selectedExtensions.map(e => e.extKey) },
            { page: 0, perPage: 20 }
          )
          .subscribe();
      });
    }
  }

  remove(extension: Extension): void {
    const index = this.selectedExtensions.findIndex(e => e.extKey === extension.extKey);
    if (index >= 0) {
      this.selectedExtensions.splice(index, 1);
    }
  }

  selected(event: MatAutocompleteSelectedEvent): void {
    this.selectedExtensions.push(event.option.value);
    this.extensionInput.nativeElement.value = '';
    this.extensionCtrl.setValue(null);
  }

  update() {
    if (this.type === 'create' && !this.selectedExtensions.length) {
      this.toastrService.warning('Please select extension to config');
      return;
    }
    const req = this.form.value;
    if (this.type === 'create') {
      req.selected = this.selectedExtensions.map(e => e.extKey);
    }

    this.progressing = true;
    this.extensionService
      .updateDNCForExtensions(req)
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

  displayFn(ext: Extension): string {
    return ext ? ext.displayText : '';
  }

  private initUI() {
    if (this.extension) {
      this.form = this.fb.group({
        selected: this.fb.array([this.extension.extKey], Validators.required),
        action: this.fb.group({
          dnc: this.fb.control(this.extension.dncAction, Validators.required),
          consent: this.fb.control(this.extension.consentAction, Validators.required)
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
