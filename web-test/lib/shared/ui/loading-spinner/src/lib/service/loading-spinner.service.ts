import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { map, scan } from 'rxjs/operators';
import { SpinnerComponent } from '../spinner/spinner.component';

@Injectable({
  providedIn: 'root'
})
export class LoadingSpinnerSerivce {
  spinnerComponent = new ComponentPortal(SpinnerComponent);
  private spinnerTopRef: OverlayRef;
  private spin$: Subject<boolean> = new Subject();

  constructor(private overlay: Overlay) {
    this.spinnerTopRef = this.cdkSpinnerCreate();
    this.spin$
      .asObservable()
      .pipe(
        map(val => (val ? 1 : -1)),
        scan((acc, one) => (acc + one >= 0 ? acc + one : 0), 0)
      )
      .subscribe(res => {
        if (res === 1) {
          setTimeout(() => {
            if (!this.spinnerTopRef.hasAttached() && !document.hidden) {
              this.spinnerTopRef.attach(this.spinnerComponent);
            }
          }, 0);
        } else if (res === 0) {
          setTimeout(() => {
            this.spinnerTopRef.detach();
          }, 0);
        }
      });
  }

  showSpinner() {
    this.spin$.next(true);
  }

  hideSpinner() {
    this.spin$.next(false);
  }

  private cdkSpinnerCreate() {
    return this.overlay.create({
      hasBackdrop: true,
      positionStrategy: this.overlay.position().global().centerHorizontally().centerVertically()
    });
  }
}
