import { Component, EventEmitter, Input, OnInit, Output, OnChanges, AfterViewInit, OnDestroy } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import * as _ from 'lodash';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-work-schesetting',
    templateUrl: './work-schesetting.component.html',
    styleUrls: ['./work-schesetting.component.css']
})
export class WorkSchesettingComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() Job;
    newScheObj = { // 存放新增采集配置的参数对象
        addFlag: true,
        businessId: '',
        triggerName: '',
        schePeriod: '',
        selectTimes: [],
        specificTime: '',
        startTime: '',
        endTime: '2099-12-31 00:00:00',
        pause: true,
        buildCls: 'com.yonyou.dataworks.etl.job.EtlJobBuilder',
        moduleId: 'dw'
    };
    newScheObjUnit = { // 存放新增采集配置的参数对象的拷贝
        addFlag: true,
        businessId: '',
        triggerName: '',
        schePeriod: '',
        selectTimes: [],
        specificTime: '',
        startTime: '',
        endTime: '2099-12-31 00:00:00',
        pause: true,
        buildCls: 'com.yonyou.dataworks.etl.job.EtlJobBuilder',
        moduleId: 'dw'
    };
    editScheObj = { // 存放修改配置信息的基本对象
        addFlag: false,
        businessId: '',
        triggerName: '',
        schePeriod: '',
        selectTimes: [],
        specificTime: '',
        startTime: '',
        endTime: '',
        pause: false,
        buildCls: 'com.yonyou.dataworks.etl.job.EtlJobBuilder',
        moduleId: 'dw'
    };
    TimeInit = {  // 修改配置的时间选择器的初始化时间
        hour: '00',
        minute: '00',
        second: '00'
    };
    newTimeInit = {   // 新增配置的时间选择器的初始化时间
        hour: '00',
        minute: '00',
        second: '00'
    };
    schePeriod = null; // 时间周期选择器的input参数
    newschePeriod = ''; // 新建调度配置周期选择器的input参数
    setPeriodArr = [  // 存放元数据调度配置周期数组
        { key: '月', value: 'Month' },
        { key: '周', value: 'Week' },
        { key: '日', value: 'Hour' }
    ];
    PeriodArr = []; // 存放编辑配置当前选中的周期数组
    newPeriodArr = []; // 存放新建周期数组
    showTimeSelector = false; // 是否显示新增配置的时间选择器
    showEidtTimeSelector = false; // 是否显示编辑配置的时间选择器
    showPeriodSettor = false;     // 是否显示新增配置的周期时间选择器
    showEditPeriodSettor = false; // 是否显示编辑配置的周期时间选择器
    showNewPeriodUL = false;
    showEidtPeriodUL = false;
    showNewMetaUL = false; // 显示新建任务下拉选项
    showEditMetaUL = false; // 显示修改任务下拉选项
    elementTop = null;  // 存放时间选择插件的top
    elementLeft = null; // 存放时间选择插件的left
    periodToP = null;   // 存放周期选择插件的top
    periodLeft = null;  // 存放周期选择插件的left
    showEdit = false; // 显示修改配置数据的区域
    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
    }

    ngOnChanges() {
    }

    ngAfterViewInit() {
        this.initdatapicker();
    }

    ngOnDestroy() {
        $(window).off('click');
    }

    // 根据当前作业的pk获取作业的配置信息
    getJobSche(Job) {
        if (Job) {
            const id = Job.trigger_id;
            const item = Job;
            const Obj = this.editScheObj;
            if (id) { // 修改配置
                this.showEdit = true;
                this.apiservice.getScheSet(id).then((resp) => {
                    if (resp) {
                        const res = resp.msg;
                        const bean = res.strategyBean;
                        Obj.businessId = item.pk;
                        Obj.triggerName = res.triggerName;
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
                    }
                });
            } else {
                this.showEdit = false;
                this.newScheObj = _.cloneDeep(this.newScheObjUnit);
                this.newScheObj.businessId = item.pk;
                this.newScheObj.triggerName = item.name;
                this.newScheObj.startTime = Util.setTimeNowStr();
            }
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

    // 根据时分秒获取时间字符串
    getTime(a, b, c) {
        let d, e, f;
        d = a < 10 ? '0' + a.toString() : a.toString();
        e = b < 10 ? '0' + b.toString() : b.toString();
        f = c < 10 ? '0' + c.toString() : c.toString();
        return d + ':' + e + ':' + f;
    }


    // 切换新建和修改配置的启用
    changePause(value, x) {
        if (x === 0) {
            this.newScheObj.pause = !value;
        } else {
            this.editScheObj.pause = !value;
        }
    }

    // 显示时间选择组件
    TimeSelectorShow(x, $event) {
        const ele = $($event.target);
        const top = ele.offset().top;
        const left = ele.offset().left;
        this.elementTop = top - 296;
        this.elementLeft = left;
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showTimeSelector = true;
        } else {
            this.showEidtTimeSelector = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#SettingDate');
            const flag2 = $(obj).isChildAndSelfOf('.time-selector-div');
            const flag3 = $(obj).isChildAndSelfOf('#SettingEditDate');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showTimeSelector = false;
                that.showEidtTimeSelector = false;
            }
        });
    }

    // 根据value 返回key
    getkeyByValue(value, arr, a, b) {
        if (!value) {
            return null;
        }
        const len = arr.length;
        for (let i = 0; i < len; i++) {
            if (value === arr[i][a]) {
                return arr[i][b];
            }
        }
        return null;
    }

    // 隐藏所有弹出组件
    hiddenAll() {
        const that = this;
        that.showTimeSelector = false;
        that.showEidtTimeSelector = false;
        that.showPeriodSettor = false;
        that.showEditPeriodSettor = false;
        that.showNewPeriodUL = false;
        that.showEidtPeriodUL = false;
        this.showNewMetaUL = false;
        this.showEditMetaUL = false;
    }

    // 编辑设置窗口切换时间周期时间
    changeeditschePeriod(schePeriod) {
        this.schePeriod = schePeriod;
        this.editScheObj.selectTimes = [];
        this.editScheObj.schePeriod = schePeriod;
        this.PeriodArr = [];
        const Time = this.editScheObj.specificTime;
        if (Time && this.schePeriod === 'Hour') { // 当选择调度周期为天时，将选中的时间点的小时数放入周期时间段数组
            const time = parseInt(Time.substring(0, 2), 10);
            const arr = [];
            arr.push(time);
            this.editScheObj.selectTimes = arr;
        }
        this.showEidtPeriodUL = false;
    }

    // 新建设置窗口切换时间周期时间
    changenewschePeriod(schePeriod) {
        this.newschePeriod = schePeriod;
        this.newScheObj.schePeriod = schePeriod;
        this.newScheObj.selectTimes = [];
        this.newPeriodArr = [];
        const Time = this.newScheObj.specificTime;
        if (Time && schePeriod === 'Hour') { // 当选择调度周期为天时，将选中的时间点的小时数放入周期时间段数组
            const time = parseInt(Time.substring(0, 2), 10);
            const arr = [];
            arr.push(time);
            this.newScheObj.selectTimes = arr;
        }
        this.showNewPeriodUL = false;
    }

    // 新增设置的保存按钮
    AddnewScheObj() {
        const stime = $('#dateStart').val();
        const etime = $('#dateEnd').val();
        if (stime) {
            this.newScheObj.startTime = stime;
        }
        if (etime) {
            this.newScheObj.endTime = etime;
        }
        const data = this.newScheObj;
        const flag = this.validateScheObj(data);
        if (flag === 'newSche') {
            Util.showMessage('保存成功', 'success');
            return false;
        }
        if (!flag) {
            return false;
        } else {
            this.apiservice.addOrEidtScheSet(data).then((res) => {
                if (res.code === 200 && res.msg === 'SUCCESS') {
                    Util.showMessage('保存成功', 'success');
                } else {
                    Util.showMessage(res, 'error');
                }
            });
        }
    }

    // 编辑设置的保存按钮
    EditeditScheObj() {
        const stime = $('#editStart').val();
        const etime = $('#editEnd').val();
        if (stime) {
            this.editScheObj.startTime = stime;
        }
        if (etime) {
            this.editScheObj.endTime = etime;
        }
        const data = this.editScheObj;
        const flag = this.validateScheObj(data);
        if (!flag) {
            return false;
        } else {
            this.apiservice.addOrEidtScheSet(data).then((res) => {
                if (res.code === 200 && res.msg === 'SUCCESS') {
                    Util.showMessage('保存成功', 'success');
                } else {
                    Util.showMessage(res, 'error');
                }
            });
        }
    }

    // 校验新增或修改设置的参数数据的格式
    validateScheObj(data) {
        const canDo = function (a) {
            return a === undefined || a === '' || a === null;
        };
        const Name = data.triggerName,
            schePeriod = data.schePeriod,
            selectTimes = data.selectTimes,
            specificTime = data.specificTime,
            startTime = data.startTime,
            endTime = data.endTime;
        if (canDo(schePeriod) && canDo(specificTime)) {
            // 如果调度周期和调度时间段都没有选择，说明是新增调度周期且没有修改，那么不提示也不保存
            return 'newSche';
        }
        if (canDo(Name)) {
            Util.showMessage('名称不能为空', 'warning');
            return false;
        } else if (canDo(schePeriod)) {
            Util.showMessage('请选择调度周期单位', 'warning');
            return false;
        } else if (selectTimes.length === 0) {
            Util.showMessage('请选择调度周期时间段', 'warning');
            return false;
        } else if (canDo(specificTime)) {
            Util.showMessage('请选择调度时间点', 'warning');
            return false;
        } else if (canDo(startTime)) {
            Util.showMessage('请选择有效日期开始时间', 'warning');
            return false;
        } else if (canDo(endTime)) {
            Util.showMessage('请选择有效日期结束时间', 'warning');
            return false;
        } else {
            return true;
        }
    }

    // 关闭时间选择组件
    TimeSelectClose() {
        this.showTimeSelector = false;
        this.showEidtTimeSelector = false;
    }

    // 修改配置弹窗时间选择组件确定按钮
    changeTimeSelected($event) {
        this.editScheObj.specificTime = $event.hour + ':' + $event.minute + ':' + $event.second;
        if (this.editScheObj.schePeriod === 'Hour') { // 当选择调度周期为天时，将选中的时间点的小时数放入周期时间段数组
            const time = parseInt($event.hour, 10);
            const arr = [];
            arr.push(time);
            this.editScheObj.selectTimes = arr;
        }
    }

    // 周期选择组件确认按钮
    ConfirmPeriod($event) {
        this.editScheObj.selectTimes = $event;
        this.PeriodArr = $.extend(true, [], $event);
    }

    // 新建配置周期选择组件取消按钮
    ConfirmNewPeriod($event) {
        this.newScheObj.selectTimes = $event;
    }

    // 获取开始和结束时间的字符串
    getStartEndTimeStr(str) {
        return str.substring(0, 10);
    }

    // 获取计算后的数组内的日期
    getCalc(Obj) {
        const array = Obj.selectTimes ? Obj.selectTimes : [];
        if (array.length === 0) {
            return null;
        }
        const arr = array.sort();
        const len = arr.length;
        let Str = '';
        for (let i = 0; i < len; i++) {
            let str = null;
            if (Obj.schePeriod === 'Week') {
                str = Util.getWeekDayByValue(arr[i]);
            } else {
                str = arr[i].toString();
            }
            if (i < len - 1) {
                Str = Str + str + ',';
            } else {
                Str = Str + str;
            }
        }
        return Str;
    }

    // 显示周期选择组件
    PeriodSelectorShow(x, $event) {
        const ele = $('#EditPeriod');
        const ele1 = $('#NewPeriod');
        const top = x === 1 ? ele.offset().top : ele1.offset().top;
        const left = x === 1 ? ele.offset().left : ele1.offset().left;
        this.periodToP = top - 207;
        this.periodLeft = left;
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showPeriodSettor = true;
        } else {
            this.showEditPeriodSettor = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#EditPeriod');
            const flag2 = $(obj).isChildAndSelfOf('.time-periodsetter-div');
            const flag3 = $(obj).isChildAndSelfOf('#NewPeriod');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showPeriodSettor = false;
                that.showEditPeriodSettor = false;
            }
        });
    }

    // 显示新建周期的选择
    showNewPeriod(x) {
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showNewPeriodUL = true;
        } else {
            this.showEidtPeriodUL = true;
        }

        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#newPeriodUl');
            const flag2 = $(obj).isChildAndSelfOf('.period-ul');
            const flag3 = $(obj).isChildAndSelfOf('#editPeriodUl');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showNewPeriodUL = false;
                that.showEidtPeriodUL = false;
            }
        });
    }

    // 初始化日期选择器
    initdatapicker() {
        const startobj = {
            autoclose: true,
            format: 'yyyy-mm-dd 00:00:00',
            language: 'zh-CN',
            weekStart: 0,
            minView: 2,
            todayHighlight: true,
            todayBtn: true,
            keyboardNavigation: true,
            pickerPosition: 'top-left'
        };

        const endobj = {
            autoclose: true,
            format: 'yyyy-mm-dd 24:00:00',
            language: 'zh-CN',
            weekStart: 0,
            minView: 2,
            todayHighlight: true,
            todayBtn: true,
            keyboardNavigation: true,
            pickerPosition: 'top-left'
        };
        $('#dateStart').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.newScheObj.startTime = Util.formatDateTime(value);
        });
        $('#dateEnd').datetimepicker(endobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.newScheObj.endTime = Util.formatDateTime(value);
        });
        $('#editStart').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.editScheObj.startTime = Util.formatDateTime(value);
        });
        $('#editEnd').datetimepicker(endobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.editScheObj.endTime = Util.formatDateTime(value);
        });
    }

    // 新建配置弹窗时间选择组件确定按钮
    changeNewTimeSelected($event) {
        this.newScheObj.specificTime = $event.hour + ':' + $event.minute + ':' + $event.second;
        if (this.newScheObj.schePeriod === 'Hour') { // 当选择调度周期为天时，将选中的时间点的小时数放入周期时间段数组
            const time = parseInt($event.hour, 10);
            const arr = [];
            arr.push(time);
            this.newScheObj.selectTimes = arr;
        }
    }

    // 保存调度设置
    saveScheSetting() {
        const newset = this.showEdit;
        if (newset) {
            return this.EditeditScheObj();
        } else {
            return this.AddnewScheObj();
        }
    }
}
