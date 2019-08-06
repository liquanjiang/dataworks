import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import Util from '../../util';
import * as _ from 'lodash';
import { ApiService } from '../../../api.service';

@Component({
    selector: 'app-edit-sch-setting',
    templateUrl: './edit-sch-setting.component.html',
    styleUrls: ['./edit-sch-setting.component.css']
})
export class EditSchSettingComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() EditScheObject;
    @Input() EditTimeInit;
    @Output() EditScheSetting: EventEmitter<any> = new EventEmitter<any>();
    @Output() cancelEditSche: EventEmitter<any> = new EventEmitter<any>();
    setPeriodArr = [  // 存放元数据调度配置周期数组
        { key: '月', value: 'Month' },
        { key: '周', value: 'Week' },
        { key: '日', value: 'Hour' }
    ];
    PeriodArr = []; // 存放编辑配置当前选中的周期数组
    showEidtTimeSelector = false; // 是否显示编辑配置的时间选择器
    showEditPeriodSettor = false; // 是否显示编辑配置的周期时间选择器
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
        buildCls: '',
        moduleId: 'dw'
    };
    showNewPeriodUL = false;
    showEidtPeriodUL = false;
    schePeriod = null; // 时间周期选择器的input参数
    WindowHeight = 0;

    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
        this.WindowHeight = window.innerHeight;
        this.TimeInit = this.EditTimeInit;
        this.editScheObj = _.cloneDeep(this.EditScheObject);
    }

    ngOnDestroy(): void {
        $(document).off('keydown');
    }

    ngAfterViewInit(): void {
        this.initdatapicker();
        const that = this;
        $(document).on('keydown', (e) => {
            if (e.keyCode === 27) { // 当按下Esc键时关闭窗口，同时触发取消编辑事件
                that.CancelEditeditScheObj();
            }
        });
    }

    // 切换新建和修改配置的启用
    changePause(value, x) {
        this.editScheObj.pause = !value;
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


    // 编辑设置窗口确认按钮
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
            this.EditScheSetting.emit(data);
        }
    }

    // 编辑设置窗口取消按钮
    CancelEditeditScheObj() {
        this.TimeInit.hour = '00';
        this.TimeInit.minute = '00';
        this.TimeInit.second = '00';
        this.cancelEditSche.emit('close');
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
        that.showEidtTimeSelector = false;
        that.showEditPeriodSettor = false;
        that.showNewPeriodUL = false;
        that.showEidtPeriodUL = false;
    }

    // 显示时间选择组件
    TimeSelectorShow(x) {
        const that = this;
        that.hiddenAll();
        this.showEidtTimeSelector = true;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#SettingDate');
            const flag2 = $(obj).isChildAndSelfOf('.time-selector-div');
            const flag3 = $(obj).isChildAndSelfOf('#SettingEditDate');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showEidtTimeSelector = false;
            }
        });
    }

    // 显示周期选择组件
    PeriodSelectorShow(x) {
        const that = this;
        that.hiddenAll();
        this.showEditPeriodSettor = true;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#EditPeriod');
            const flag2 = $(obj).isChildAndSelfOf('.time-periodsetter-div');
            const flag3 = $(obj).isChildAndSelfOf('#NewPeriod');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showEditPeriodSettor = false;
            }
        });
    }

    // 关闭时间选择组件
    TimeSelectClose() {
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
        $('#editStart').datetimepicker(startobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.editScheObj.startTime = Util.formatDateTime(value);
        });
        $('#editEnd').datetimepicker(endobj).on('changeDate', (e) => {
            const value = e.date.valueOf();
            this.editScheObj.endTime = Util.formatDateTime(value);
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
