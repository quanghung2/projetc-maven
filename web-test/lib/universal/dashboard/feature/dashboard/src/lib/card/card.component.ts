import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from '@angular/core';
import { Organization, OrganizationQuery } from '@b3networks/api/auth';
import {
  Card,
  FilterData,
  FilterDataType,
  Operator,
  Question,
  QuestionRequest,
  QuestionService,
  QuestionType,
  RequestDataSource,
  V4Request
} from '@b3networks/api/dashboard';
import { Period, ReportV4Resp } from '@b3networks/api/data';
import { DestroySubscriberComponent, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { ToastService } from '@b3networks/shared/ui/toast';
import { WidgetData, WidgetDataset } from '@b3networks/universal/dashboard/feature/widget';
import { forkJoin, Observable, of } from 'rxjs';
import { filter, finalize, map, mergeMap, switchMap, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
})
export class CardComponent extends DestroySubscriberComponent implements OnInit, OnChanges {
  question: Question;
  data: WidgetData;
  progressing: boolean;
  organization: Organization;

  readonly QuestionType = QuestionType;

  @Input() card: Card;
  @Input() filter = <FilterData>{};
  @Input() editable: boolean;

  @Output() removed = new EventEmitter();
  @Output() loaded = new EventEmitter<boolean>();

  constructor(
    private orgQuery: OrganizationQuery,
    private questionService: QuestionService,
    private http: HttpClient,
    private toastr: ToastService
  ) {
    super();
  }

  ngOnInit() {
    this.orgQuery
      .selectOrganization(X.orgUuid)
      .pipe(
        takeUntil(this.destroySubscriber$),
        tap(org => {
          this.organization = new Organization(org);
        })
      )
      .subscribe();
  }

  ngOnChanges() {
    if (!this.card) {
      return;
    }

    setTimeout(() => {
      this.fetchData();
    });
  }

  remove() {
    this.removed.emit();
  }

