import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { ApiService } from '../../../share/api.service';
import * as _ from 'lodash';
import Util from '../../../share/common/util';
import { NgYydatafinTableComponent } from 'ng-yydatafin/table';
import { AuthGuardService } from '../../../share/auth-guard.service';

declare var $: any;

@Component({
    selector: 'app-check-def',
    templateUrl: './check-def.component.html',
    styleUrls: ['./check-def.component.css']
})
export class CheckDefComponent implements OnInit, OnDestroy, AfterViewInit {
    /*-------------------------表格配置---------------*/
    @ViewChild('checkTable')
    private yyTable: NgYydatafinTableComponent;
    // 表格规则选中内容
    ruleType = '';
    // 表格系统名称
    dsName = '';
    status: any = '';
    triggerStatus: any = '';
    searchValue = '';
    // 规则列表
    ruleListOrigin = [
        {
            name: '完整性/唯一检查',
            value: 'UniqueIntegrityCheck'
        },
        {
            name: '完整性/非空检查',
            value: 'UniqueNotNullCheck'
        },
        {
            name: '完整性/外键检查',
            value: 'UniqueForeignCheck'
        },
        {
            name: '正确性/长度检查',
            value: 'CorrectLengthCheck'
        },
        {
            name: '正确性/代码检查',
            value: 'CorrectCodeCheck'
        },
        {
            name: '一致性检查',
            value: 'ConsistencyCheck'
        },
        {
            name: '自定义检查',
            value: 'CustomCheck'
        }
    ];
    kuduList =     [
        {
            name: '完整性/非空检查',
            value: 'UniqueNotNullCheck'
        },
        {
            name: '正确性/长度检查',
            value: 'CorrectLengthCheck'
        },
        {
            name: '正确性/代码检查',
            value: 'CorrectCodeCheck'
        },
        {
            name: '一致性检查',
            value: 'ConsistencyCheck'
        }
    ];
    ruleList = this.ruleListOrigin;
    // 表格规则筛选下拉
    ruleTypes = [
        {
            name: '全部',
            value: ''
        },
        ...this.ruleListOrigin
    ];
    // 表格系统名称筛选下拉
    dsNames = [
        {
            name: '全部',
            value: ''
        }
    ];
    // 表格调度状态筛选下拉
    statusList = [
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
        },
        {
            name: '执行中',
            value: '3'
        }
    ];
    // 表格调度状态筛选下拉
    triggerstatusList = [
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
    currentRuletype = '<span>规则类型</span>' +
        '<span class="pull-triangle showRuleType" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    currentDsname = '<span>检核系统</span>' +
        '<span class="pull-triangle showDsName" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    currenStatus = '<span>检核状态</span>' +
        '<span class="pull-triangle showStatus" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    currenTriggerstatus = '<span>调度状态</span>' +
        '<span class="pull-triangle showTriggerstatus" title="筛选">' +
        '<i class="icon iconfont icon-APP_filter"></i></span>';
    tableColHeaders = ['规则名称', this.currentRuletype, this.currentDsname,
        '检核表名', '检核字段', '最近检核时间', this.currenStatus, '下次执行时间', this.currenTriggerstatus, '操作'];
    tableColumns = [
        {
            data: 'rulename'
        },
        {
            columnSorting: false,
            data: 'ruletype',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const ruleType = this.ruleListOrigin.filter(item => {
                    return item.value === value;
                });
                if (ruleType.length > 0) {
                    td.innerHTML = ruleType[0].name;
                }
            }
        },
        {
            columnSorting: false,
            data: 'dsname'
        },
        {
            data: 'tablename'
        },
        {
            data: 'columnname'
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
                table_log.title = '查看检核状态日志';
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
                table_exec.title = '执行';
                table_exec.style.color = color;
                table_exec.style.marginRight = '20px';
                table_exec.innerHTML = '<i class="icon iconfont icon-dw_run" style="color:' + color + '"></i>';
                table_exec.addEventListener('click', () => {
                    this.ConfirmExec(item);
                });
                td.appendChild(table_exec);
                const table_setting = document.createElement('span');
                table_setting.className = 'table-setting table-span';
                table_setting.title = '调度设置';
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
                    this.editCheckData(item.pkquality);
                });
                td.appendChild(table_edit);
                const table_delete = document.createElement('span');
                table_delete.className = 'table-delete table-span';
                table_delete.title = '删除';
                table_delete.style.marginRight = '20px';
                table_delete.style.color = color;
                table_delete.innerHTML = '<i class="icon iconfont icon-dw_delete" style="color:' + color + '"></i>';
                table_delete.addEventListener('click', () => {
                    this.BeforeCheckDelete(item);
                });
                td.appendChild(table_delete);
                return td;
            }
        }
    ];
    QuerydirPK;
    tableUrl = '';
    /*-------------------------表格配置结束---------------*/
    /*--------------新增和修改----------------------------*/
    // 用于加载和销毁组件
    currentCheckShow = false;
    // 加载图标
    checkLoading = false;
    // 规则定义初始对象，用于新建
    checkObj: any = {
        pkQuality: '',
        ruleName: '',
        ruleType: '',
        dsName: '',
        tableName: '',
        columnName: '',
        jsonColumn: '',
        ruleNote: '',
        whereSql: '',
        unionTable: '',
        unionColumn: '',
        unionJson: '',
        unionWhere: ''
    };
    // 规则定义当前对象，用于修改和保存
    currentCheckObj;
    // 弹窗内系统列表，二次获取
    dsNameLazy = true; // 异步加载
    dsNameList = [];
    dsNameType: any = {};
    // 表名列表
    tableList = [];
    tableLazy = true;
    // 字段列表
    columnList = [];
    columnLazy = true;
    // 表名列表
    unionTableList = [];
    unionTableLazy = true;
    // 主表字段列表
    unionColumnList = [];
    unionColumnLazy = true;
    // 长度关系列表
    lengthRelationList = [
        {
            name: '小于',
            value: '<'
        },
        {
            name: '大于',
            value: '>'
        },
        {
            name: '等于',
            value: '='
        }
    ];
    saveError = false;
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
        buildCls: 'com.yonyou.dataworks.dqmanage.job.DqManageJobBuilder',
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
    showCircle = false; // 是否展示刷新按钮旋转动画
    NewSchetriggerName = null;  // 新增调度配置的triggerName
    NewScebusinessId = null;    // 新增调度配置的businessId
    showNewSche = false;   // 存放是否显示调度设置新建
    showEditSche = false; // 存放是否显示调度设置编辑
    buildCls = 'com.yonyou.dataworks.dqmanage.job.DqManageJobBuilder';  // 存放调度配置的buildCls

    constructor(private apiService: ApiService, private authguard: AuthGuardService) {
    }

    ngOnInit() {
        $('#check-def').on('click', '.showRuleType', event => {
            const div = this.addPullDownList(event, this.ruleTypes, this.ruleType);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.ruleType = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });
        $('#check-def').on('click', '.showDsName', event => {
            const div = this.addPullDownList(event, this.dsNames, this.dsName);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.dsName = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });
        $('#check-def').on('click', '.showStatus', event => {
            const div = this.addPullDownList(event, this.statusList, this.status);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.status = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });
        $('#check-def').on('click', '.showTriggerstatus', event => {
            const div = this.addPullDownList(event, this.triggerstatusList, this.triggerStatus);
            $('.pull-down-div li ').on('click', (e) => {
                e.stopPropagation();
                this.triggerStatus = e.target.getAttribute('data-value');
                document.body.removeChild(div);
                this.tableUrl = this.getTableUrl();
            });
        });
        this.apiService.getDsNames().then(data => {
            if (data.code === 200) {
                const returnDsNames = data.msg.map(item => {
                    return { name: item.dsName, value: item.dsName };
                });
                this.dsNames = this.dsNames.concat(returnDsNames);
            } else {
                Util.showMessage(data.msg, 'error');
            }
        });
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy() {
        $('#checkModel').modal('hide');
    }


    // ztree组件传递的dirPK改变事件
    changeQuerydirPK($event) {
        this.QuerydirPK = $event;
        this.tableUrl = 'dwb/dqmanage/dqlist?pkDir=' + $event;
        // 表格规则选中内容
        this.ruleType = '';
        // 表格系统名称
        this.dsName = '';
        this.status = '';
        this.triggerStatus = '';
        this.searchValue = '';
    }

    // 搜索
    searchCheck(e) {
        this.searchValue = e.target.value;
        this.tableUrl = this.getTableUrl();
    }

    // 打开新增弹窗
    addCheck() {
        this.currentCheckObj = _.cloneDeep(this.checkObj);
        this.saveError = false;
        this.currentCheckShow = true;
        this.tableList = [];
        this.columnList = [];
        this.unionTableList = [];
        this.unionColumnList = [];
        // this.getDsNameList();
        // 初始化重新获取
        this.dsNameList = [];
        this.dsNameLazy = true;
    }

    // 取消新增或修改
    CancelAdd() {
        this.currentCheckShow = false;
    }

    // 保存规则数据
    checkDataAdd() {
        const saveObject: any = this.getSaveObject();
        if (!saveObject) {
            this.saveError = true;
            return;
        }
        saveObject.pkDir = this.QuerydirPK;
        this.saveError = false;
        this.apiService.dqsave(saveObject).then(data => {
            if (data.code === 200) {
                Util.showMessage(data.msg, 'success');
                this.currentCheckShow = false;
                this.yyTable.getData();
            } else {
                Util.showMessage(data.msg, 'error');
            }
        });
    }

    // 删除数据之前的确认
    BeforeCheckDelete(item) {
        if (item.status === 3) {
            Util.showMessage('正在执行中，不能删除！', 'warning');
            return false;
        }
        const pk = item.pkquality;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === 'taskdel') {
                Util.showMessage('数据已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else {
                this.deletCheckData(item.pkquality);
            }
        });
    }

    // 删除规则数据
    deletCheckData(pk) {
        Util.showConfirm('检验定义将被删除，确定要删除吗？', () => {
            this.apiService.dqdel(pk).then(data => {
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

    // 修改规则数据
    editCheckData(pk) {
        // 初始化重新获取
        this.dsNameList = [];
        this.dsNameLazy = true;
        this.tableList = [];
        this.tableLazy = true;
        this.columnList = [];
        this.columnLazy = true;
        this.unionTableList = [];
        this.unionTableLazy = true;
        this.unionColumnList = [];
        this.unionColumnLazy = true;
        this.apiService.getdq(pk).then(data => {
            if (data.code === 200) {
                this.currentCheckObj = data.msg;
                this.currentCheckObj.jsonColumn += ',';
                if ( this.currentCheckObj.ruleType === 'ConsistencyCheck') {
                    this.currentCheckObj.unionColumn += ',';
                }
                // this.getDsNameList();
                // 初始化重新获取
                this.dsNameList = [];
                this.dsNameLazy = true;
                // 初始化重新获取
                this.currentCheckShow = true;
            } else {
                Util.showMessage(data.msg, 'error');
            }
        });
    }

    // 返回保存对象
    getSaveObject() {
        const currentCheckObj = this.currentCheckObj;
        if (!currentCheckObj.ruleName) {
            return false;
        }
        if (!currentCheckObj.ruleType) {
            return false;
        }
        if (!currentCheckObj.dsName) {
            return false;
        }
        if (currentCheckObj.ruleType !== 'CustomCheck') {
            if (!currentCheckObj.tableName) {
                return false;
            }
            if (currentCheckObj.ruleType !== 'ConsistencyCheck') {
                if (!currentCheckObj.columnName) {
                    return false;
                }
            }
        }

        if (currentCheckObj.ruleType === 'UniqueForeignCheck') {
            if (!currentCheckObj.unionTable) {
                return false;
            }

            if (!currentCheckObj.unionColumn) {
                return false;
            }
        }
        if (currentCheckObj.ruleType === 'ConsistencyCheck') {
            if (!currentCheckObj.unionJson) {
                return false;
            }

            if (!currentCheckObj.unionTable) {
                return false;
            }
        }

        let saveObject = {
            pkQuality: currentCheckObj.pkQuality, // 主键
            ruleName: currentCheckObj.ruleName, // 规则名称
            ruleType: currentCheckObj.ruleType, // 规则类型
            dsName: currentCheckObj.dsName, // 检核系统
            ruleNote: currentCheckObj.ruleNote, // 备注
            whereSql: currentCheckObj.whereSql // whereSql或自定义SQL
        };
        if (this.currentCheckObj.ruleType !== 'CustomCheck') { // 除自定义检查之外均有检核表和检核字段
            const columnName = currentCheckObj.columnName.replace(/,$/gi, '');
            saveObject = Object.assign(saveObject,
                {
                    tableName: currentCheckObj.tableName, // 检核表
                    columnName: columnName, // 检核字段
                });
            if (this.currentCheckObj.ruleType !== 'ConsistencyCheck') { // 除自定义检查和一致性检查之外均有标识字段
                const jsonColum = currentCheckObj.jsonColumn.replace(/,$/gi, '');
                saveObject = Object.assign(saveObject,
                    {
                        jsonColumn: jsonColum, // 标识字段
                    });
            }
        }
        if (this.currentCheckObj.ruleType === 'ConsistencyCheck' || this.currentCheckObj.ruleType === 'UniqueForeignCheck') {
            const unionColumn = currentCheckObj.unionColumn.replace(/,$/gi, '');
            saveObject = Object.assign(saveObject,
                {
                    unionTable: currentCheckObj.unionTable, // 主表或主键表
                    unionColumn: unionColumn, // 主字段或主键字段
                    unionWhere: currentCheckObj.unionWhere // 主表wheresql或主键表wheresql
                });
        }
        if (this.currentCheckObj.ruleType === 'ConsistencyCheck') { // 只有一致性检查有主系统
            saveObject = Object.assign(saveObject,
                {
                    unionJson: currentCheckObj.unionJson // 主系统
                });
        }
        if (this.currentCheckObj.ruleType === 'CorrectLengthCheck') {
            if (isNaN(Number(currentCheckObj.unionColumn)) || !currentCheckObj.unionColumn) {
                return false;
            }
            saveObject = Object.assign(saveObject,
                {
                    unionTable: currentCheckObj.unionTable ? currentCheckObj.unionTable : '<', // 关系，默认为小于
                    unionColumn: currentCheckObj.unionColumn // 长度规范数值
                });
        }
        if (this.currentCheckObj.ruleType === 'CorrectCodeCheck') {
            saveObject = Object.assign(saveObject,
                {
                    unionWhere: currentCheckObj.unionWhere // 代码检查规范
                });
        }
        return saveObject;
    }

    getDsNameList() {
        this.checkLoading = true;
        this.apiService.getDsNames().then(data => {
            if (data.code === 200) {
                this.checkLoading = false;
                this.dsNameList = data.msg.map(item => {
                    this.dsNameType[item.dsName] = item.dsTypeVO ? item.dsTypeVO.name : '';
                    return item.dsName;
                });
                this.dsNameLazy = false;
            } else {
                this.checkLoading = false;
                Util.showMessage(data.msg, 'error');
            }
        });
    }

    getTableList() {
        this.checkLoading = true;
        const dsName = this.currentCheckObj.dsName;
        const res = this.apiService.gettable(dsName).then(data => {
            if (data.code === 200) {
                this.checkLoading = false;
                if (this.currentCheckObj.ruleType !== 'ConsistencyCheck') { // 一致性检查主表和检核表不一样
                    this.unionTableList = this.tableList = data.msg;
                    this.tableLazy = false;
                    this.unionTableLazy = false;
                } else {
                    this.tableLazy = false;
                    this.tableList = data.msg;
                }
            } else {
                this.checkLoading = false;
                Util.showMessage(data.msg, 'error');
            }
        });
        return res;
    }

    getUnionTableList() {
        this.checkLoading = true;
        const dsName = this.currentCheckObj.unionJson;
        const res = this.apiService.gettable(dsName).then(data => {
            if (data.code === 200) {
                this.checkLoading = false;
                this.unionTableList = data.msg;
                this.unionTableLazy = false;
            } else {
                this.checkLoading = false;
                Util.showMessage(data.msg, 'error');
            }
        });
        return res;
    }

    getColumnList() {
        this.checkLoading = true;
        const dsName = this.currentCheckObj.dsName;
        const tableName = this.currentCheckObj.tableName;
        const res = this.apiService.getcolumn(dsName, tableName).then(data => {
            if (data.code === 200) {
                this.checkLoading = false;
                this.columnList = data.msg;
                this.columnLazy = false;
            } else {
                this.checkLoading = false;
                Util.showMessage(data.msg, 'error');
            }
        });
        return res;
    }

    getUnionColumnList() {
        this.checkLoading = true;
        const dsName = this.currentCheckObj.ruleType !== 'ConsistencyCheck' ?
            this.currentCheckObj.dsName : this.currentCheckObj.unionJson;
        const tableName = this.currentCheckObj.unionTable;
        const res = this.apiService.getcolumn(dsName, tableName).then(data => {
            if (data.code === 200) {
                this.checkLoading = false;
                this.unionColumnList = data.msg;
                this.unionColumnLazy = false;
            } else {
                this.checkLoading = false;
                Util.showMessage(data.msg, 'error');
            }
        });
        return res;
    }

    // 系统改变
    dsNameChange(dsName) {
        this.currentCheckObj.dsName = dsName;
        this.tableList = [];
        this.columnList = [];
        this.currentCheckObj.tableName = '';
        this.currentCheckObj.columnName = '';
        this.currentCheckObj.jsonColumn = '';
        if (this.dsNameType[dsName] === 'KUDU') {
            this.ruleList = this.kuduList;
            if (this.currentCheckObj.ruleType === 'CustomCheck'
                || this.currentCheckObj.ruleType === 'UniqueIntegrityCheck'
                || this.currentCheckObj.ruleType === 'UniqueForeignCheck') {
                this.currentCheckObj.ruleType = '';
                this.currentCheckObj.unionTable = '';
                this.currentCheckObj.unionColumn = '';
            }
        } else {
            this.ruleList = this.ruleListOrigin;
        }
        if (this.currentCheckObj.ruleType !== 'ConsistencyCheck') { // 不是一致性检查清空
            this.unionColumnList = [];
            this.currentCheckObj.unionTable = '';
            this.currentCheckObj.unionColumn = '';
            this.currentCheckObj.unionJson = '';
        }
        if (this.currentCheckObj.ruleType !== 'ConsistencyCheck') { // 一致性检查主表和检核表不一样
            this.unionTableList = this.tableList = [];
            this.tableLazy = true;
            this.unionTableLazy = true;
        } else {
            this.tableList = [];
            this.tableLazy = true;
        }
    }

    unionDsNameChange(dsName) {
        this.currentCheckObj.unionJson = dsName;
        this.unionTableList = [];
        this.unionColumnList = [];
        this.currentCheckObj.unionTable = '';
        this.currentCheckObj.unionColumn = '';
        this.unionTableList = [];
        this.unionTableLazy = true;
    }

    ruleTypeChange(ruleType) {
        this.currentCheckObj.ruleType = ruleType;
        this.currentCheckObj.unionTable = '';
        this.currentCheckObj.unionColumn = '';
        this.currentCheckObj.unionJson = '';
        this.currentCheckObj.unionWhere = '';
    }

    // 表名改变
    tableChange(tableName) {
        this.currentCheckObj.tableName = tableName;
        this.currentCheckObj.columnName = '';
        this.currentCheckObj.jsonColumn = '';
        this.columnList = [];
        this.columnLazy = true;
    }

    // 联合字段改变
    unionTableChange(tableName) {
        this.currentCheckObj.unionTable = tableName;
        this.currentCheckObj.unionColumn = '';
        this.unionColumnList = [];
        this.unionColumnLazy = true;
    }

    getTableUrl() {
        let paramsString = '';
        if (this.ruleType) {
            paramsString += '&ruleType=' + this.ruleType + '&fuzzMatch=false';
        }
        if (this.dsName) {
            paramsString += '&dsName=' + this.dsName + '&fuzzMatch=false';
        }
        if (this.status || this.status === 0) {
            paramsString += '&status=' + this.status + '&fuzzMatch=false';
        }
        if (this.triggerStatus || this.triggerStatus === 0) {
            paramsString += '&triggerStatus=' + this.triggerStatus + '&fuzzMatch=false';
        }
        if (this.searchValue) {
            paramsString += '&ruleName=' + this.searchValue + '&fuzzMatch=true';
        }
        return 'dwb/dqmanage/dqlist' + '?pkDir=' + this.QuerydirPK + paramsString;
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

    isNumber(number) {
        return !isNaN(Number(number));
    }

    /*------------------------------ 立即执行和调度设置相关的接口--------------------------------*/

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

    // 立即执行或调度之前确定数据是否已经被删除
    // 操作之前确认数据是否已经被删除
    async ConfirmBeforeOpation(pk) {
        return await this.apiService.BeforeCheck(pk).then((res) => {
            if (res.code === 200) {
                if (res.msg === '可以执行下面操作') {
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
        const pk = item.pkquality;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '数据源被删除，请重新填写') {
                Util.showMessage('规则被删除!', 'error');
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
            businessId: item.pkquality,
            moduleId: 'dw',
            triggerName: item.rulename,
            buildCls: 'com.yonyou.dataworks.dqmanage.job.DqManageJobBuilder'
        };
        Util.showConfirm('确定要立即执行吗?', () => {
            if (!obj.businessId) {
                Util.showMessage('当前规则没有调度配置，请添加！', 'warning');
                return false;
            } else {
                this.apiService.newmetaExec(obj).then((res) => {
                    if (res.code === 200) {
                        Util.showMessage('正在执行,稍后可刷新查看最新状态', 'success');
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
        const pk = item.pkquality;
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
                    Obj.businessId = item.pkquality;
                    const Name = res.triggerName;
                    Obj.triggerName = (Name === undefined || !Name || Name === 'undefined') ? item.rulename : Name;
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
            this.NewSchetriggerName = item.rulename;
            this.showNewSche = true;
            this.NewScebusinessId = item.pkquality;
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
                $('#SettingMetaModel').modal('hide');
                this.closeNewOrEdit();
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
    EditeditScheObj($event) {
        const data = $event;
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


    /*-------------------------------------------检核状态日志接口------------------------------------*/

    // 显示日志信息之前的确认
    BeforeshowLog(item) {
        const pk = item.pkquality;
        this.ConfirmBeforeOpation(pk).then((flag) => {
            if (flag === 'jobdel' || flag === '任务已经被删除，请重新选择') {
                Util.showMessage('规则已经被删除，请重新选择', 'error');
                this.refreshMeta(false, false);
                return false;
            } else if (flag === true) {
                this.showLog(item);
            } else {
                Util.showMessage(flag, 'error');
            }
        });
    }

    // 显示采集日志信息
    showLog(item) {
        const id = item.trigger_id;
        if (!id) {
            Util.showMessage('当前规则没有调度配置，请添加调度配置', 'warning');
            return false;
        } else if (item.status === 0 || !item.status) {
            Util.showMessage('当前规则调度配置没有执行，请执行调度配置', 'warning');
            return false;
        } else if (item.status === 3) {
            Util.showMessage('当前规则正在检核中，请等待完成后再查看日志', 'warning');
            return false;
        } else {
            this.apiService.loadCheckId(id).then((res) => {
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
