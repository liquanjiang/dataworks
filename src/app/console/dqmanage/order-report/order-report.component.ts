import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import { AuthGuardService } from '../../../share/auth-guard.service';
import { NgYydatafinTableComponent } from 'ng-yydatafin/table';
import Util from '../../../share/common/util';
import * as _ from 'lodash';

@Component({
    selector: 'app-order-report',
    templateUrl: './order-report.component.html',
    styleUrls: ['./order-report.component.css']
})
export class OrderReportComponent implements OnInit, OnDestroy, AfterViewInit {
    @ViewChild('reportTable')
    private yyTable: NgYydatafinTableComponent;
    reportDetail;
    sendStatus = '';
    subscibeStatus = '';
    // 表格发送状态筛选下拉
    sendStatusList = [
        {
            name: '全部',
            value: ''
        },
        {
            name: '成功',
            value: '1'
        },
        {
            name: '失败',
            value: '2'
        }
    ];
    // 表格启用状态筛选下拉
    subscibeStatusList = [
        {
            name: '全部',
            value: ''
        },
        {
            name: '停用',
            value: '0'
        },
        {
            name: '启用',
            value: '1'
        }
    ];
    currentSendStatus = '<span>发送状态</span>' +
        '<span class="pull-triangle showSendStatus" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    currentSubscibeStatus = '<span>订阅状态</span>' +
        '<span class="pull-triangle showSubscibeStatus" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    tableColHeaders = ['报告名称', '数据源', '最近发送时间', this.currentSendStatus, '下次发送时间', this.currentSubscibeStatus, '操作'];
    tableColumns = [
        {
            data: 'report_name',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                td.innerHTML = '';
                const span = document.createElement('span');
                span.className = 'linkName';
                span.title = '查看' + value;
                span.innerHTML = value;
                span.addEventListener('click', () => {
                    this.currentReportObj = {
                        pk: item.pk,
                        report_name: item.report_name,
                        data_source: item.data_source,
                        meta_change: item.meta_change,
                        revice_mail: item.revice_mail
                    };
                    this.apiService.getReportDetail(item.pk).then(data => {
                        if (data.code === 200) {
                            this.showDetail = true;
                            this.reportDetail = data.data;
                        } else {
                            Util.showMessage(data.msg, 'error');
                        }
                    });
                });
                td.appendChild(span);
                return td;
            }
        },
        {
            data: 'data_source'
        },
        {
            data: 'recentlytime'
        },
        {
            columnSorting: false,
            data: 'status',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const color = value === 1 ? '#5cc85c' : (value === 2 ? '#f00' : '#f0ad4e');
                const name = Util.getJobStatusByNum(value);
                const table_log = document.createElement('span');
                table_log.className = 'table-info log-span';
                table_log.title = '查看报告发送日志';
                table_log.innerHTML = '' + name + '';
                table_log.style.color = color;
                table_log.addEventListener('click', () => {
                    this.BeforeshowLog(item);
                });
                td.appendChild(table_log);
                return td;
            }
        },
        {
            data: 'triggernexttime'
        },
        {
            columnSorting: false,
            data: 'triggerstatus',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                td.innerHTML = '' + (value === 0 ? '停用' : (value === 1 ? '启用' : '')) + '';
                return td;
            }
        },
        {
            columnSorting: false,
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const color = item.status === 3 ? '#aaa' : '#4c7daa';
                const table_exec = document.createElement('span');
                table_exec.className = 'table-exec table-span';
                table_exec.title = '立即发送';
                table_exec.style.color = color;
                table_exec.style.marginRight = '20px';
                table_exec.innerHTML = '<i class="icon iconfont icon-dw_run" style="color:' + color + '"></i>';
                table_exec.addEventListener('click', () => {
                    this.ConfirmExec(item);
                });
                td.appendChild(table_exec);
                const table_setting = document.createElement('span');
                table_setting.className = 'table-setting table-span';
                table_setting.title = '订阅设置';
                table_setting.style.marginRight = '20px';
                table_setting.style.color = '#4c7daa';
                table_setting.innerHTML = '<i class="icon iconfont icon-dw_settings"></i>';
                table_setting.addEventListener('click', () => {
                    this.BeforeMetaSetting(item);
                });
                td.appendChild(table_setting);
                const table_edit = document.createElement('span');
                table_edit.className = 'table-edit table-span';
                table_edit.title = '编辑';
                table_edit.style.marginRight = '20px';
                table_edit.style.color = '#4c7daa';
                table_edit.innerHTML = '<i class="icon iconfont icon-dw_edit"></i>';
                table_edit.addEventListener('click', () => {
                    this.editReportData(item);
                });
                td.appendChild(table_edit);
                const table_delete = document.createElement('span');
                table_delete.className = 'table-delete table-span';
                table_delete.title = '删除';
                table_delete.style.marginRight = '20px';
                table_delete.style.color = color;
                table_delete.innerHTML = '<i class="icon iconfont icon-dw_delete" style="color:' + color + '"></i>';
                table_delete.addEventListener('click', () => {
                    this.reportDelete(item);
                });
                td.appendChild(table_delete);
                return td;
            }
        }
    ];
    tableUrl = 'dwb/dqmanage/report/show';
    showCircle = false; // 是否展示刷新按钮旋转动画
    searchValue;
    reportObj = {
        report_name: '',
        data_source: '',
        meta_change: 0,
        revice_mail: ''
    };
    currentReportShow = false;
    currentReportObj;
    dataSourceList;
    saveError = false;
    showDetail = false;

    /*--------------新增和修改结束-------------------------*/
    PeriodArr = []; // 存放编辑配置当前选中的周期数组
    TimeInit = {   // 修改配置的时间选择器的初始化时间
        hour: '00',
        minute: '00',
        second: '00'
    };
    editScheObj = {
        addFlag: false,
        businessId: '',
        triggerName: '',
        schePeriod: '',
        selectTimes: [],
        specificTime: '',
        startTime: '',
        endTime: '',
        pause: false,
        buildCls: 'com.yonyou.dataworks.dqmanage.mail.SendMailJobBuilder',
        moduleId: 'dw'
    };
    schePeriod = null; // 时间周期选择器的input参数
    logInfoObj = {  // 存放采集状态查看的日志信息
        taskStatus: '',
        startTime: '',
        taskResultCnt: ''
    };
    logInfoStyle = { // 存放显示的日志的转化后的状态信息
        color: '',
        text: ''
    };
    NewSchetriggerName = null;  // 新增调度配置的triggerName
    NewScebusinessId = null;    // 新增调度配置的businessId
    showNewSche = false;   // 存放是否显示调度设置新建
    showEditSche = false; // 存放是否显示调度设置编辑
    buildCls = 'com.yonyou.dataworks.dqmanage.mail.SendMailJobBuilder'; // 存放调度配置的buildCls
    constructor(private apiService: ApiService, private authguard: AuthGuardService) {
    }

    ngOnInit() {
        $('#reportTable').on('click', '.showSendStatus', event => {
            const div = this.addPullDownList(event, this.sendStatusList, this.sendStatus);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.sendStatus = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });
        $('#reportTable').on('click', '.showSubscibeStatus', event => {
            const div = this.addPullDownList(event, this.subscibeStatusList, this.subscibeStatus);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.subscibeStatus = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });

        this.apiService.getReportDataSourceList().then(data => {
            if (data.code === 200) {
                const returnDsNames = data.data.map(item => {
                    return { name: item, value: item };
                });
                this.dataSourceList = returnDsNames;
            } else {
                Util.showMessage(data.msg, 'error');
            }
        });
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        $(window).off('click');
    }

    searchReport(e) {
        this.searchValue = e.target.value;
        this.tableUrl = this.getTableUrl();
    }

    addReport() {
        this.currentReportObj = _.cloneDeep(this.reportObj);
        this.currentReportShow = true;
    }

    CancelAdd() {
        this.currentReportShow = false;
    }

    reportDataAdd() {
        if (!this.currentReportObj.report_name) {
            this.saveError = true;
            return false;
        }
        if (!this.currentReportObj.data_source) {
            this.saveError = true;
            return false;
        }
        this.saveError = false;
        if (this.currentReportObj.pk) {
            this.apiService.updateReport(this.currentReportObj).then(data => {
                if (data.code === 200) {
                    Util.showMessage('修改成功', 'success');
                    this.currentReportShow = false;
                    this.yyTable.getData();
                } else {
                    Util.showMessage(data.msg, 'error');
                }
            });
        } else {
            this.apiService.saveReport(this.currentReportObj).then(data => {
                if (data.code === 200) {
                    Util.showMessage('保存成功', 'success');
                    this.currentReportShow = false;
                    this.yyTable.getData();
                } else {
                    Util.showMessage(data.msg, 'error');
                }
            });
        }

    }

    editReportData(item) {
        this.currentReportObj = _.cloneDeep(this.reportObj);
        this.currentReportObj.pk = item.pk;
        this.currentReportObj.report_name = item.report_name;
        this.currentReportObj.data_source = item.data_source;
        this.currentReportObj.meta_change = item.meta_change;
        this.currentReportObj.revice_mail = item.revice_mail;
        this.currentReportShow = true;
    }

    reportDelete(item) {
        const pk = item.pk;
        if (item.status === 3) {
            Util.showMessage('报告正在发送中，不能删除！', 'warning');
            return false;
        }
        Util.showConfirm('报告将被删除，确定要删除吗？', () => {
            this.apiService.reportDel(pk).then(data => {
                if (data.code === 200) {
                    Util.showMessage('删除成功', 'success');
                    this.yyTable.getData();
                } else {
                    Util.showMessage(data.msg, 'error');
                }
            });
        }, () => {

        });
    }

    // 刷新数据,在刷新数据之前验证登录是否已经超时
    refreshMeta(showshadow, resetPage) {
        this.authguard.checkLogin('a').then((result) => {
            if (result) {
                this.refreshTable(showshadow, resetPage);
            }
        });
    }

    // 刷新请求列表，重新请求数据
    refreshTable(showshadow, resetPage) {
        if (showshadow) {
            this.addRotateAnimation();
        }
        if (resetPage) {
            this.yyTable.pageIndex = 1;
        }
        this.yyTable.getData();
    }

    // 添加旋转动画
    addRotateAnimation() {
        this.showCircle = true;
        setTimeout(() => {
            this.showCircle = false;
        }, 1000);
    }

    getTableUrl() {
        let paramsString = '';
        if (this.sendStatus) {
            if (paramsString) {
                paramsString += '&status=' + this.sendStatus;
            } else {
                paramsString += '?status=' + this.sendStatus;
            }
        }
        if (this.subscibeStatus) {
            if (paramsString) {
                paramsString += '&trigger_status=' + this.subscibeStatus;
            } else {
                paramsString += '?trigger_status=' + this.subscibeStatus;
            }
        }
        if (this.searchValue) {
            if (paramsString) {
                paramsString += '&report_name=' + this.searchValue;
            } else {
                paramsString += '?report_name=' + this.searchValue;
            }
        }
        return 'dwb/dqmanage/report/show' + paramsString;
    }

    addPullDownList(el, list, value) {
        const div = document.createElement('div');
        const left = el.clientX;
        const top = el.clientY;
        div.style.top = top + 10 + 'px';
        div.style.left = left - 5 + 'px';
        div.className = 'pull-down-div';
        let pullDownHtml = '<ul>';
        for (let i = 0; i < list.length; i++) {
            const item = list[i];
            if (item.value === value) {
                pullDownHtml += `<li class="active" data-value="${item.value}">${item.name}</li>`;
            } else {
                pullDownHtml += `<li data-value="${item.value}">${item.name}</li>`;
            }
        }
        pullDownHtml += '</ul>';
        div.innerHTML = pullDownHtml;
        document.body.appendChild(div);
        $(window).off().on('mousedown', (e) => {
            if ($('.pull-down-div').length === 0) {
                $(window).off();
                return;
            }
            const obj = $(e.srcElement || e.target);
            if (!($(obj).closest('.pull-down-div').length > 0)) {
                document.body.removeChild(div);
            }
        });
        return div;
    }

    metaChange() {
        this.currentReportObj.meta_change = this.currentReportObj.meta_change === 0 ? 1 : 0;
    }

    // 立即执行或调度之前确定数据是否已经被删除
    // 操作之前确认数据是否已经被删除
    async ConfirmBeforeOpation(pk) {
        return await this.apiService.beforeReport(pk).then((res) => {
            if (res.code === 200) {
                if (res.data) {
                    return true;
                } else {
                    Util.showMessage(res.msg, 'error');
                    this.refreshMeta(false, false);
                    return false;
                }
            } else if (res.code === 500) {
                this.refreshMeta(false, false);
                return res.msg;
            }
        });
    }

    // 立即执行的相关接口
    // 立即执行之前的检测
    ConfirmExec(item) {
        const pk = item.pk;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (!flag) {
                Util.showMessage('该报告已经被删除!', 'error');
                return false;
            } else if (flag === true) {
                this.MetaExec(item);
            } else {
                Util.showMessage(flag, 'error');
                return false;
            }
        });
    }

    // 数据立即执行
    MetaExec(item) {
        if (item.status === 3) {
            Util.showMessage('规则正在检核中，不能再次执行！', 'warning');
            return false;
        }
        const that = this;
        const obj = {
            businessId: item.pk,
            moduleId: 'dw',
            triggerName: item.report_name,
            buildCls: 'com.yonyou.dataworks.dqmanage.mail.SendMailJobBuilder'
        };
        Util.showConfirm('确定要立即发送吗?', () => {
            if (!obj.businessId) {
                Util.showMessage('当前规则没有调度配置，请添加！', 'warning');
                return false;
            } else {
                this.apiService.newmetaExec(obj).then((res) => {
                    if (res.code === 200) {
                        Util.showMessage('正在发送,稍后可刷新查看最新状态', 'success');
                        item.status = 3;
                        /*setTimeout(() => {
                            that.refreshMeta(false, false);
                        }, 3000);*/
                    } else {
                        Util.showMessage(res.msg, 'error');
                    }
                });
            }
        }, () => {

        });
    }

    // 调度配置相关的接口
    // 调度数据设置之前的操作
    BeforeMetaSetting(item) {
        const pk = item.pk;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '规则已经被删除，请重新选择') {
                Util.showMessage('规则已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else {
                this.MetaSetting(item);
            }
        });
    }

    // 调度数据设置
    MetaSetting(item) {
        const id = item.trigger_id;
        const Obj = this.editScheObj;
        if (id) { // 如果有trigger_id，说明是修改配置
            this.apiService.getScheSet(id).then((resp) => {
                if (resp) {
                    const res = resp.msg;
                    const bean = res.strategyBean;
                    Obj.businessId = item.pk;
                    Obj.triggerName = (res.triggerName === 'undefined' || !res.triggerName) ? item.report_name : res.triggerName;
                    Obj.startTime = Util.formatDateTime(bean.startTime);
                    Obj.endTime = Util.formatDateTime(bean.endTime);
                    Obj.pause = res.triggerStatus !== 1;
                    if (bean.triggerType === 1) {
                        Obj.schePeriod = 'Hour';
                    } else if (bean.periodUnit.periodUnit) {
                        Obj.schePeriod = bean.periodUnit.periodUnit === 4 ? 'Week' : 'Month';
                    }
                    this.schePeriod = Obj.schePeriod;
                    const str = bean.cronExpr;
                    if (bean.triggerType === 1) {
                        const arrStr = this.str2Array(str);
                        this.TimeInit.second = arrStr.substring(0, 2);
                        this.TimeInit.minute = arrStr.substring(2, 4);
                        this.TimeInit.hour = arrStr.length === 5 ? '0' + arrStr.substring(4) : arrStr.substring(4);
                        const arr = [];
                        const num = parseInt(this.TimeInit.hour, 10);
                        arr.push(num);
                        Obj.selectTimes = arr;
                        Obj.specificTime = this.TimeInit.hour + ':' + this.TimeInit.minute + ':' + this.TimeInit.second;
                    } else if (bean.periodUnit.periodUnit) {
                        if (bean.periodUnit.periodUnit === 4) {
                            Obj.selectTimes = bean.daysInWeek;
                        } else if (bean.periodUnit.periodUnit === 5) {
                            Obj.selectTimes = bean.daysInMonth;
                        }
                        const times = bean.execTimeInDay;
                        Obj.specificTime = this.getTime(times.hour, times.minute, times.second);
                        const hour = times.hour.toString(),
                            minute = times.minute.toString(),
                            second = times.second.toString();
                        this.TimeInit.hour = times.hour >= 10 ? hour : '0' + hour;
                        this.TimeInit.minute = times.minute >= 10 ? minute : '0' + minute;
                        this.TimeInit.second = times.second >= 10 ? second : '0' + second;
                    }
                    this.PeriodArr = Obj.selectTimes;
                    this.showEditSche = true;
                    $('#EditSettingMetaModel').modal('show');
                } else {
                    Util.showMessage('获取配置数据失败', 'error');
                }
            });
        } else { // 如果没有有trigger_id，说明是新建配置
            this.NewSchetriggerName = item.report_name;
            this.showNewSche = true;
            this.NewScebusinessId = item.pk;
            $('#SettingMetaModel').modal('show');
        }
    }

    // 将字符串转为数组
    str2Array(str) {
        if (str) {
            return str.replace(/[^0-9]/ig, '');
        } else {
            return '';
        }
    }

    // 新增设置窗口的确认按钮
    AddnewScheObj(data) {
        const that = this;
        this.apiService.addOrEidtScheSet(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('新增配置成功', 'success');
                this.closeNewOrEdit();
                $('#SettingMetaModel').modal('hide');
                that.refreshMeta(false, false);
            } else {
                this.closeNewOrEdit();
                Util.showMessage(res.msg, 'error');
                $('#SettingMetaModel').modal('hide');
            }
        });
    }

    // 新增设置窗口的取消按钮
    CancelAddnewScheObj() {
        this.closeNewOrEdit();
        $('#SettingMetaModel').modal('hide');
    }

    // 编辑设置窗口确认按钮
    EditeditScheObj(data) {
        const that = this;
        this.apiService.addOrEidtScheSet(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('修改配置成功', 'success');
                that.closeNewOrEdit();
                $('#EditSettingMetaModel').modal('hide');
                that.refreshMeta(false, false);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 编辑设置窗口取消按钮
    CancelEditeditScheObj() {
        this.TimeInit.hour = '00';
        this.TimeInit.minute = '00';
        this.TimeInit.second = '00';
        this.closeNewOrEdit();
        $('#EditSettingMetaModel').modal('hide');
    }

    // 关闭新建和编辑设置窗口
    closeNewOrEdit() {
        this.showEditSche = false;
        this.showNewSche = false;
    }

    // 根据时分秒获取时间字符串
    getTime(a, b, c) {
        let d, e, f;
        d = a < 10 ? '0' + a.toString() : a.toString();
        e = b < 10 ? '0' + b.toString() : b.toString();
        f = c < 10 ? '0' + c.toString() : c.toString();
        return d + ':' + e + ':' + f;
    }

    /*--------------------------------显示日志信息的区域-------------------------------*/

    // 显示日志信息之前的确认
    BeforeshowLog(item) {
        const pk = item.pk;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (!flag) {
                Util.showMessage('任务已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else {
                this.showLog(item);
            }

        });
    }

    // 显示采集日志信息
    showLog(item) {
        const id = item.trigger_id;
        if (!id) {
            Util.showMessage('当前报告没有调度配置，请添加调度配置', 'warning');
            return false;
        } else if (item.status === 0 || !item.status) {
            Util.showMessage('当前报告调度配置没有执行，请执行调度配置', 'warning');
            return false;
        } else if (item.status === 3) {
            Util.showMessage('当前报告正在发送中，请等待发送完成后再查看日志', 'warning');
            return false;
        } else {
            this.apiService.getLogId(id).then((res) => {
                if (res.code === 200 && res.msg) {
                    const idt = res.msg;
                    this.apiService.getlogsById(idt).then((resp) => {
                        if (resp && resp.msg && resp.msg.length > 0) {
                            const obj = resp.msg[0];
                            this.logInfoObj.startTime = obj.startTime;
                            this.logInfoObj.taskResultCnt = obj.taskResultCnt;
                            this.logInfoObj.taskStatus = obj.taskStatus;
                            this.transformLog(this.logInfoObj);
                            $('#showLogs').modal('show');
                        } else {
                            Util.showMessage('获取日志失败' + resp, 'error');
                        }
                    });
                } else {
                    Util.showMessage('获取日志任务ID失败' + res.msg, 'error');
                }
            });
        }
    }

    // 改变日志信息显示
    transformLog(logInfoObj) {
        const status = logInfoObj.taskStatus;
        this.logInfoStyle.color = status === 1 ? '#5cc85c' : (status === 2 ? '#f00' : '#333');
        this.logInfoStyle.text = status === 1 ? '成功' : (status === 2 ? '失败' : '');
    }
}
