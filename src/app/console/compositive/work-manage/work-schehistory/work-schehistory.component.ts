import { Component, Input, OnInit } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import * as _ from 'lodash';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-work-schehistory',
    templateUrl: './work-schehistory.component.html',
    styleUrls: ['./work-schehistory.component.css']
})
export class WorkSchehistoryComponent implements OnInit {
    @Input() itemObj;
    @Input() schedulerId;
    tableColHeaders = ['执行状态', '开始时间', '结束时间', '耗时(秒)', '操作'];
    tableColumns = [
        {
            data: 'jobStatus',
            columnSorting: false,
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                const color = value === 1 ? '#5cc85c' : (value === 2 ? '#f00' : '#ff7f00');
                td.innerHTML = Util.getStatusByNum(value);
                td.style.color = color;
                return td;
            }
        },
        {
            data: 'startTime',
            columnSorting: false
        },
        {
            data: 'endTime',
            columnSorting: false
        },
        {
            data: 'runTime',
            columnSorting: false
        },
        {
            columnSorting: false,
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_edit = document.createElement('span');
                table_edit.className = 'table-edit table-span';
                table_edit.title = '查看日志';
                table_edit.innerHTML = '<i class="icon iconfont icon-Viewlog"></i>';
                table_edit.addEventListener('click', () => {
                    this.showLogs(item);
                });
                td.appendChild(table_edit);
                return td;
            }
        }
    ];
    tableUrl = '';
    logInfoObj = { // 存放显示的日志的信息
        startTime: null,
        taskResultCnt: null,
        taskStatus: null
    };

    loginInfoObjUnit = { // 存放显示的日志的信息拷贝
        startTime: null,
        taskResultCnt: null,
        taskStatus: null
    };

    logInfoStyle = { // 存放显示的日志的转化后的状态信息
        color: '',
        text: ''
    };

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.schedulerId = this.itemObj.trigger_id;
        this.tableUrl = 'console/scheduler/loadAllJobsPerPage?schedulerId=' + this.schedulerId;
    }

    // 显示日志信息
    showLogs(item) {
        const jobId = item.jobId;
        // 每次打开日志弹窗之前重置日志信息
        this.logInfoObj = _.cloneDeep(this.loginInfoObjUnit);
        this.transformLog(this.logInfoObj);
        this.apiservice.getSchLog(jobId).then((res) => {
            if (res.code === 200) {
                if (res.data.length > 0) {
                    const data = res.data[0];
                    this.logInfoObj.startTime = data.startTime;
                    this.logInfoObj.taskStatus = data.taskStatus;
                    this.logInfoObj.taskResultCnt = data.taskResultCnt;
                    this.transformLog(this.logInfoObj);
                }
            } else {
                Util.showMessage('获取失败！', 'error');
            }

        });
        $('#showLogs').modal('show');
    }

    // 改变日志信息显示
    transformLog(logInfoObj) {
        const status = logInfoObj.taskStatus;
        this.logInfoStyle.color = status === 1 ? '#5cc85c' : (status === 2 ? '#f00' : '#333');
        this.logInfoStyle.text = status === 1 ? '成功' : (status === 2 ? '失败' : '');
    }

}
