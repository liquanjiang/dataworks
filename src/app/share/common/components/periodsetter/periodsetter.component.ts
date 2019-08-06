import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';


declare var $: any;

@Component({
    selector: 'app-periodsetter',
    templateUrl: './periodsetter.component.html',
    styleUrls: ['./periodsetter.component.css']
})
export class PeriodsetterComponent implements OnInit {
    @Input() PeriodType;
    @Input() PeriodObject;
    @Input() PeriodArr;
    @Output() PeriodSelected: EventEmitter<any> = new EventEmitter<any>();
    BaseArr = [
        { key: false, value: 1, name: '01' },
        { key: false, value: 2, name: '02' },
        { key: false, value: 3, name: '03' },
        { key: false, value: 4, name: '04' },
        { key: false, value: 5, name: '05' },
        { key: false, value: 6, name: '06' },
        { key: false, value: 7, name: '07' },
        { key: false, value: 8, name: '08' },
        { key: false, value: 9, name: '09' }
    ]; // 基础数组
    HourArr = [];    // 存放小时数组
    WeekArr = [];   // 存放周数组
    WeekArrUnit = [ // 存放周数组拷贝
        { key: false, value: 1, name: '星期一' },
        { key: false, value: 2, name: '星期二' },
        { key: false, value: 3, name: '星期三' },
        { key: false, value: 4, name: '星期四' },
        { key: false, value: 5, name: '星期五' },
        { key: false, value: 6, name: '星期六' },
        { key: false, value: 0, name: '星期日' }
    ];  // 存放分钟数组
    MonthArr = [];
    MonthselectArr = [];
    WeekselectArr = [];
    HourselectArr = [];

    constructor() {
    }

    ngOnInit() {
        this.setPeriodArr();
        this.getHourArr();
        this.getMonthArr();
        this.getWeekArr();
    }

    // 设置输入的数组的显示
    setPeriodArr() {
        if (this.PeriodType === 'Hour') {
            this.HourselectArr = this.PeriodArr;
        } else if (this.PeriodType === 'Week') {
            this.WeekselectArr = this.PeriodArr;
        } else if (this.PeriodType === 'Month') {
            this.MonthselectArr = this.PeriodArr;
        }
    }

    // 生成小时数组
    getHourArr() {
        const arr = [];
        for (let i = 0; i < 24; i++) {
            const obj = { key: false, value: i, name: i.toString() };
            arr.push(obj);
        }
        this.HourArr = arr;
        const Arr = this.HourArr;
        const select = this.HourselectArr;
        for (let i = 0; i < 24; i++) {
            if (select.indexOf(Arr[i].value) >= 0) {
                Arr[i].key = true;
            }
        }
    }

    // 生成周数组
    getWeekArr() {
        this.WeekArr = this.WeekArrUnit;
        const Arr = this.WeekArr;
        const select = this.WeekselectArr;
        for (let i = 0; i < 7; i++) {
            if (select.indexOf(Arr[i].value) >= 0) {
                Arr[i].key = true;
            }
        }
    }

    // 生成月份数组
    getMonthArr() {
        const arr = [];
        for (let i = 10; i < 32; i++) {
            const obj = { key: false, value: i, name: i.toString() };
            arr.push(obj);
        }
        this.MonthArr = this.BaseArr.concat(arr);
        const Arr = this.MonthArr;
        const select = this.MonthselectArr;
        for (let i = 0; i < 31; i++) {
            if (select.indexOf(Arr[i].value) >= 0) {
                Arr[i].key = true;
            }
        }
    }


    // 选中月份中的日期,周中的星期和日中的小时
    selectTimeArr(item, arr) {
        item.key = !item.key;
        const flag = arr.indexOf(item.value) < 0;
        if (item.key === true && flag) {
            arr.push(item.value);
        } else if (item.key === false && !flag) {
            const index = arr.findIndex((abc) => abc === item.value);
            if (index >= 0) {
                arr.splice(index, 1);
            }
        }
        this.setPeriodConfirm();
    }

    setPeriodConfirm() {
        const type = this.PeriodType;
        if (type === 'Hour') {
            this.PeriodSelected.emit(this.HourselectArr);
        } else if (type === 'Month') {
            this.PeriodSelected.emit(this.MonthselectArr);
        } else if (type === 'Week') {
            this.PeriodSelected.emit(this.WeekselectArr);
        }
    }

}
