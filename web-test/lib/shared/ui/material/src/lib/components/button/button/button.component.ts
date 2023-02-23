import { ChangeDetectionStrategy, Component, Directive, OnInit, ViewEncapsulation } from '@angular/core';

@Directive({
  selector: 'button[shm-mini-fab-button]',
  host: { class: 'shm-mini-fab-button' }
})
export class ShmMiniFabButton {}

@Directive({
  selector: 'div[shm-mini-fab-title], sumMiniFabTitle',
  host: { class: 'shm-mini-fab-title' }
})
export class ShmMiniFabTitle {}

@Component({
  selector: 'shm-mini-fab',
  templateUrl: './mini-fab.component.html',
  styleUrls: ['./mini-fab.component.scss'],
  host: { class: 'shm-mini-fab' },
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ShmMiniFabComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}

@Component({
  selector: 'shm-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss']
})
export class ShmButtonComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
