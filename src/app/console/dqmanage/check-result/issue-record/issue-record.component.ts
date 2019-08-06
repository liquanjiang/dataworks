import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-issue-record',
    templateUrl: './issue-record.component.html',
    styleUrls: ['./issue-record.component.css']
})
export class IssueRecordComponent implements OnInit {
    @Input() queryObj;
    @Output() closeDetails: EventEmitter<any> = new EventEmitter<any>();
    detailsColumnColHeaders = [];
    detailsColumnColumns = [];
    TableUrl = '';
    crumbsName = '';
    showTable = false; // 存放是否展示表格

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.crumbsName = this.queryObj.ds_name;
        this.updateTableHeader();
    }

    // 查询表头的字段详情并更新表头的字段详情
    updateTableHeader() {
        const date = this.queryObj.check_date;
        const pk = this.queryObj.pk_quality;
        this.apiservice.getIdentfields(pk, date).then((res) => {
            if (res.code === 200) {
                this.detailsColumnColHeaders = this.getArr(res.data);
                const arr1 = res.data;
                const arr = [];
                const len = arr1.length;
                for (let i = 0; i < len; i++) {
                    const obj = {
                        columnSorting: false,
                        data: arr1[i]
                    };
                    arr.push(obj);
                }
                this.detailsColumnColumns = arr;
                if (arr.length === 0) {
                    this.showTable = false;
                } else {
                    this.showTable = true;
                    this.getDataDetails();
                }
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 查询表格详情
    getDataDetails() {
        const pk = this.queryObj.pk_quality;
        const date = this.queryObj.check_date;
        const url = '/dwb/dqmanage/check/issueRecord?';
        const queryurl = `pk=${pk}&date=${date}`;
        this.TableUrl = url + queryurl;
    }

    // 关闭当前详情页
    backToMetaDetails() {
        this.closeDetails.emit('close');
    }

    // 处理一致性检查
    getArr(arr) {
        const len = arr.length;
        if (len === 0) {
            return [];
        }
        const array = [];
        for (let i = 0; i < len; i++) {
            if (arr[i].startsWith('p.')) {
                const str = '(检)' + arr[i].substring(2);
                array.push(str);
            } else if (arr[i].startsWith('c.')) {
                const str = '(主)' + arr[i].substring(2);
                array.push(str);
            } else {
                array.push(arr[i]);
            }
        }
        return array;
    }

}