  private fetchData() {
    this.progressing = true;
    const filterParams = { ...this.filter };
    delete filterParams['addon'];

    of(this.question)
      .pipe(switchMap(question => (question ? of(this.question) : this.questionService.getOne(this.card.questionUuid))))
      .pipe(
        mergeMap((question: Question) => {
          this.question = question;
          const chartDatas = question.question.newchartDatas ?? question.question.chartDatas;
          const requests = chartDatas.map(chartData => {
            let stream: Observable<any>;
            if (chartData.v4) {
              if (!filterParams.startTime || !filterParams.endTime) {
                return of();
              }
              const _request = chartData.request as V4Request;
              let params = _request.params || {};

              if (this.question.type === QuestionType.necIvrActiveCalls) {
                const timeRange = TimeRangeHelper.buildTimeRangeFromKey(
                  TimeRangeKey['5m'],
                  this.organization.utcOffset
                );
                params = { ...params, ...{ startTime: timeRange.startDate, endTime: timeRange.endDate } };
              } else if (['liveCalls', 'queueLiveCalls'].includes(chartData.id)) {
                const timeRange = TimeRangeHelper.buildTimeRangeFromKey(
                  TimeRangeKey['15m'],
                  this.organization.utcOffset
                );
                params = { ...params, ...{ startTime: timeRange.startDate, endTime: timeRange.endDate } };
              } else if (
                ['agentPerformance', 'agentBusyBreakdown', 'agentLogin', 'queuePerformance'].includes(chartData.id)
              ) {
                const timeRange = TimeRangeHelper.buildTimeRangeFromKey(
                  TimeRangeKey['24h'],
                  this.organization.utcOffset
                );
                params = { ...params, ...{ startTime: timeRange.startDate, endTime: timeRange.endDate } };
              } else {
                params = { ...params, ...{ startTime: filterParams.startTime, endTime: filterParams.endTime } };
              }

              let period: string = Period.dump.valueOf();
              if (_request.type === 'agg' && (_request.period === '*' || !_request.period)) {
                if (filterParams.timeRangeKey !== TimeRangeKey.specific_date) {
                  period = TimeRangeHelper.getPeriod(filterParams.timeRangeKey);
                } else {
                  // for now. specific only support one day
                  period = Period['1d'].valueOf();
                }
              } else if (_request.type === 'curr' && (_request.period === '*' || !_request.period)) {
                period = Period['curr'].valueOf();
                params = _request.params || {};

                if (chartData.id === 'agentStatus') {
                  params = {
                    ...params,
                    filter: {
                      queueUuids: this.filter.addon[FilterDataType.byQueue]
                    }
                  };
                }
              } else if (!!_request.period && _request.period !== '*') {
                period = _request.period;
              }

              // wallboard filtering from backend
              const reportType = _request.reportType || 'unformatted';
              stream = this.http
                .request<ReportV4Resp<any>>(
                  _request.method,
                  `data/private/v4/${reportType}/${period}/${_request.code}`,
                  {
                    body: ['get', 'delete'].indexOf(_request.code) === -1 ? params : null,
                    params: ['get', 'delete'].indexOf(_request.code) > -1 ? params : null
                  }
                )
                .pipe(map(res => res.rows));

              // ms-data filter from client side
              if (this.filter.addon) {
                Object.keys(this.filter.addon).forEach(key => {
                  switch (key) {
                    case FilterDataType.byQueue:
                      const value = this.filter.addon[key];
                      if (value && value instanceof Array && value.length > 0) {
                        stream = stream.pipe(
                          map(list => {
                            return list.filter(item => !item['queueUuid'] || value.includes(item['queueUuid'])); // some report has no queueUuid info
                          })
                        );
                      }
                      break;
                  }
                });
              }
            } else {
              const _request = chartData.request as QuestionRequest;

              let params = _request.params || {};
              params = { ...params, ...filterParams };
              // wallboard filtering from backend
              if (_request.source === RequestDataSource.wallboard && this.filter.addon) {
                Object.keys(this.filter.addon).forEach(key => {
                  switch (key) {
                    case FilterDataType.byQueue:
                      const value = this.filter.addon[key];
                      if (value && value instanceof Array && value.length > 0) {
                        params['queues'] = value.join(',');
                      }
                      break;
                  }
                });
              }
              stream = this.http.request<any[]>(_request.method, _request.path, {
                params: params
              });
              if (_request.liveFilters && _request.liveFilters.length > 0) {
                _request.liveFilters.forEach(fil => {
                  stream = stream.pipe(
                    // tap(list => console.log(list)),
                    map(list => {
                      return list.filter(item => {
                        let result =
                          fil.op === Operator.equals
                            ? item[fil.field] === fil.value
                            : fil.op === Operator.in
                            ? fil.value.includes(item[fil.field])
                            : item[fil.field] !== fil.value;
                        if (fil.or) {
                          const p = fil.or;
                          result =
                            result ||
                            (p.op === Operator.equals
                              ? item[p.field] === p.value
                              : p.op === Operator.in
                              ? p.value.includes(item[p.field])
                              : item[p.field] !== p.value);
                        }
                        return result;
                      });
                    })
                    // tap(list => console.log(list))
                  );
                });
              }
              // ms-data filter from client side
              if (_request.source === RequestDataSource.msData && this.filter.addon) {
                Object.keys(this.filter.addon).forEach(key => {
                  switch (key) {
                    case FilterDataType.byQueue:
                      const value = this.filter.addon[key];
                      if (value && value instanceof Array && value.length > 0) {
                        stream = stream.pipe(
                          map(list => {
                            return list.filter(item => value.indexOf(item['@@queueUuid']) > -1);
                          })
                        );
                      }
                      break;
                  }
                });
              }
            }

            return stream.pipe(
              map(result => {
                return <WidgetDataset>{
                  id: chartData.id,
                  data: result,
                  chartType: chartData.chartType,
                  chartConfig: chartData.chartConfig
                };
              })
            );
          });
          return forkJoin(requests).pipe(
            filter(result => result != null),
            map(data => {
              return <WidgetData>{
                datasets: data
              };
            })
          );
        }),
        finalize(() => {
          this.progressing = false;
          this.loaded.emit(true);
        })
      )
      .subscribe(
        data => {
          this.data = data;
          this.progressing = false;
        },
        error => {
          this.toastr.warning(error?.message);
        }
      );
  }
}
