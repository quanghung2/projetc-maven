import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { X } from '@b3networks/shared/common';
import { LoadingSpinnerSerivce } from '@b3networks/shared/ui/loading-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'b3n-purchase-number',
  templateUrl: './purchase-number.component.html',
  styleUrls: ['./purchase-number.component.scss']
})
export class PurchaseNumberComponent implements OnInit {
  src: any;

  @ViewChild('iframe') iframeEleRef: ElementRef;

  constructor(private sanitizer: DomSanitizer, private spinner: LoadingSpinnerSerivce) {}

  ngOnInit() {
    // this.spinner.showSpinner();
    const orgUuid = X.getContext()['orgUuid'];
    const sessionToken = X.getContext()['sessionToken'];

    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      `/paymentV2/#/purchase/${sessionToken}/${orgUuid}/${environment.appId}`
    );

    // $(this.iframeEleRef.nativeElement).on('load', () => {
    //   setTimeout(() => {
    //     this.spinner.hideSpinner();
    //   }, 0);
    // });
  }
}
