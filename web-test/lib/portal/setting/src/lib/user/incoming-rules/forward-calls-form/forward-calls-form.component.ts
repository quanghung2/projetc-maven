import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Extension } from '@b3networks/api/bizphone';

@Component({
  selector: 'b3n-forward-calls-form',
  templateUrl: './forward-calls-form.component.html',
  styleUrls: ['./forward-calls-form.component.scss']
})
export class ForwardCallsFormComponent implements OnInit {
  @Input() extension: Extension;

  constructor(private router: Router) {}

  ngOnInit() {}
}
