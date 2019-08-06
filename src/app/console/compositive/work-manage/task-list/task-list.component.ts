import { Component, OnInit, Output, Input, EventEmitter } from '@angular/core';
import Util from '../../../../share/common/util';
import { ApiService } from '../../../../share/api.service';


@Component({
    selector: 'app-task-list',
    templateUrl: './task-list.component.html',
    styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit {
    @Output() taskObj: EventEmitter<any> = new EventEmitter<any>();
    @Output() addTaskClick: EventEmitter<any> = new EventEmitter<any>();
    @Input() stageLibraries; // 存放右侧任务列表数组
    searchInput = '';
    showTree = false; // 是否显示筛选任务的下拉树
    selectedFolderName = '所有任务'; // 存放选中的目录名称，默认选中所有任务

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {

    }


    // 任务列表拖拽开始方法
    DragStart($event, item) {
        $event.dataTransfer.setData('text', JSON.stringify(item));
    }

    addTask($event, item) {
        this.addTaskClick.emit({
            options: {stage: item},
            $event: $event
        });
    }

    // 任务列表的搜索功能
    SearchTask(searchInput) {
        this.apiservice.loadTaskList(searchInput).then((res) => {
            if (res.code === 200) {
                const data = res.data;
                this.stageLibraries = this.TransformTreeArr2List(data);
            } else {
                Util.showMessage('获取任务列表失败', 'error');
            }
        });
    }

    showTreeModel() {
        this.showTree = true;
        const that = this;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag = $(obj).isChildAndSelfOf('.tree-pull');
            const flag2 = $(obj).isChildAndSelfOf('.tree-area');
            if (!flag && !flag2) {
                that.showTree = false;
            }
        });
    }

    hiddenTree() {
        this.showTree = false;
    }

    // 接受从目录树传来的信息
    changeTaskList($event) {
        this.stageLibraries = this.TransformTreeArr2List($event);
    }

    // 将任务树数组转化为可供拖拽列表使用的数组
    TransformTreeArr2List(TreeArr) {
        const len = TreeArr.length;
        const arr = [];
        for (let i = 0; i < len; i++) {
            const obj = {
                name: TreeArr[i].name,
                show: true,
                active: false,
                pk: TreeArr[i].pk
            };
            arr.push(obj);
        }
        return arr;
    }

    // 改变目录文件夹
    changeTaskFolder($event) {
        this.selectedFolderName = $event === 'root' ? '根目录' : ($event === 'ALL' ? '所有任务' : $event.name);
    }

}
