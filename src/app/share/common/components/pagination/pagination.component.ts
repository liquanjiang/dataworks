import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';

@Component({
    selector: 'app-pagination',
    templateUrl: './pagination.component.html',
    styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnInit, OnChanges {
    @Input() pager; // 输入属性，存放接口返回的有关分页的参数
    @Input() reportTheme; // 存放主题属性
    @Input() pageSizeArr; // 输入属性，存放分页大小select的选项，如未传递，则为 [10, 20, 50, 100]
    @Output() pageChange = new EventEmitter<any>(); // 向父组件传递翻页事件
    @Output() pageSizeChange = new EventEmitter<any>(); // 向父组件传递设置分页大小事件
    pagerIndexArr = [];
    pageSizeOpts; // 分页大小选项

    constructor() {
    }

    ngOnInit() {
        this.init();
    }

    ngOnChanges() {
        this.pager.pageIndex = this.pager.pageIndex ? this.pager.pageIndex : 1;
        this.pager.pageSize =  this.pager.pageSize ? this.pager.pageSize : 10;
        this.createIndexArr(this.pager.pageIndex);
    }

    // 创建分页数组
    createIndexArr(currentIndex: number): number[] {
        this.pager.pageCount = Math.ceil(this.pager.allRowCount / this.pager.pageSize);
        if (currentIndex > this.pager.pageCount) {
            this.pager.pageIndex = currentIndex = 1;
        }
        const currentPage = +currentIndex;
        const lastPage = +this.pager.pageCount;
        if (lastPage <= 10) {
            return this.pagerIndexArr = new Array(lastPage).fill('').map((v, i) => i + 1);
        }
        let result = [];
        if (currentPage <= 3) {
            result = [3, 4, 5, -1];
        } else if (currentPage === 4) {
            result = [3, 4, 5, 6, -1];
        } else if (currentPage === 5) {
            result = [3, 4, 5, 6, 7, -1];
        } else if (currentPage === lastPage - 4) {
            result = [-1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
        } else if (currentPage === lastPage - 3) {
            result = [-1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1];
        } else if (currentPage >= lastPage - 2) {
            result = [-1, lastPage - 4, lastPage - 3, lastPage - 2];
        } else {
            result = [-1, currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2, -1];
        }
        result = [1, 2].concat(...result);
        result = result.concat(lastPage - 1, lastPage);
        this.pagerIndexArr = result;
        return result;
    }

    // 翻页
    turnPage(pageNum) {
        pageNum = +pageNum;
        if (pageNum === this.pager.pageIndex || pageNum < 1 || pageNum > this.pager.pageCount) {
            return false;
        }
        const params = {
            pageSize: this.pager.pageSize,
            pageIndex: pageNum,
            allRowCount: this.pager.allRowCount
        };
        this.pager = params;
        this.createIndexArr(pageNum);
        this.pageChange.emit(params);
    }

    // 下一页
    nextPage() {
        const pageNum = parseInt(this.pager.pageIndex, 10) + 1;
        this.turnPage(pageNum);
    }

    // 上一页
    prePage() {
        const pageNum = parseInt(this.pager.pageIndex, 10) - 1;
        this.turnPage(pageNum);
    }

    // 设置分页大小
    setPageSize(pageSize) {
        pageSize = +pageSize;
        if (!pageSize) {
            return false;
        }
        this.pager.pageSize = pageSize;
        this.createIndexArr(this.pager.pageIndex);
        const params = {
            pageSize: this.pager.pageSize,
            pageIndex: this.pager.pageIndex,
            allRowCount: this.pager.allRowCount
        };
        this.pageSizeChange.emit(params);
    }

    init() {
        this.pager.pageIndex = this.pager.pageIndex ? this.pager.pageIndex : 1;
        this.pager.pageSize =  this.pager.pageSize ? this.pager.pageSize : 10;
        this.createIndexArr(this.pager.pageIndex);
        if (!!this.pageSizeArr) {
            // 如果父组件传递分页大小数组
            this.pageSizeOpts = this.pageSizeArr;
        } else {
            // 否则给默认值
            this.pageSizeOpts = [10, 20, 50, 100];
        }
    }
}
