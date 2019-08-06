import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit } from '@angular/core';

declare var $: any;

@Component({
    selector: 'app-timeselector',
    templateUrl: './timeselector.component.html',
    styleUrls: ['./timeselector.component.css']
})
export class TimeselctorComponent implements OnInit, AfterViewInit {
    @Input() TimeInit;
    @Input() timeType;
    @Output() TimeSelected: EventEmitter<any> = new EventEmitter<any>();
    @Output() TimeCancel: EventEmitter<any> = new EventEmitter<any>();

    BaseArr = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09']; // 基础数组
    HourArr = [];    // 存放小时数组
    MinuteArr = [];  // 存放分钟数组
    SecondArr = [];  // 存放秒钟数组
    selectTime = null;

    constructor() {
    }

    ngOnInit() {
        this.getHourArr();
        this.getMinuteArr();
        this.selectTime = this.TimeInit;
    }

    ngAfterViewInit() {
        this.autoScroll();
    }

    // 生成小时数组
    getHourArr() {
        const arr = [];
        for (let i = 10; i < 24; i++) {
            arr.push(i.toString());
        }
        this.HourArr = this.BaseArr.concat(arr);
    }

    // 生成分钟数组和秒钟数组
    getMinuteArr() {
        const arr = [];
        for (let i = 10; i < 60; i++) {
            arr.push(i.toString());
        }
        this.MinuteArr = this.BaseArr.concat(arr);
        this.SecondArr = this.BaseArr.concat(arr);
    }

    // 选中小时数
    SeletHour(item) {
        this.selectTime.hour = item;
    }

    // 选中分钟数
    SeletMinute(item) {
        this.selectTime.minute = item;
    }

    // 选中小时数
    SeletSecond(item) {
        this.selectTime.second = item;
    }

    setTimeClear() {
        this.selectTime = {
            hour: '00',
            minute: '00',
            second: '00'
        };
        this.TimeSelected.emit(this.selectTime);
    }

    setTimeCancel() {
        this.TimeCancel.emit('cancel');
    }

    setTimeConfirm() {
        this.TimeSelected.emit(this.selectTime);
        this.setTimeCancel();
    }

    // 自动滚动到相应的数字
    autoScroll() {
        const time = this.selectTime;
        const hour = Math.floor(parseInt(time.hour, 10) * 24);
        const minute = Math.floor(parseInt(time.minute, 10) * 24);
        const second = Math.floor(parseInt(time.second, 10) * 24);
        const hourHeight = hour > 96 ? hour - 96 : hour;
        const minuteHeight = minute > 96 ? minute - 96 : minute;
        const secondHeight = second > 96 ? second - 96 : second;
        $('#hourdiv').scrollTop(hourHeight);
        $('#minutediv').scrollTop(minuteHeight);
        $('#seconddiv').scrollTop(secondHeight);
    }
}
