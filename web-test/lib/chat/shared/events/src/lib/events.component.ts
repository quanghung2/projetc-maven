import { Component, OnInit } from '@angular/core';
import { BookingEvent, EventBookingQuery } from '@b3networks/api/booking';
import { format } from 'date-fns';
import { finalize, map } from 'rxjs/operators';

export class EventGroup {
  public date: number;
  public events: BookingEvent[] = [];

  constructor(date: number) {
    this.date = date || new Date().getTime();
  }

  addEvent(e: BookingEvent) {
    this.events.push(e);
  }
}

@Component({
  selector: 'b3n-scheduled-events',
  templateUrl: './events.component.html',
  styleUrls: ['./events.component.scss']
})
export class EventsComponent implements OnInit {
  events: EventGroup[] = [];
  countEvent = 0;
  isLoading: boolean;
  constructor(private eventBookingQuery: EventBookingQuery) {}

  ngOnInit(): void {
    this.isLoading = true;
    this.eventBookingQuery
      .selectAll()
      .pipe(
        map(event => {
          this.countEvent = event?.length || 0;
          const groupMap = new Map<string, EventGroup>();
          event.forEach(e => {
            let key = format(e.startTime, 'yyyy-MM-dd');
            if (new Date(e.startTime).getDay() === new Date().getDay()) {
              key = 'Today';
            }
            let g = groupMap.get(key);
            if (!g) {
              g = new EventGroup(e.startTime);
              groupMap.set(key, g);
            }

            g.addEvent(e);
          });
          return Array.from(groupMap.values());
        }),
        finalize(() => (this.isLoading = false))
      )
      .subscribe(events => {
        this.events = events;
      });
  }
}
