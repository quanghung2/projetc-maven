import { Component, ElementRef, EventEmitter, OnInit, Output } from '@angular/core';
import { addDays, format, parseISO, subDays } from 'date-fns';
import { EventStreamService } from '../service/event-stream.service';

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
          if (res == jQuery(self.el.nativeElement).attr('modal-id')) {
            jQuery(self.el.nativeElement).modal('show');
          }
        });
        self.eventStreamService.on('close-modal').subscribe(res => {
          if (res == jQuery(self.el.nativeElement).attr('modal-id')) {
            jQuery(self.el.nativeElement).modal('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).hasClass('sidebar')) {
        self.eventStreamService.on('open-sidebar').subscribe(res => {
          if (res == jQuery(self.el.nativeElement).attr('sidebar-id')) {
            jQuery(self.el.nativeElement).sidebar('show');
          }
        });
        self.eventStreamService.on('close-sidebar').subscribe(res => {
          if (res == jQuery(self.el.nativeElement).attr('sidebar-id')) {
            jQuery(self.el.nativeElement).sidebar('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).hasClass('accordion')) {
        jQuery(self.el.nativeElement).accordion();
      }

      if (jQuery(self.el.nativeElement).hasClass('checkbox')) {
        jQuery(self.el.nativeElement).checkbox();
      }

      if (jQuery(self.el.nativeElement).hasClass('calendar')) {
        self.reloadCalendar(jQuery(self.el.nativeElement));
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
          if (res == jQuery(self.el.nativeElement).attr('id')) {
            jQuery('#' + jQuery(self.el.nativeElement).attr('popup-owner-id')).popup('show');
          }
        });
        self.eventStreamService.on('close-popup').subscribe(res => {
          if (res == jQuery(self.el.nativeElement).attr('id')) {
            jQuery('#' + jQuery(self.el.nativeElement).attr('popup-owner-id')).popup('hide');
          }
        });
      }

      if (jQuery(self.el.nativeElement).is('[data-content]')) {
        jQuery(self.el.nativeElement).popup({
          on: jQuery(self.el.nativeElement).attr('on')
        });
      }
    });
  }

  reloadCalendar(elem, isReload: boolean = false) {
    let self = this;
    let params: any = {};
    if (elem.attr('type')) {
      params.type = elem.attr('type');
    }
    if (elem.attr('endCalendar')) {
      params.endCalendar = jQuery('#' + elem.attr('endCalendar'));
    }
    if (elem.attr('startCalendar')) {
      params.startCalendar = jQuery('#' + elem.attr('startCalendar'));
    }
    if (elem.attr('maxDate')) {
      if (elem.attr('maxDate') == 'today') {
        params.maxDate = new Date();
      } else if (format(parseISO(elem.attr('maxDate')), 'yyyy-MM-dd').toLowerCase() != 'Invalid date'.toLowerCase()) {
        params.maxDate = new Date(elem.attr('maxDate'));
      }
    }
    if (elem.attr('minDate')) {
      if (elem.attr('minDate') == 'today') {
        params.minDate = new Date();
      } else if (format(parseISO(elem.attr('minDate')), 'yyyy-MM-dd').toLowerCase() != 'Invalid date'.toLowerCase()) {
        params.minDate = new Date(elem.attr('minDate'));
      }
    }
    if (elem.attr('formatDate')) {
      params.formatter = {
        date: (date, settings) => {
          return format(date, elem.attr('formatDate'));
        }
      };
    }
    if (elem.attr('range')) {
      if (params.minDate && !params.maxDate) {
        params.maxDate = addDays(
          new Date(params.minDate),
          parseInt(elem.attr('range').replace('days', '').replace('day', '').replace(' ', ''))
        );
      } else if (!params.minDate && params.maxDate) {
        params.minDate = subDays(
          new Date(params.maxDate),
          parseInt(elem.attr('range').replace('days', '').replace('day', '').replace(' ', ''))
        );
      }
    }
    params.onChange = (date, text, mode) => {
      this.change.emit({
        date: date,
        text: text,
        mode: mode
      });
      if (elem.attr('affectOther')) {
        if (elem.attr('startCalendar')) {
          self.eventStreamService.trigger('reload-sm-calendar', { id: elem.attr('startCalendar') });
        }
        if (elem.attr('endCalendar')) {
          self.eventStreamService.trigger('reload-sm-calendar', { id: elem.attr('endCalendar') });
        }
      }
    };
    elem.calendar(params);

    if (!isReload) {
      self.eventStreamService.on('reload-sm-calendar').subscribe(res => {
        if (res.id == elem.attr('id')) {
          elem.calendar('destroy');
          setTimeout(() => {
            self.reloadCalendar(elem, true);
            elem.calendar('focus');
          });
        }
      });
    }
  }
}
