import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import Util from '../../util';
import * as _ from 'lodash';

@Component({
    selector: 'app-new-sch-setting',
    templateUrl: './new-sch-setting.component.html',
    styleUrls: ['./new-sch-setting.component.css']
})
export class NewSchSettingComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() triggerName;
    @Input() businessId;
    @Input() buildCls;
    @Output() newScheSetting: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelNewSche: EventEmitter<any> = new EventEmitter<any>();
    setPeriodArr = [  // 存放元数据调度配置周期数组
        { key: '月', value: 'Month' },
        { key: '周', value: 'Week' },
        { key: '日', value: 'Hour' }
    ];
    PeriodArr = []; // 存放编辑配置当前选中的周期数组
    newPeriodArr = []; // 存放新建周期数组
    showTimeSelector = false; // 是否显示新增配置的时间选择器
    showPeriodSettor = false;     // 是否显示新增配置的周期时间选择器
    newTimeInit = {   // 新增配置的时间选择器的初始化时间
        hour: '00',
        minute: '00',
        second: '00'
    };
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
        buildCls: '',
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
        buildCls: '',
        moduleId: 'dw'
    };
    showNewPeriodUL = false;
    newschePeriod = ''; // 新建调度配置周期选择器的input参数
    WindowHeight = 0;

    constructor() {
    }

    ngOnInit() {
        this.WindowHeight = window.innerHeight;
        this.newScheObj.businessId = this.businessId;
        this.newScheObj.startTime = Util.setTimeNowStr();
        this.newScheObj.triggerName = this.triggerName;
        this.newScheObj.buildCls = this.buildCls;
        this.newScheObjUnit.buildCls = this.buildCls;
    }

    ngOnDestroy(): void {
        $(document).off('keydown');
    }

    ngAfterViewInit(): void {
        this.initdatapicker();
        const that = this;
        $(document).on('keydown', (e) => {
            if (e.keyCode === 27) { // 当按下Esc键时关闭窗口，同时触发取消新建事件
                that.CancelAddnewScheObj();
            }
        });
    }

    // 切换新建和修改配置的启用
    changePause(value, x) {
        this.newScheObj.pause = !value;
    }

    // 显示新建周期的选择
    showNewPeriod(x) {
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showNewPeriodUL = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#newPeriodUl');
            const flag2 = $(obj).isChildAndSelfOf('.period-ul');
            const flag = flag1 || flag2;
            if (!flag) {
                that.showNewPeriodUL = false;
            }
        });
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

    // 新增设置窗口的确认按钮
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
        if (!flag) {
            return false;
        } else {
            this.newScheSetting.emit(data);
        }
    }

    // 新增设置窗口的取消按钮
    CancelAddnewScheObj() {
        this.newScheObj = _.cloneDeep(this.newScheObjUnit);
        this.cancelNewSche.emit('close');
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

    // 隐藏所有弹出组件
    hiddenAll() {
        const that = this;
        that.showTimeSelector = false;
        that.showPeriodSettor = false;
        that.showNewPeriodUL = false;
    }

    // 显示时间选择组件
    TimeSelectorShow(x) {
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showTimeSelector = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#SettingDate');
            const flag2 = $(obj).isChildAndSelfOf('.time-selector-div');
            const flag = flag1 || flag2;
            if (!flag) {
                that.showTimeSelector = false;
            }
        });
    }

    // 显示周期选择组件
    PeriodSelectorShow(x) {
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showPeriodSettor = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag2 = $(obj).isChildAndSelfOf('.time-periodsetter-div');
            const flag3 = $(obj).isChildAndSelfOf('#NewPeriod');
            const flag = flag2 || flag3;
            if (!flag) {
                that.showPeriodSettor = false;
            }
        });
    }

    // 关闭时间选择组件
    TimeSelectClose() {
        this.showTimeSelector = false;
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

    // 新建配置周期选择组件取消按钮
    ConfirmNewPeriod($event) {
        this.newScheObj.selectTimes = $event;
    }

    // 获取开始和结束时间的字符串
    getStartEndTimeStr(str) {
        return str.substring(0, 10);
    }

    // 获取开始和结束时间的字符串
    getspecificTimeStr(str) {
        return str.substring(3);
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

    // 根据时分秒获取时间字符串
    getTime(a, b, c) {
        let d, e, f;
        d = a < 10 ? '0' + a.toString() : a.toString();
        e = b < 10 ? '0' + b.toString() : b.toString();
        f = c < 10 ? '0' + c.toString() : c.toString();
        return d + ':' + e + ':' + f;
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

}
