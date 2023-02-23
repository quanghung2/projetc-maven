import { HttpClient } from '@angular/common/http';
import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Organization, OrganizationQuery } from '@b3networks/api/auth';
import { QueueInfo, QueueService } from '@b3networks/api/callcenter';
import {
  ConfigPieV2,
  Dashboard2Card,
  Dashboard2DateTime,
  DashboardV2Service,
  DASHBOARD_2_DEFAULT_DATETIMES,
  DASHBOARD_2_QUESTION_USER_STATE_OVERVIEW_UUID,
  DASHBOARD_2_QUESTION_USER_STATE_UUID,
  QuestionV2,
  QuestionV2APIVersion,
  QuestionV2Info,
  QuestionV2SourceFilter,
  QuestionV2SourceType
} from '@b3networks/api/dashboard';
import { Period } from '@b3networks/api/data';
import { DestroySubscriberComponent, TimeRange, TimeRangeHelper, TimeRangeKey, X } from '@b3networks/shared/common';
import { WidgetData } from '@b3networks/universal/dashboard/feature/widget';
import { HashMap } from '@datorama/akita';
import { combineLatest, Subscription } from 'rxjs';
import { debounceTime, takeUntil, tap } from 'rxjs/operators';

@Component({
  selector: 'b3n-card-v2',
  templateUrl: './card-v2.component.html',
  styleUrls: ['./card-v2.component.scss']
})
export class CardV2Component extends DestroySubscriberComponent implements OnInit, OnChanges {
  @Input() card: Dashboard2Card;

  organization: Organization;
  afterInit: boolean;
  questionV2: QuestionV2;
  questionV2Info: QuestionV2Info;
  data: WidgetData;
  queueUuids = [];
  allQueues: QueueInfo[] = [];
  sub = new Subscription();
  body: any = { filter: {} };
  defaultTimeRange: TimeRange;
  dateTime: {
    startTime: string;
    endTime: string;
  };
  errorMsg: string;
  includeNonQueue: boolean;
  prevFilters: HashMap<string[] | Dashboard2DateTime | boolean> = {};

  readonly DASHBOARD_2_DEFAULT_DATETIMES = DASHBOARD_2_DEFAULT_DATETIMES;
  readonly DASHBOARD_2_QUESTION_USER_STATE_UUID = DASHBOARD_2_QUESTION_USER_STATE_UUID;

  fetchDataCallback: (data: any) => void;

  readonly QuestionV2SourceType = QuestionV2SourceType;
  readonly QuestionV2APIVersion = QuestionV2APIVersion;

