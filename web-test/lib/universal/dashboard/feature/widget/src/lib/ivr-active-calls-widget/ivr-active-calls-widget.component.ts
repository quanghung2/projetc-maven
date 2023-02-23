import { Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { cloneDeep } from 'lodash';
import { WidgetData } from '../model/widget.model';

export interface IvrActiveCall {
  workFlowName: string;
  workflowUuid: string;
  callCount: number;
}

@Component({
  selector: 'b3n-ivr-active-calls-widget',
  templateUrl: './ivr-active-calls-widget.component.html',
  styleUrls: ['./ivr-active-calls-widget.component.scss']
})
export class IvrActiveCallsWidgetComponent implements OnInit, OnChanges {
  @Input() data: WidgetData;
  dataSource: MatTableDataSource<IvrActiveCall>;
  displayedColumns = ['name', 'count'];
  tables: MatTableDataSource<IvrActiveCall>[] = [];

  MAX_ROW = 10;

  constructor() {}

  ngOnInit(): void {}

  ngOnChanges() {
    this.tables = [];
    this.initData();
  }

  initData() {
    const data: IvrActiveCall[] = cloneDeep(this.data.datasets[0].data);
    const mapData: IvrActiveCall[] = data.reduce<IvrActiveCall[]>((prev, curr) => {
      const call: IvrActiveCall = prev.find(d => d.workflowUuid === curr.workflowUuid);

      if (!call) {
        prev.push(curr);
      } else {
        call.callCount++;
      }

      return prev;
    }, []);

    for (let i = 0; i < mapData.length; i += this.MAX_ROW) {
      this.tables.push(new MatTableDataSource(mapData.slice(i, i + this.MAX_ROW)));
    }
  }
}
