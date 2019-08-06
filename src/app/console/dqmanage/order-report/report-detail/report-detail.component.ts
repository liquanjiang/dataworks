import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import Util from '../../../../share/common/util';
import { ApiService } from '../../../../share/api.service';

@Component({
  selector: 'app-report-detail',
  templateUrl: './report-detail.component.html',
  styleUrls: ['./report-detail.component.css']
})
export class ReportDetailComponent implements OnInit {
    @Input() reportDetail;
    @Input() pk;
    @Output() closeDetail: EventEmitter<any> = new EventEmitter<any>();
    keys = Object.keys;
    constructor(private apiService: ApiService, private router: Router) { }

    ngOnInit() {
        // 初始化日期选择器
        this.initdatapicker();
    }

    closeDetaiWindow() {
        this.closeDetail.emit();
    }

    initdatapicker() {
        const startobj = {
            autoclose: true,
            format: 'yyyy-mm-dd',
            language: 'zh-CN',
            weekStart: 0,
            minView: 2,
            todayHighlight: true,
            todayBtn: true,
            keyboardNavigation: true,
            pickerPosition: 'bottom-right',
            endDate: new Date()
        };
        $('#checkDate').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            const selectedDate = Util.formatDateTime(value).substring(0, 10);
            this.apiService.getReportDetail(this.pk, selectedDate).then(data => {
                if (data.code === 200) {
                    this.reportDetail = data.data;
                } else {
                    Util.showMessage(data.msg, 'error');
                }
            });
        });
    }

    checkResPageChange(params, checkResDetail) {
        const paramsQuery = {
            pk_quality: checkResDetail.pk_quality,
            checkDate: checkResDetail.check_date,
            pageIndex: params.pageIndex,
            pageSize: params.pageSize
        };
        this.apiService.getIssuerecord(paramsQuery).then(data => {
            checkResDetail.issueRecords = data.data;
            console.log(data);
        });
    }

    turnToUpdateDetail() {
        const pks = this.reportDetail.metaChangePks;
        const date = this.reportDetail.metaChangeTimeEnd;
        this.router.navigate(['/dwb/dqmanage/changehistory'], {
                queryParams: {
                    pks: pks,
                    date: date
                }
            }
        );
    }
}