  constructor(
    private orgQuery: OrganizationQuery,
    private http: HttpClient,
    private dashboardV2Service: DashboardV2Service,
    private queueService: QueueService
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
          this.defaultTimeRange = TimeRangeHelper.buildTimeRangeFromKey(
            TimeRangeKey['24h'],
            this.organization.utcOffset
          );

          if (!this.afterInit) {
            this.fetchData(this.card.questionUuid);
          }
        })
      )
      .subscribe();
  }

  ngOnChanges(change: SimpleChanges) {
    if (!this.card || !this.afterInit) {
      return;
    }

    this.prevFilters = {};
    this.errorMsg = '';
    this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
    this.sub.unsubscribe();
    this.sub = new Subscription();
    this.fetchData(this.card.questionUuid);
  }

  fetchData(questionUuid: string) {
    if (this.questionV2) {
      this.handleQuestion(this.questionV2);
    } else {
      this.dashboardV2Service
        .getQuestion(questionUuid)
        .pipe(
          tap(res => {
            this.handleQuestion(res);
          })
        )
        .subscribe();
    }
  }

  handleQuestion(question: QuestionV2) {
    this.questionV2 = new QuestionV2(question);
    this.questionV2Info = this.questionV2.question;

    if (
      [DASHBOARD_2_QUESTION_USER_STATE_UUID, DASHBOARD_2_QUESTION_USER_STATE_OVERVIEW_UUID].includes(
        this.questionV2.uuid
      ) &&
      !this.afterInit
    ) {
      this.dashboardV2Service.userStateMap$.next(this.questionV2.config as HashMap<ConfigPieV2>);
    }

    if (this.questionV2Info.queryTimeRange) {
      const dynamicTimeRange = TimeRangeHelper.buildDynamicTimeRangeFromKey(
        this.questionV2Info.queryTimeRange,
        this.organization.utcOffset
      );

      this.body = {
        ...this.body,
        startTime: dynamicTimeRange.startDate,
        endTime: dynamicTimeRange.endDate
      };
    } else {
      this.body = {
        ...this.body,
        startTime: this.defaultTimeRange.startDate,
        endTime: this.defaultTimeRange.endDate
      };
    }

    if (this.queueUuids && this.queueUuids.length) {
      this.body.filter.queueUuid = this.queueUuids;
    }

    const { type, reportCode } = this.questionV2Info.source;

    this.fetchDataCallback = (data: any) => {
      this.data = {
        datasets: [
          {
            data
          }
        ]
      };

      this.afterInit = true;
    };

    const filters = this.questionV2Info.filters ?? [];
    const url =
      this.questionV2Info.source.apiVersion === QuestionV2APIVersion.V4
        ? this.renderUrl(this.questionV2Info.source.apiVersion, type, reportCode, TimeRangeKey['24h'])
        : this.renderUrl(this.questionV2Info.source.apiVersion, type, reportCode);
    const fetchDataNoFilter = () => {
      this.http
        .post(url, this.body)
        .pipe(
          tap((data: any) => {
            this.fetchDataCallback(data);
          })
        )
        .subscribe();
    };

    if (!filters.length) {
      fetchDataNoFilter();
      return;
    }

    this.handleFilters(fetchDataNoFilter);
  }

  handleFilters(fetchDataNoFilter: () => void) {
    if (this.questionV2Info.hasFilterExtension) {
      this.dashboardV2Service.setExtensionsilterHash(this.questionV2.uuid, true);
    }

    if (
      !this.questionV2Info.hasFilterQueue &&
      !this.questionV2Info.hasFilterDateTime &&
      !this.questionV2Info.hasFilterIncludeNonQueue &&
      !this.questionV2Info.hasFilterState
    ) {
      fetchDataNoFilter();
      return;
    }

    if (this.questionV2Info.hasFilterQueue) {
      this.dashboardV2Service.setQueueFilterHash(this.questionV2.uuid, true);
    }

    if (this.questionV2Info.hasFilterDateTime) {
      this.dashboardV2Service.setDateTimeFilterHash(this.questionV2.uuid, true);
    }

    if (this.questionV2Info.hasFilterIncludeNonQueue) {
      this.dashboardV2Service.setIncludeNonQueueFilterHash(this.questionV2.uuid, true);
    }

    if (this.questionV2Info.hasFilterState) {
      this.dashboardV2Service.setStateFilterHash(this.questionV2.uuid, true);
    }

    const combineFilterObs$ = combineLatest([
      this.dashboardV2Service.queueUuids$,
      this.dashboardV2Service.dateTime$,
      this.dashboardV2Service.includeNonQueue$,
      this.dashboardV2Service.states$
    ]).pipe(
      takeUntil(this.destroySubscriber$),
      debounceTime(200),
      tap(async ([uuids, dateTime, includeNonQueue, states]) => {
        const { maxQueues } = this.questionV2Info.constraints ?? { maxQueues: 0 };

        //* Check if filter options changed
        const validRefetch = this.checkValidRefetch(
          this.questionV2Info.hasFilterQueue,
          this.questionV2Info.hasFilterDateTime,
          this.questionV2Info.hasFilterIncludeNonQueue,
          this.questionV2Info.hasFilterState,
          uuids,
          dateTime,
          includeNonQueue,
          [...states]
        );
        if (!validRefetch) {
          return;
        }

        //* Queue
        const completedQueue = await this.handleQueueFilter(
          this.questionV2Info.hasFilterQueue,
          uuids,
          maxQueues,
          this.questionV2Info.hasFilterIncludeNonQueue
        );
        if (!completedQueue) {
          return;
        }

        //* IncludeNonQueue
        const completedncludeNonQueue = this.handleIncludeNonQueueFilter(
          this.questionV2Info.hasFilterIncludeNonQueue,
          includeNonQueue
        );
        if (!completedncludeNonQueue) {
          return;
        }

        //* DateTime
        const completedDateTime = this.handleDateTimeFilter(this.questionV2Info.hasFilterDateTime, dateTime);
        if (!completedDateTime) {
          return;
        }

        //* State
        const completedState = this.handleStateFilter(this.questionV2Info.hasFilterState, states);
        if (!completedState) {
          return;
        }

        const { type, reportCode, apiVersion } = this.questionV2Info.source;
        const url =
          apiVersion === QuestionV2APIVersion.V4
            ? this.renderUrl(apiVersion, type, reportCode, dateTime?.timeRangeKey)
            : this.renderUrl(apiVersion, type, reportCode);

        await this.http
          .post(url, this.body)
          .pipe(
            tap((data: any) => {
              this.fetchDataCallback(data);
            })
          )
          .toPromise();
      })
    );

    this.sub.add(combineFilterObs$.subscribe());
  }

  async handleQueueFilter(hasFilterQueue: boolean, uuids: string[], maxQueues: number, hasIncludeNonQueue: boolean) {
    if (hasFilterQueue && !uuids) {
      return false;
    }

    if (hasFilterQueue && uuids) {
      this.queueUuids = uuids;

      if (!uuids.length && !hasIncludeNonQueue) {
        return false;
      }

      if (!this.allQueues.length) {
        this.allQueues = await this.queueService.getQueuesFromCache().toPromise();
      }

      if (maxQueues && uuids.length > maxQueues) {
        this.errorMsg = `For Best Chart View, Please Select at Max ${maxQueues} Queue(s)`;
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
        this.data = null;

        return false;
      } else {
        this.errorMsg = '';
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
      }

      if (uuids.length < this.allQueues.length) {
        this.body.filter.queueUuid = uuids;
      } else {
        delete this.body.filter.queueUuid;
      }
    }

    if (!hasFilterQueue) {
      delete this.body.filter.queueUuid;
    }

    return true;
  }

  handleStateFilter(hasFilterState: boolean, states: string[]) {
    if (hasFilterState && !states) {
      return false;
    }

    if (hasFilterState && states) {
      if (!states.length) {
        this.errorMsg = 'Please select at least 1 state';
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
        this.data = null;

        return false;
      } else {
        this.errorMsg = '';
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
      }

      this.body.filter.state = states;
    }

    if (!hasFilterState) {
      delete this.body.filter.state;
    }

    return true;
  }

  handleDateTimeFilter(hasFilterDateTime: boolean, dateTime: Dashboard2DateTime) {
    if (!hasFilterDateTime) {
      return true;
    }

    const supportedDateTimeOptions = this.questionV2Info.supportedDateTimeOptions;

    if (supportedDateTimeOptions) {
      if (supportedDateTimeOptions.includes(dateTime.timeRangeKey)) {
        this.errorMsg = '';
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
      } else {
        let availableDateTimes = '';

        DASHBOARD_2_DEFAULT_DATETIMES.forEach(d => {
          const isAvailable = supportedDateTimeOptions.some(s => {
            return s === d.key;
          });

          if (isAvailable) {
            availableDateTimes += availableDateTimes ? `, ${d.value}` : d.value;
          }
        });

        this.errorMsg = `Available Only for ${availableDateTimes}`;
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
        this.data = null;

        return false;
      }
    }

    this.dateTime = dateTime;
    this.body.startTime = dateTime.startTime;
    this.body.endTime = dateTime.endTime;

    return true;
  }

  handleIncludeNonQueueFilter(hasFilterIncludeNonQueue: boolean, includeNonQueue: boolean) {
    if (!hasFilterIncludeNonQueue) {
      return true;
    }

    this.includeNonQueue = includeNonQueue;
    const queueUuids = this.body.filter?.queueUuid as string[];

    if (this.includeNonQueue) {
      // All queues
      if (this.queueUuids?.length && this.queueUuids.length === this.allQueues.length) {
        this.body.filter = {};
        return true;
      }
      // No queue
      else if (!this.queueUuids?.length) {
        delete this.body.filter.queueUuid;
        this.body.filter[QuestionV2SourceFilter.NON_QUEUE_UUID] = [];
        return true;
      }
    } else {
      // All queues
      if (!queueUuids) {
        delete this.body.filter[QuestionV2SourceFilter.NON_QUEUE_UUID];
        this.body.filter.queueUuid = [];
        return true;
      }
      // Some queues
      else if (queueUuids.length) {
        delete this.body.filter[QuestionV2SourceFilter.NON_QUEUE_UUID];
        this.body.filter.queueUuid = this.queueUuids;
        return true;
      }
      // No queue
      else if (!queueUuids.length) {
        this.errorMsg = this.questionV2.question?.messages?.noFilter;
        this.dashboardV2Service.setQuestionErrorHash(this.questionV2.uuid, this.errorMsg);
        this.data = null;

        return false;
      }
    }

    return false;
  }

  checkValidRefetch(
    hasFilterQueue: boolean,
    hasFilterDateTime: boolean,
    hasFilterIncludeNonQueue: boolean,
    hasFilterState: boolean,
    uuids: string[],
    dateTime: Dashboard2DateTime,
    includeNonQueue: boolean,
    states: string[]
  ) {
    let isNewQueues = false;
    let isNewDateTime = false;
    let isNewIncludeNonQueue = false;
    let isNewStates = false;

    if (hasFilterQueue) {
      if (!this.prevFilters[QuestionV2SourceFilter.QUEUE_UUID]) {
        this.prevFilters[QuestionV2SourceFilter.QUEUE_UUID] = uuids;
        isNewQueues = true;
      } else {
        const prevUuids = (this.prevFilters[QuestionV2SourceFilter.QUEUE_UUID] as string[])?.sort();
        const currUuids = uuids?.sort();
        isNewQueues = JSON.stringify(prevUuids) !== JSON.stringify(currUuids);

        if (isNewQueues) {
          this.prevFilters[QuestionV2SourceFilter.QUEUE_UUID] = uuids;
        }
      }
    }

    if (hasFilterDateTime) {
      if (!this.prevFilters[QuestionV2SourceFilter.DATETIME]) {
        this.prevFilters[QuestionV2SourceFilter.DATETIME] = dateTime;
        isNewDateTime = true;
      } else {
        const prevDateTime = this.prevFilters[QuestionV2SourceFilter.DATETIME] as Dashboard2DateTime;
        isNewDateTime = JSON.stringify(prevDateTime) !== JSON.stringify(dateTime);

        if (isNewDateTime) {
          this.prevFilters[QuestionV2SourceFilter.DATETIME] = dateTime;
        }
      }
    }

    if (hasFilterIncludeNonQueue) {
      if (this.prevFilters[QuestionV2SourceFilter.INCLUDE_NON_QUEUE] === undefined) {
        this.prevFilters[QuestionV2SourceFilter.INCLUDE_NON_QUEUE] = includeNonQueue;
        isNewIncludeNonQueue = true;
      } else {
        const prevIncludeNonQueue = this.prevFilters[QuestionV2SourceFilter.INCLUDE_NON_QUEUE] as boolean;
        isNewIncludeNonQueue = prevIncludeNonQueue !== includeNonQueue;

        if (isNewIncludeNonQueue) {
          this.prevFilters[QuestionV2SourceFilter.INCLUDE_NON_QUEUE] = includeNonQueue;
        }
      }
    }

    if (hasFilterState) {
      if (!this.prevFilters[QuestionV2SourceFilter.STATE]) {
        this.prevFilters[QuestionV2SourceFilter.STATE] = states;
        isNewStates = true;
      } else {
        const prevStates = (this.prevFilters[QuestionV2SourceFilter.STATE] as string[])?.sort();
        const currStates = states?.sort();
        isNewStates = JSON.stringify(prevStates) !== JSON.stringify(currStates);

        if (isNewStates) {
          this.prevFilters[QuestionV2SourceFilter.STATE] = states;
        }
      }
    }

    return isNewQueues || isNewDateTime || isNewIncludeNonQueue || isNewStates;
  }

  renderUrl(version: string, type: string, reportCode: string, timeRange?: TimeRangeKey): string {
    if (this.questionV2.uuid === DASHBOARD_2_QUESTION_USER_STATE_UUID) {
      return `data/private/${version}/formatted/${type}/${reportCode}`;
    } else if (this.questionV2Info.source.type === QuestionV2SourceType.CURR) {
      return `data/private/v4/formatted/curr/${reportCode}`;
    }

    switch (version) {
      case QuestionV2APIVersion.V1:
        return `data/private/${version}/${type}/${reportCode}`;

      case QuestionV2APIVersion.V4:
        let period = '';

        if (timeRange == TimeRangeKey.custom_date) {
          period = Period['1d'].valueOf();
        } else {
          period =
            timeRange !== TimeRangeKey.specific_date ? TimeRangeHelper.getPeriod(timeRange) : Period['1d'].valueOf();
        }

        return `data/private/${version}/formatted/${period}/${reportCode}`;

      default:
        return '';
    }
  }
}
