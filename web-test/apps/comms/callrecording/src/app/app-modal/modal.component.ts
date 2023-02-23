import {
  Component,
  ComponentFactoryResolver,
  ComponentRef,
  ElementRef,
  OnChanges,
  OnDestroy,
  OnInit,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import { ModalMessage, ModalService } from '../shared';

declare let window: any;
declare let jQuery: any;

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.css']
})
export class ModalComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild('wrapper', { read: ViewContainerRef, static: true }) wrapper;

  private message: ModalMessage;
  private cmpRef: ComponentRef<any>;
  private isViewInitialized = false;
  private modal: any;

  constructor(
    private modalService: ModalService,
    private resolver: ComponentFactoryResolver,
    private elementRef: ElementRef
  ) {
    this.modalService.subscribe(m => this.load(m));
  }

  ngOnInit() {}

  ngAfterViewInit() {
    this.isViewInitialized = true;
  }

  ngOnChanges() {
    this.updateComponent();
  }

  ngOnDestroy() {
    this.destroy();
  }

  load(message: ModalMessage) {
    this.message = message;
    this.updateComponent();
  }

  updateComponent() {
    this.destroy();

    if (!this.isViewInitialized || !this.message) {
      try {
        this.cmpRef.changeDetectorRef.detectChanges();
      } catch (error) {
        console.error(error);
      }
      return null;
    }

    const factory = this.resolver.resolveComponentFactory(this.message.component);
    this.cmpRef = this.wrapper.createComponent(factory, null, this.wrapper.injector);
    if (typeof this.message.data == 'object') {
      for (const key in this.message.data) {
        if (this.message.data.hasOwnProperty(key)) {
          this.cmpRef.instance[key] = this.message.data[key];
        }
      }
    }

    try {
      this.cmpRef.changeDetectorRef.detectChanges();
    } catch (error) {
      console.error(error);
    }

    this.modal = jQuery(this.elementRef.nativeElement).find('#modal-container>.ui.modal:first').modal({
      closable: false,
      onHidden: this.destroy
    });
    this.loadEvents();
    this.open();
    return this.cmpRef;
  }

  loadEvents() {
    this.modal.on('open', event => this.open(event));
    this.modal.on('refresh', event => this.refresh(event));
    this.modal.on('close', event => this.close(event));
    this.modal.on('destroy', event => this.destroy(event));
  }

  open(event?) {
    if (this.modal) {
      this.modal.modal('show');
    }
  }

  close(event?) {
    if (this.modal) {
      this.modal.modal('hide');
    }
  }

  refresh(event?) {
    if (this.modal) {
      jQuery(window).trigger('resize');
      this.modal.modal('refresh');
    }
  }

  destroy(event?) {
    if (this.modal) {
      this.close();

      const elements = jQuery('body>.ui.modals>.ui.modal:not(.custom-modal)');
      for (const element of elements) {
        try {
          element.remove();
        } catch (e) {
          console.log(element);
        }
      }
      this.modal = undefined;
    }
    if (this.cmpRef) {
      this.cmpRef.changeDetectorRef.detach();
      this.cmpRef.destroy();
    }
  }

  static on(event) {
    jQuery('body>.ui.modals:first .ui.modal:first').trigger(event);
  }
}
