import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import { AuthGuardService } from '../../../share/auth-guard.service';
import Util from '../../../share/common/util';
import * as _ from 'lodash';
import { TreemodelComponent } from './treemodel/treemodel.component';
import { NgYydatafinTableComponent } from 'ng-yydatafin/table';

declare var $: any;

@Component({
    selector: 'app-meta',
    templateUrl: './meta.component.html',
    styleUrls: ['./meta.component.css']
})
export class MetaComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild(TreemodelComponent)
    private child: TreemodelComponent;
    @ViewChild('metaTable')
    private yyTable: NgYydatafinTableComponent;
    jobStatus = '';
    currentStatus = '<span>采集状态</span>' +
        '<span class="pull-triangle showjob" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    triggerstatus = '';
    currentTriggerstatus = '<span>启用状态</span>' +
        '<span class="pull-triangle showTrigger" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i>' +
        '</span>';
    tableColHeaders = ['元数据名称', '元数据类型', '数据源', '最近采集时间', this.currentStatus, '下次执行时间', this.currentTriggerstatus, '操作'];
    tableColumns = [
        {
            data: 'name',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_info = document.createElement('span');
                table_info.className = 'table-info';
                table_info.title = '查看详情';
                table_info.innerHTML = '' + item.name + '';
                table_info.addEventListener('click', () => {
                    this.BeforeshowMetaDetails(item);
                });
                td.appendChild(table_info);
                return td;
            }
        },
        {
            data: 'dstype'
        },
        {
            data: 'dsname'
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
                const table_log = document.createElement('span');
                table_log.className = 'table-info log-span';
                table_log.title = '查看采集任务日志';
                table_log.innerHTML = '' + this.getStatusByNum(value) + '';
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
                const table_log = document.createElement('span');
                table_log.className = 'table-info log-span';
                table_log.innerHTML = '' + (value === 0 ? '停用' : (value === 1 ? '启用' : '')) + '';
                table_log.style.color = '#333';
                td.appendChild(table_log);
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
                table_exec.title = '执行';
                table_exec.style.color = color;
                table_exec.innerHTML = '<i class="icon iconfont icon-dw_run"></i>';
                table_exec.addEventListener('click', () => {
                    this.ConfirmExec(item);
                });
                td.appendChild(table_exec);
                const table_setting = document.createElement('span');
                table_setting.className = 'table-setting table-span';
                table_setting.title = '调度设置';
                table_setting.style.color = '#4c7daa';
                table_setting.innerHTML = '<i class="icon iconfont icon-dw_settings"></i>';
                table_setting.addEventListener('click', () => {
                    this.BeforeMetaSetting(item);
                });
                td.appendChild(table_setting);
                const table_edit = document.createElement('span');
                table_edit.className = 'table-edit table-span';
                table_edit.title = '编辑';
                table_edit.style.color = '#4c7daa';
                table_edit.innerHTML = '<i class="icon iconfont icon-dw_edit"></i>';
                table_edit.addEventListener('click', () => {
                    this.MetaEdit(item);
                });
                td.appendChild(table_edit);
                const table_delete = document.createElement('span');
                table_delete.className = 'table-delete table-span';
                table_delete.title = '删除';
                table_delete.style.color = color;
                table_delete.innerHTML = '<i class="icon iconfont icon-dw_delete"></i>';
                table_delete.addEventListener('click', () => {
                    this.BeforeMetaDelete(item);
                });
                td.appendChild(table_delete);
                return td;
            }
        }
    ];
    tableUrl = '';
    // 存放当前分页信息
    newMeta = {  // 存放新建元数据数组
        name: null,
        mmClassify: null,
        defType: null,
        dsName: null
    };
    newMetaTypePk = null; // 存放当前新建任务的开始采集类型
    newMetaUnit = { // 存放新建元数据数组拷贝
        name: null,
        mmClassify: null,
        defType: null,
        dsName: null
    };
    editMeta = { // 存放编辑修改元数据数组
        name: null,
        mmClassify: null,
        defType: null,
        dsName: null,
        pk: null
    };
    editMetaAllowed = true; // 是否允许修改数据源
    editMetaTypePk = null; // 存放当前编辑修改任务的开始采集类型
    QuerydirPK = null; // 存放新建元数据时需要的路径编码信息,也是当前树文件对应的pkDir
    showTableDetails = false; // 存放是否显示元数据采集任务详情模块
    treeNode = null; // 存放从树组件传递来的节点信息
    deteailsInfo = { // 存放当前任务详情信息的对象
        name: '',
        ts: '',
        metatype: '',
        crumbsName: '',
        namespace: '',
        sql: '',
        dataType: '',
        nullable: null
    };
    setPeriodArr = [  // 存放元数据调度配置周期数组
        { key: '月', value: 'Month' },
        { key: '周', value: 'Week' },
        { key: '日', value: 'Hour' }
    ];
    PeriodArr = []; // 存放编辑配置当前选中的周期数组
    TimeInit = {   // 修改配置的时间选择器的初始化时间
        hour: '00',
        minute: '00',
        second: '00'
    };
    metaDsArr = []; // 存放新建或修改时需要的下拉选项数组
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
        buildCls: 'com.yonyou.dataworks.metadata.job.MetaExtractJobBuilder',
        moduleId: 'dw'
    };
    schePeriod = null; // 时间周期选择器的input参数
    WindowHeight = 0;
    logInfoObj = {  // 存放采集状态查看的日志信息
        taskStatus: '',
        startTime: '',
        taskResultCnt: ''
    };
    logInfoStyle = { // 存放显示的日志的转化后的状态信息
        color: '',
        text: ''
    };
    showNewMetaUL = false; // 显示新建任务下拉选项
    showEditMetaUL = false; // 显示修改任务下拉选项
    queryDetailspk = null; // 存放当前查询详情表、视图、存储过程的pk
    showRightarea = false; // 是否显示右侧空白区域
    showCircle = false; // 存放刷新按钮是否旋转
    warningMsg = ''; //  存放错误提示信息
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
            name: '采集中',
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
    NewSchetriggerName = null;  // 新增调度配置的triggerName
    NewScebusinessId = null;    // 新增调度配置的businessId
    showNewSche = false;   // 存放是否显示调度设置新建
    showEditSche = false; // 存放是否显示调度设置编辑
    buildCls = 'com.yonyou.dataworks.metadata.job.MetaExtractJobBuilder'; // 存放调度配置的buildCls


    constructor(private apiservice: ApiService, private authguard: AuthGuardService) {
    }

    ngOnInit() {
        // 获取新增或者修改的下拉选项
        this.getMetaDs();
        this.WindowHeight = window.innerHeight;
    }

    ngAfterViewInit() {
        const that = this;
        const Table = $('#metaTable');
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
        $(window).off('click').off('mousedown');
        $('#metaTable').off('click');
    }

    // 选中根目录
    changeRootNode($event) {
        this.showRightarea = $event === 'root';
    }

    // 在根文件夹下新增目录
    newTreeFolder() {
        this.child.newFolder();
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
        if (!this.QuerydirPK) {
            return false;
        }
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

    // ztree组件传递的dirPK改变事件
    changeQuerydirPK($event) {
        this.QuerydirPK = $event;
        this.tableUrl = 'dwb/metamanage/joblist?dirPK=' + $event;
    }

    // 添加数据
    addMeta() {
        this.newMeta.mmClassify = this.QuerydirPK;
        $('#MetaModel').modal('show');
    }

    // 新增或者修改数据的下拉选项
    getMetaDs() {
        this.apiservice.getMetaDs().then((res) => {
            if (res.code === 200) {
                this.metaDsArr = res.data;
            } else {
                Util.showMessage('获取数据失败' + res.msg, 'error');
            }
        });
    }

    // 新增弹出层取消按钮
    CancelAdd() {
        this.newMeta = _.cloneDeep(this.newMetaUnit);
        this.newMetaTypePk = null;
        $('#MetaModel').modal('hide');
    }

    // 新增弹出层确认按钮
    MetaDataAdd() {
        const meta = this.newMeta;
        if (!this.validateData(meta, false)) {
            return false;
        } else {
            this.apiservice.addOrEditJob(meta).then((res) => {
                if (res.code === 200) {
                    Util.showMessage('新建成功', 'success');
                    this.CancelAdd();
                    this.refreshMeta(false, true);
                } else {
                    Util.showMessage('新建失败' + res.msg, 'error');
                }
            });
        }
    }

    // 新增或修改采集任务的参数数据校验
    validateData(meta, bol) {
        const name = meta.name;
        const Type = meta.defType;
        const pkDs = meta.dsName;
        const canDo = function (data) {
            return data === undefined || data === '' || data === null;
        };
        if (canDo(name)) {
            Util.showMessage('名称不能为空', 'warning');
            return false;
        } else if (canDo(Type) || canDo(pkDs)) {
            Util.showMessage('请选择数据源', 'warning');
            return false;
        } else {
            return true;
        }
    }

    // 搜索数据
    searchMeta() {

    }

    // 操作之前确认数据是否已经被删除
    async ConfirmBeforeOpation(pk) {
        return await this.apiservice.BeforeOpeation(pk).then((res) => {
            if (res.code === 200) {
                if (res.msg === '可以执行下面操作') {
                    return true;
                } else {
                    Util.showMessage(res.msg, 'error');
                    this.refreshMeta(false, false);
                    return false;
                }
            } else if (res.code === 500) {
                this.warningMsg = res.msg;
                this.refreshMeta(false, false);
                return res.msg;
            }
        });
    }

    // 立即执行之前的检测
    ConfirmExec(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'taskdel' || flag === '数据源被删除，请重新填写') {
                Util.showMessage('数据源被删除!', 'error');
                return false;
            } else {
                this.MetaExec(item);
            }
        });
    }

    // 数据立即执行
    MetaExec(item) {
        if (item.status === 3) {
            Util.showMessage('任务正在采集中，不能再次执行！', 'warning');
            return false;
        }
        const that = this;
        const obj = {
            businessId: item.pkdef,
            moduleId: 'dw',
            triggerName: item.name,
            buildCls: 'com.yonyou.dataworks.metadata.job.MetaExtractJobBuilder'
        };
        Util.showConfirm('确定要立即执行吗?', () => {
            if (!obj.businessId) {
                Util.showMessage('当前任务没有调度配置，请添加！', 'warning');
                return false;
            } else {
                this.apiservice.newmetaExec(obj).then((res) => {
                    if (res.code === 200) {
                        Util.showMessage('正在执行，稍后可刷新查看最新状态', 'success');
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

    // 数据编辑
    MetaEdit(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((res) => {
            this.editMetaAllowed = item.status === 0 || !item.status;
            this.editMeta.name = item.name;
            this.editMeta.pk = item.pkdef;
            this.editMeta.mmClassify = item.mmclassify;
            this.editMeta.defType = item.dstype;
            this.editMeta.dsName = item.dsname;
            this.editMetaTypePk = item.dsname;
            $('#EditMetaModel').modal('show');
        });
    }

    // 数据编辑弹出框确认按钮
    MetaDataEidt() {
        const meta = this.editMeta;
        if (!this.validateData(meta, false)) {
            return false;
        } else {
            this.apiservice.addOrEditJob(meta).then((res) => {
                if (res.code === 200) {
                    Util.showMessage('修改成功', 'success');
                    this.CancelEidt();
                    this.refreshMeta(false, false);
                } else {
                    Util.showMessage('修改失败' + res.msg, 'error');
                }
            });
        }
    }

    // 数据编辑弹出框取消按钮
    CancelEidt() {
        $('#EditMetaModel').modal('hide');
    }

    // 显示日志信息之前的确认
    BeforeshowLog(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '任务已经被删除，请重新选择') {
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
            Util.showMessage('当前任务没有调度配置，请添加调度配置', 'warning');
            return false;
        } else if (item.status === 0 || !item.status) {
            Util.showMessage('当前任务调度配置没有执行，请执行调度配置', 'warning');
            return false;
        } else if (item.status === 3) {
            Util.showMessage('当前任务正在采集中，请等待采集完成后再查看日志', 'warning');
            return false;
        } else {
            this.apiservice.getLogId(id).then((res) => {
                if (res.code === 200 && res.msg) {
                    const idt = res.msg;
                    this.apiservice.getlogsById(idt).then((resp) => {
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


    // 删除数据之前的确认
    BeforeMetaDelete(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '任务已经被删除，请重新选择') {
                Util.showMessage('任务已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else {
                this.MetaDelete(item);
            }
        });
    }

    // 数据删除
    MetaDelete(item) {
        if (item.status === 3) {
            Util.showMessage('任务正在采集中，不能删除！', 'warning');
            return false;
        }
        const that = this;
        const data = {
            pk: item.pkdef,
            mmClassify: item.mmclassify
        };
        Util.showConfirm('采集的元数据将被删除，确定要删除吗？', function () {
            that.apiservice.deleteJob(data).then((res) => {
                if (res.code === 200) {
                    Util.showMessage('删除成功', 'success');
                    that.refreshMeta(false, false);
                } else {
                    Util.showMessage('删除失败：' + res.msg, 'error');
                }
            });
        }, function () {

        });
    }

    changeTreeNode($event) {
        this.treeNode = $event;
    }

    // 显示元数据详情之前的确认
    BeforeshowMetaDetails(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '任务已经被删除，请重新选择') {
                Util.showMessage('任务已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else {
                this.showMetaDetails(item);
            }
        });
    }

    // 显示元数据采集任务详情
    showMetaDetails(item) {
        this.deteailsInfo.crumbsName = item.name;
        this.apiservice.getDetailsBypk(item.pkdef).then((res) => {
            if (res.code === 200 && res.data && res.data.pk) {
                this.deteailsInfo.name = res.data.meta_name;
                this.deteailsInfo.metatype = res.data.meta_type;
                this.deteailsInfo.ts = res.data.ts;
                this.deteailsInfo.namespace = res.data.namespace;
                this.queryDetailspk = res.data.pk;
                this.showTableDetails = true;
            } else if (res.code === 200 && res.data && !res.data.pk) {
                this.queryDetailspk = null;
                this.deteailsInfo.name = '';
                this.deteailsInfo.metatype = '';
                this.deteailsInfo.ts = '';
                this.deteailsInfo.namespace = '';
                this.showTableDetails = true;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });

    }

    /*--------------- 元数据采集任务调度配置相关方法----------------*/

    // 调度数据设置之前的操作
    BeforeMetaSetting(item) {
        const pk = item.pkdef;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '任务已经被删除，请重新选择') {
                Util.showMessage('任务已经被删除，请重新选择', 'error');
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
            this.apiservice.getScheSet(id).then((resp) => {
                if (resp) {
                    const res = resp.msg;
                    console.log(res);
                    const bean = res.strategyBean;
                    Obj.businessId = item.pkdef;
                    Obj.triggerName = res.triggerName ? res.triggerName : item.name;
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
            this.NewSchetriggerName = item.name;
            this.showNewSche = true;
            this.NewScebusinessId = item.pkdef;
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
        this.apiservice.addOrEidtScheSet(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('新增配置成功', 'success');
                this.closeNewOrEdit();
                $('#SettingMetaModel').modal('hide');
                that.refreshMeta(false, false);
            } else {
                Util.showMessage(res.msg, 'error');
                this.closeNewOrEdit();
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
        this.apiservice.addOrEidtScheSet(data).then((res) => {
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

    // 隐藏所有弹出组件
    hiddenAll() {
        this.showNewMetaUL = false;
        this.showEditMetaUL = false;
    }

    // 切换新建
    changeNewMetaType(value, arr) {
        if (!value) {
            return null;
        }
        this.newMetaTypePk = value;
        const len = arr.length;
        let type = '';
        for (let i = 0; i < len; i++) {
            if (value === arr[i].dsName) {
                type = arr[i].dsType;
            }
        }
        this.newMeta.defType = type;
        this.newMeta.dsName = value;
        this.hiddenAll();
    }

    // 显示新建任务下拉可选项
    showMetaUL(x) {
        const that = this;
        if (x === 0) {
            this.showNewMetaUL = true;
        } else if (x === 1) {
            if (this.editMetaAllowed) {
                this.showEditMetaUL = true;
            } else {
                Util.showMessage('采集任务已经执行过，不能修改数据源', 'warning');
                return false;
            }
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#showNewMeta');
            const flag2 = $(obj).isChildAndSelfOf('.period-ul');
            const flag3 = $(obj).isChildAndSelfOf('#showEditMeta');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showNewMetaUL = false;
                that.showEditMetaUL = false;
            }
        });
    }

    // 编辑修改采集任务切换选项
    changeEidtMetaType(value, arr) {
        if (!value) {
            return null;
        }
        this.editMetaTypePk = value;
        const len = arr.length;
        let type = '';
        for (let i = 0; i < len; i++) {
            if (value === arr[i].dsName) {
                type = arr[i].dsType;
            }
        }
        this.editMeta.defType = type;
        this.editMeta.dsName = value;
        this.hiddenAll();
    }

    // 根据时分秒获取时间字符串
    getTime(a, b, c) {
        let d, e, f;
        d = a < 10 ? '0' + a.toString() : a.toString();
        e = b < 10 ? '0' + b.toString() : b.toString();
        f = c < 10 ? '0' + c.toString() : c.toString();
        return d + ':' + e + ':' + f;
    }

    // 根据数字返回状态对应的汉字
    getStatusByNum(num) {
        if (num === null || num === undefined || num === '') {
            return '';
        } else {
            switch (num.toString()) {
                case  '0':
                    return '';
                case  '1':
                    return '成功';
                case  '2':
                    return '失败';
                case  '3':
                    return '采集中';
                case  '4':
                    return '暂停';
                case  '5':
                    return '部分完成';
            }
        }
    }

    // 返回采集任务列表页
    backToQuery($event) {
        this.showTableDetails = false;
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
        const url = 'dwb/metamanage/joblist?dirPK=' + this.QuerydirPK;
        const sta = this.triggerstatus;
        const jobparam = '&status=' + (this.jobStatus ? this.jobStatus : '');
        const triggerparam = '&triggerStatus=' + (sta ? sta : '');
        this.tableUrl = url + jobparam + triggerparam;
    }
}

