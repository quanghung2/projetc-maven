import { Component, OnInit } from '@angular/core';
import { FILE_TYPE, TITLE } from '../common/constants';

@Component({
  selector: 'b3n-call-recording',
  templateUrl: './call-recording.component.html',
  styleUrls: ['./call-recording.component.scss']
})
export class CallRecordingComponent implements OnInit {
  title = TITLE.recordings;
  type = FILE_TYPE.recordings;

  constructor() {}

  ngOnInit(): void {}
}
