import { KeyValue } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { ComplianceAction, CrConfig, SpeechEntry, Text2Speech, Text2SpeechEntry } from '@b3networks/api/bizphone';
import { IsdnNumber, IsdnNumberService } from '@b3networks/api/sim';
import { FindSubscriptionReq, SubscriptionService } from '@b3networks/api/subscription';
import { ISDN_PRODUCT } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'b3n-compliance-detail',
  templateUrl: './compliance-detail.component.html',
  styleUrls: ['./compliance-detail.component.scss']
})
export class ComplianceDetailComponent implements OnInit, OnChanges {
  @Input() number: IsdnNumber;
  @Input() allowEdit: { dnc: boolean; cr: boolean };

  @Output() updated = new EventEmitter();
  @Output() closeRightSidenav = new EventEmitter();

  compliantPanelState: boolean;
  crPanelState: boolean;

  compliantFG: UntypedFormGroup;
  crConfigFG: UntypedFormGroup;
  statusFC: UntypedFormControl;

  incomingTtsEntry: Text2SpeechEntry;
  outgoingTtsEntry: Text2SpeechEntry;

  updatedIncomingTtsEntry: Text2SpeechEntry;
  updatedOutgoingTtsEntry: Text2SpeechEntry;

  canConfigCompliant: boolean;
  canConfigCr: boolean;
  matExpansionPanelContent;
  progressing: boolean;

  readonly complianceActions: KeyValue<ComplianceAction, string>[] = [
    { key: ComplianceAction.BLOCK, value: 'BLOCK' },
    { key: ComplianceAction.BYPASS, value: 'BYPASS' },
    { key: ComplianceAction.CHECK_AND_ASK, value: 'CHECK AND ASK' }
  ];

  constructor(
    private fb: UntypedFormBuilder,
    private subscriptionService: SubscriptionService,
    private numberService: IsdnNumberService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['number']) {
      this.subscriptionService
        .findSubscriptions(
          new FindSubscriptionReq({
            embed: ['features'],
            uuid: this.number.subscriptionUuid
          }),
          { page: 1, perPage: 1 },
          { usingPaginationPlugin: true }
        )
        .subscribe(page => {
          if (page && page.data && page.data.length) {
            const featureCodes = [];
            page.data[0].items.forEach(i => i.features.forEach(f => featureCodes.push(f.featureCode)));

            this.canConfigCompliant =
              featureCodes.indexOf(ISDN_PRODUCT.mobileDncCode) > -1 ||
              featureCodes.indexOf(ISDN_PRODUCT.mobileEnterpriseDnc) > -1;

            this.canConfigCr =
              featureCodes.indexOf(ISDN_PRODUCT.mobileCrCode) > -1 ||
              featureCodes.indexOf(ISDN_PRODUCT.mobileEnterpriseCr) > -1;
          }

          console.log(this.canConfigCr);

          if (this.canConfigCr) {
            const incomingTtsEntries = this.number.crConfig
              ? Object.assign([], this.number.crConfig.incomingTts.entries)
              : [];
            const outgoingTtsEntries = this.number.crConfig
              ? Object.assign([], this.number.crConfig.outgoingTts.entries)
              : [];
            this.incomingTtsEntry = incomingTtsEntries.length ? incomingTtsEntries[0] : new SpeechEntry();
            this.outgoingTtsEntry = outgoingTtsEntries.length ? outgoingTtsEntries[0] : new SpeechEntry();
          }
        });
      this.initForm();
    }
  }

  closeSidenav() {
    this.closeRightSidenav.emit(true);
  }

  incomingTtsChanged(tts: Text2SpeechEntry) {
    this.updatedIncomingTtsEntry = tts;
  }

  outgoingTtsChanged(tts: Text2SpeechEntry) {
    this.updatedOutgoingTtsEntry = tts;
  }

  updateCompliant() {
    this.progressing = true;
    const value = this.compliantFG.value as IsdnNumber;

    this.numberService
      .update(this.number.number, value)
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.updated.emit(true);
          this.toastService.success(`Updated succesfully`);
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  updateCrConfig() {
    this.progressing = true;
    const value = this.crConfigFG.value as CrConfig;

    if (this.updatedIncomingTtsEntry) {
      value.incomingTts = new Text2Speech({ entries: [this.updatedIncomingTtsEntry] });
    }
    if (this.updatedOutgoingTtsEntry) {
      value.outgoingTts = new Text2Speech({ entries: [this.updatedOutgoingTtsEntry] });
    }
    this.numberService
      .update(this.number.number, <IsdnNumber>{ crConfig: value })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.updated.emit(true);
          this.toastService.success(`Updated succesfully`);
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  updateStatusConfig() {
    this.numberService
      .update(this.number.number, { isAllowedToConfig: this.statusFC.value })
      .pipe(finalize(() => (this.progressing = false)))
      .subscribe(
        _ => {
          this.updated.emit(true);
          this.toastService.success(`Updated succesfully`);
        },
        error => {
          this.toastService.warning(error.message);
        }
      );
  }

  private initForm() {
    if (this.number.crConfig) {
      this.crConfigFG = this.fb.group({
        isEnableIncoming: this.fb.control(this.number.crConfig.isEnableIncoming),
        isEnableOutgoing: this.fb.control(this.number.crConfig.isEnableOutgoing)
      });
    }

    this.compliantFG = this.fb.group({
      dncAction: this.fb.control(this.number.dncAction),
      consentAction: this.fb.control(this.number.consentAction)
    });

    const isAllow = !!this.number?.isAllowedToConfig || this.number?.isAllowedToConfig == null;
    this.statusFC = this.fb.control(isAllow);
  }
}
