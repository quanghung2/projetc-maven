import { Component, ElementRef, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { EventStreamService } from '../service/event-stream.service';

import * as moment from 'moment';

declare var jQuery: any;

@Component({
  selector: '[sm-component], sm-component',
  template: '<ng-content></ng-content>'
})
export class SMComponent implements OnInit {
  @Output() change = new EventEmitter<any>();

  constructor(private el: ElementRef, private eventStreamService: EventStreamService) {}

  ngOnInit() {
    let self = this;
    setTimeout(() => {
      if (jQuery(self.el.nativeElement).hasClass('dropdown')) {
        jQuery(self.el.nativeElement).dropdown();
      }

      if (jQuery(self.el.nativeElement).hasClass('modal')) {
        self.eventStreamService.on('open-modal').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('modal-id')) {
            jQuery(self.el.nativeElement).modal({ detachable: false, observeChanges: true }).modal('show');
          }
        });
        self.eventStreamService.on('close-modal').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('modal-id')) {
            jQuery(self.el.nativeElement).modal('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).hasClass('sidebar')) {
        self.eventStreamService.on('open-sidebar').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('sidebar-id')) {
            jQuery(self.el.nativeElement).sidebar('show');
          }
        });
        self.eventStreamService.on('close-sidebar').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('sidebar-id')) {
            jQuery(self.el.nativeElement).sidebar('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).hasClass('accordion')) {
        jQuery(self.el.nativeElement).accordion();
      }

      /*if (jQuery(self.el.nativeElement).hasClass('checkbox')) {
        jQuery(self.el.nativeElement).checkbox();
      }*/

      if (jQuery(self.el.nativeElement).hasClass('calendar')) {
        let params: any = {};
        if (jQuery(self.el.nativeElement).attr('type')) {
          params.type = jQuery(self.el.nativeElement).attr('type');
        }
        if (jQuery(self.el.nativeElement).attr('endCalendar')) {
          params.endCalendar = jQuery('#' + jQuery(self.el.nativeElement).attr('endCalendar'));
        }
        if (jQuery(self.el.nativeElement).attr('startCalendar')) {
          params.startCalendar = jQuery('#' + jQuery(self.el.nativeElement).attr('startCalendar'));
        }
        if (jQuery(self.el.nativeElement).attr('maxDate')) {
          if (jQuery(self.el.nativeElement).attr('maxDate') === 'today') {
            params.maxDate = new Date();
          } else if (jQuery(self.el.nativeElement).attr('maxDate').indexOf('days ago') > -1) {
            let dayago = parseInt(jQuery(self.el.nativeElement).attr('maxDate').replace('days ago', ''));
            params.maxDate = moment(new Date()).subtract(dayago, 'days').toDate();
          }
        }
        if (jQuery(self.el.nativeElement).attr('minDate')) {
          if (jQuery(self.el.nativeElement).attr('minDate') === 'today') {
            params.minDate = new Date();
          } else if (jQuery(self.el.nativeElement).attr('minDate').indexOf('days ago') > -1) {
            let dayago = parseInt(jQuery(self.el.nativeElement).attr('minDate').replace('days ago', ''));
            params.minDate = moment(new Date()).subtract(dayago, 'days').toDate();
          }
        }
        if (jQuery(self.el.nativeElement).attr('formatter')) {
          if (params.type === 'time') {
            params.formatter = {
              time: (time, settings) => {
                if (!time) return '';
                return moment(time).format(jQuery(self.el.nativeElement).attr('formatter'));
              }
            };
          } else if (params.type === 'date') {
            params.formatter = {
              date: (date, settings) => {
                if (!date) return '';
                return moment(date).format(jQuery(self.el.nativeElement).attr('formatter'));
              }
            };
          }
        }
        params.onChange = (date, text, mode) => {
          this.change.emit({
            date: date,
            text: text,
            mode: mode
          });
        };
        jQuery(self.el.nativeElement).calendar(params);
      }

      if (jQuery(self.el.nativeElement).hasClass('popup')) {
        jQuery('#' + jQuery(self.el.nativeElement).attr('popup-owner-id')).popup({
          inline: false,
          hoverable: false,
          closable: true,
          position: jQuery(self.el.nativeElement).attr('popup-position'),
          delay: {
            show: 50,
            hide: 50
          },
          on: 'click',
          transition: 'slide down'
        });
        self.eventStreamService.on('open-popup').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('id')) {
            jQuery('#' + jQuery(self.el.nativeElement).attr('popup-owner-id')).popup('show');
          }
        });
        self.eventStreamService.on('close-popup').subscribe(res => {
          if (res === jQuery(self.el.nativeElement).attr('id')) {
            jQuery('#' + jQuery(self.el.nativeElement).attr('popup-owner-id')).popup('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).hasClass('tabular')) {
        jQuery(self.el.nativeElement).find('>.item').tab();
      }

      if (jQuery(self.el.nativeElement).is('[data-content]')) {
        jQuery(self.el.nativeElement).popup({
          on: jQuery(self.el.nativeElement).attr('on')
        });
      }
    });
  }
}
