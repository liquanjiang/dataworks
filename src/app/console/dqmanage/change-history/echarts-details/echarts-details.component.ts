import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-echarts-details',
    templateUrl: './echarts-details.component.html',
    styleUrls: ['./echarts-details.component.css']
})
export class EchartsDetailsComponent implements OnInit {

    @Input() queryObj;
    @Output() closeDetails: EventEmitter<any> = new EventEmitter<any>();
    detailsColumnColHeaders = ['变更元数据', '变更时间', '路径信息'];
    detailsColumnColumns = [
        {
            data: 'meta_name'
        }, {
            data: 'ts'
        }, {
            columnSorting: false,
            data: 'paths'
        }
    ];
    echartsTableUrl = '';
    crumbsName = '';

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.getDataDetails();
    }

    // 查询表格详情
    getDataDetails() {
        const period = this.queryObj.queryPeriod;
        const metaType = this.queryObj.queryName;
        const changeType = this.queryObj.queryType.substring(0, 1);
        const Date = this.queryObj.queryDate;
        const str = Util.ArraySum(Date);
        const date = Date ? str : '';
        const pks = Util.ArraySum(this.queryObj.pks);
        const months = this.queryObj.seamonths;
        const seamonths = Util.ArraySum(months);
        this.crumbsName = this.queryObj.displayName + '(' + this.queryObj.queryDate + ')';
        const url = '/dwb/dqmanage/historydetail?';
        let queryURL;
        if (period === 'day' || period === 'month') {
            queryURL = `statPeriod=${period}&metaType=${metaType}&changeType=${changeType}&date=${date}&pks=${pks}`;
        } else {
            queryURL = `statPeriod=${period}&metaType=${metaType}&changeType=${changeType}&date=${seamonths}&pks=${pks}`;
        }
        this.echartsTableUrl = url + queryURL;
    }

    // 关闭当前详情页
    backToMetaDetails() {
        this.closeDetails.emit('close');
    }
}
