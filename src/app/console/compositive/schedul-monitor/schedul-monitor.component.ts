import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import * as _ from 'lodash';
import Util from '../../../share/common/util';
import { NgYydatafinTableComponent } from 'ng-yydatafin/table';

declare var $: any;

@Component({
    selector: 'app-schedul-monitor',
    templateUrl: './schedul-monitor.component.html',
    styleUrls: ['./schedul-monitor.component.css']
})
export class SchedulMonitorComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('mainTable')
    private yyTable: NgYydatafinTableComponent;
    jobStatus = '';
    currentStatus = '<span>执行状态</span>' +
        '<span class="pull-triangle showjob" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    triggerstatus = '';
    currentTriggerstatus = '<span>调度状态</span>' +
        '<span class="pull-triangle showTrigger" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    tableColHeaders = ['作业名称', '任务信息', '最近执行时间', this.currentStatus, '下次执行时间', '调度频率', this.currentTriggerstatus, '操作'];
    tableColumns = [
        {
            data: 'name'
        },
        {
            data: 'task_names',
            columnSorting: false
        },
        {
            data: 'trigger_prev_time'
        },
        {
            columnSorting: false,
            data: 'job_status',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                const color = value === 1 ? '#5cc85c' : (value === 2 ? '#f00' : '#ff7f00');
                if (value !== null) {
                    td.innerHTML = Util.getStatusByNum(value);
                } else {
                    td.innerHTML = '';
                }

                td.style.color = color;
                return td;
            }
        },
        {
            data: 'trigger_next_time'
        },
        {
            data: 'trigger_cycle',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '' + (value === 0 ? '月' : (value === 1 ? '周' : '日')) + '';
                return td;
            }
        },
        {
            columnSorting: false,
            data: 'trigger_status',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                if (value !== null) {
                    td.innerHTML = '' + (value === 1 ? '启用' : '停用') + '';
                } else {
                    td.innerHTML = '';
                }
                td.style.color = '#333';
                return td;
            }
        },
        {
            columnSorting: false,
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_edit = document.createElement('span');
                table_edit.className = 'table-edit table-span';
                table_edit.title = '查看历史';
                table_edit.innerHTML = '<i class="icon iconfont icon-Schedulhistory"></i>';
                table_edit.addEventListener('click', () => {
                    this.showHistory(item);
                });
                td.appendChild(table_edit);
                const table_delete = document.createElement('span');
                table_delete.className = 'table-delete table-span';
                table_delete.title = '查看日志';
                table_delete.innerHTML = '<i class="icon iconfont icon-Viewlog"></i>';
                table_delete.addEventListener('click', () => {
                    this.showLogs(item);
                });
                td.appendChild(table_delete);
                return td;
            }
        }
    ];
    tableUrl = '';
    showHistoryArea = false; // 是否显示调度历史区域
    itemObj = null; // 存放要传入子组件的对象
    schedulerId = null; // 存放要传入子组件的查询参数
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

    showCircle = false; // 存放是否显示刷新按钮的旋转动画
    showJob = false; // 是否显示筛选采集状态的下拉列表
    Jobtop; // 存放显示筛选采集状态的下拉列表的top属性
    Jobleft; // 存放显示筛选采集状态的下拉列表的left属性
    JobFilterArr = [ // 筛选采集状态的数组
        {
            name: '全部',
            status: ''
        },
        {
            name: '成功',
            status: '1'
        },
        {
            name: '失败',
            status: '2'
        },
        {
            name: '执行中',
            status: '3'
        }
    ];
    showTrigger = false; // 是否显示筛选启用状态的下拉列表
    Triggertop;   // 存放显示筛选启用状态的下拉列表的top属性
    Triggerleft;  // 存放显示筛选启用状态的下拉列表的left属性
    TriggerFilterArr = [ // 筛选启用状态的数组
        {
            name: '全部',
            status: ''
        },
        {
            name: '停用',
            status: '0'
        },
        {
            name: '启用',
            status: '1'
        }
    ];
    searchParam; //

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.loadAllList();
    }

    ngAfterViewInit() {
        const that = this;
        const Table = $('#mainTablearea');
        Table.on('click', '.showjob', () => {
            const el = $('.showjob');
            const left = el.offset().left;
            const top = el.offset().top;
            that.Jobtop = top + 15 + 'px';
            that.Jobleft = left - 5 + 'px';
            that.showJob = true;
        });
        Table.on('click', '.showTrigger', () => {
            const el = $('.showTrigger');
            const left = el.offset().left;
            const top = el.offset().top;
            that.Triggertop = top + 15 + 'px';
            that.Triggerleft = left - 5 + 'px';
            that.showTrigger = true;
        });
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off().on('mousedown', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag = $(obj).isChildAndSelfOf('.showjob');
            const flag2 = $(obj).isChildAndSelfOf('.showTrigger');
            const flag3 = $(obj).isChildAndSelfOf('.pull-down-div');
            if (!flag && !flag3) {
                that.showJob = false;
            }
            if (!flag2 && !flag3) {
                that.showTrigger = false;
            }
        });
    }

    ngOnDestroy() {
        $(window).off('resize').off('click');
    }

    // 加载列表信息
    loadAllList() {
        this.tableUrl = 'dwb/di/schdmonitor/jobSchdInfo';
    }

    // 刷新列表
    refresh() {
        this.addRotateAnimation();
        this.yyTable.getData();
    }

    // 添加旋转动画
    addRotateAnimation() {
        this.showCircle = true;
        setTimeout(() => {
            this.showCircle = false;
        }, 1000);
    }

    // 搜索列表
    searchData() {
        const name = this.searchParam;
        this.tableUrl = 'dwb/di/schdmonitor/jobSchdInfo?name=' + name;
    }

    // 查看调度日志
    showLogs(item) {
        // 每次打开日志弹窗之前重置日志信息
        this.logInfoObj = _.cloneDeep(this.loginInfoObjUnit);
        this.transformLog(this.logInfoObj);
        const jobId = item.trigger_last_job_id;
        $('#showLogs').modal('show');
        this.apiservice.getSchLog(jobId).then((res) => {
            if (res.code === 200) {
                if (res.data && res.data.length > 0) {
                    const data = res.data[0];
                    this.logInfoObj.startTime = data.startTime;
                    this.logInfoObj.taskStatus = data.taskStatus;
                    this.logInfoObj.taskResultCnt = data.taskResultCnt;
                    this.transformLog(this.logInfoObj);
                }
            } else {
                Util.showMessage('获取失败', 'error');
            }

        });
    }

    // 查看调度历史
    showHistory(item) {
        const schedulerId = item.trigger_id;
        this.itemObj = item;
        this.schedulerId = schedulerId;
        this.showHistoryArea = true;
    }

    // 返回调度查询列表页
    backToList() {
        this.itemObj = null;
        this.showHistoryArea = false;
    }

    // 改变日志信息显示
    transformLog(logInfoObj) {
        const status = logInfoObj.taskStatus;
        this.logInfoStyle.color = status === 1 ? '#5cc85c' : (status === 2 ? '#f00' : '#333');
        this.logInfoStyle.text = status === 1 ? '成功' : (status === 2 ? '失败' : '');
    }

    // 根据采集状态过滤列表数据
    filterJobStatus(item) {
        this.jobStatus = item.status;
        this.showJob = false;
        this.filterTableData();
    }

    // 根据启用状态过滤列表数据
    filterTriggerStatus(item) {
        this.triggerstatus = item.status;
        this.showTrigger = false;
        this.filterTableData();
    }

    // 根据采集状态和启用状态过滤列表中的数据
    filterTableData() {
        const url = 'dwb/di/schdmonitor/jobSchdInfo?';
        const sta = this.triggerstatus;
        const jobparam = 'job_status=' + (this.jobStatus ? this.jobStatus : '');
        const triggerparam = '&trigger_status=' + (sta ? sta : '');
        this.tableUrl = url + jobparam + triggerparam;
    }

}
