import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Extension } from '@b3networks/api/bizphone';
import { ExtensionQuery } from '@b3networks/api/callcenter';
import { DestroySubscriberComponent, EnumTransferCallerIdOption } from '@b3networks/shared/common';
import { cloneDeep } from 'lodash';
import { distinctUntilKeyChanged, filter, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-admin-tools-forwarding',
  templateUrl: './admin-tools-forwarding.component.html',
  styleUrls: ['./admin-tools-forwarding.component.scss']
})
export class AdminToolsForwardingComponent extends DestroySubscriberComponent implements OnInit {
  @Input() form: UntypedFormGroup;

  extension: Extension;

  readonly EnumTransferCallerIdOption = EnumTransferCallerIdOption;

  constructor(private extensionQuery: ExtensionQuery) {
    super();
  }

  ngOnInit(): void {
    this.extensionQuery
      .selectActive()
      .pipe(
        takeUntil(this.destroySubscriber$),
        filter(ext => !!ext && ext instanceof Extension),
        distinctUntilKeyChanged('extKey'),
        tap(ext => {
          this.extension = new Extension(cloneDeep(ext));
          this.form.controls['forwardInternal'].setValue(this.extension.transferCallerIdConfig.forwardInternal);
          this.form.controls['forwardExternal'].setValue(this.extension.transferCallerIdConfig.forwardExternal);
        })
      )
      .subscribe();
  }
}
