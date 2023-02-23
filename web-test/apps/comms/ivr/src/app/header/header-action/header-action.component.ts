import { CdkPortal, DomPortalHost } from '@angular/cdk/portal';
import {
  AfterViewInit,
  ApplicationRef,
  Component,
  ComponentFactoryResolver,
  Injector,
  OnDestroy,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'b3n-header-action',
  templateUrl: './header-action.component.html',
  styleUrls: ['./header-action.component.scss']
})
export class HeaderActionComponent implements AfterViewInit, OnDestroy {
  @ViewChild(CdkPortal) portal;
  private host: DomPortalHost;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private applicationRef: ApplicationRef,
    private injector: Injector
  ) {}

  ngAfterViewInit(): void {
    this.host = new DomPortalHost(
      document.querySelector('#header-actions'),
      this.componentFactoryResolver,
      this.applicationRef,
      this.injector
    );

    this.host.attach(this.portal);
  }

  ngOnDestroy(): void {
    this.host.detach();
  }
}
