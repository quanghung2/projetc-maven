import { CdkPortal, DomPortalOutlet } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  Injector,
  Input,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'sui-template-portal',
  templateUrl: './template-portal.component.html',
  styleUrls: ['./template-portal.component.scss']
})
export class TemplatePortalComponent implements AfterViewInit, OnDestroy {
  @Input() portalHostId = '';

  @ViewChild(CdkPortal) portal?: CdkPortal;
  private host?: DomPortalOutlet;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private applicationRef: ApplicationRef,
    private injector: Injector
  ) {}

  ngAfterViewInit(): void {
    setTimeout(() => {
      const value = document.querySelector(`#${this.portalHostId}`);
      if (value) {
        this.host = new DomPortalOutlet(value, this.componentFactoryResolver, this.applicationRef, this.injector);
        this.host.attach(this.portal);
      }
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.host) {
      this.host.detach();
    }
  }
}
