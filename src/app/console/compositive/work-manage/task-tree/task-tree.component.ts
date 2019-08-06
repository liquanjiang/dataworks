import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';

@Component({
    selector: 'app-task-tree',
    templateUrl: './task-tree.component.html',
    styleUrls: ['./task-tree.component.css']
})
export class TaskTreeComponent implements OnInit {
    @Output() cancelSelectEmit: EventEmitter<any> = new EventEmitter<any>();
    @Output() SelectEmit: EventEmitter<any> = new EventEmitter<any>();
    @Output() SelectedFolder: EventEmitter<any> = new EventEmitter<any>();
    zTreeObj; // 存放组件的zTree对象
    dataztreeNodes;  // 存放当前数据集类型的数据节点
    copyztreeNodes;  // 存放当前复制弹出层的树的数据节点
    selectTreeNode = null; // 存放被选中的目录节点
    simpleData = {
        enable: true,
        idKey: 'pk',
        pIdKey: 'pkParent',
        rootPID: 'root'
    };
    TaskNodeArr = []; // 存放所有任务类型的树节点
    selectTaskNodeArr = []; // 存放被选中的目录下的所有任务

    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
        this.initAllzTree();
    }

    // 构建zTrees
    initAllzTree() {
        const that = this;
        // 用于在点击父目录时进行展开和折叠
        that.apiService.getTaskTree().then(res => {
            if (res.code === 200) {
                that.TaskNodeArr = Util.ArrayFilter(res.data, 'type', 1);
                that.dataztreeNodes = this.addIcon(null, res.data);
                that.copyztreeNodes = Util.ArrayFilter(that.dataztreeNodes, 'type', 0);
            } else {
                Util.showMessage('获取数据失败' + res.msg, 'error');
            }
        });
    }

    beforeClick() {
        const that = this;
        return (zTree, treeId, treeNode) => {
            that.selectTreeNode = treeNode;
            const pk = treeNode.pk;
            this.selectTaskNodeArr = Util.ArrayFilter(that.TaskNodeArr, 'pkParent', pk);
            this.SelectedFolder.emit(this.selectTreeNode);
            this.SelectEmit.emit(this.selectTaskNodeArr);
            this.cancelSelect();
            return true;
        };
    }

    // 选择根目录
    selectCopyRoot() {
        const that = this;
        const zTreeObj = $.fn.zTree.getZTreeObj('TaskTreeID');
        zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        zTreeObj.expandAll(false); // 折叠全部节点
        this.selectTreeNode = 'root';
        const arr = Util.ArrayFilter(that.TaskNodeArr, 'pkParent', '');
        this.selectTaskNodeArr = Util.ArrayFilter(that.TaskNodeArr, 'pkParent', null).concat(arr);
        this.SelectedFolder.emit(this.selectTreeNode);
        this.SelectEmit.emit(this.selectTaskNodeArr);
        this.cancelSelect();
    }

    // 复制弹出层取消按钮
    cancelSelect() {
        this.cancelSelectEmit.emit('close');
    }

    // 根据不同类型添加不同图标
    addIcon(rootUid, fileArray) {
        if (fileArray && fileArray.length > 0) {
            for (let i = 0; i < fileArray.length; i++) {
                fileArray[i].rootUid = rootUid;
                if (fileArray[i].type) {
                    if (fileArray[i].type === 0) {
                        fileArray[i].iconSkin = 'folderIcon';
                        fileArray[i].isParent = true;
                    } else if (fileArray[i].type === 1) {
                        fileArray[i].iconSkin = 'taskIcon';
                        fileArray[i].isParent = false;
                    }
                }
            }
        }
        return fileArray;
    }

    // 选中所有任务
    selectAllTask() {
        const zTreeObj = $.fn.zTree.getZTreeObj('TaskTreeID');
        zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        zTreeObj.expandAll(false); // 折叠全部节点
        this.selectTreeNode = 'ALL';
        this.selectTaskNodeArr = this.TaskNodeArr;
        this.SelectedFolder.emit(this.selectTreeNode);
        this.SelectEmit.emit(this.selectTaskNodeArr);
        this.cancelSelect();
    }

}
