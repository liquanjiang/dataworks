import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';
import { StreamSetsService } from '../../../../share/stream-sets/stream-sets.service';

declare var $: any;

@Component({
    selector: 'app-job-tree',
    templateUrl: './job-tree.component.html',
    styleUrls: ['./job-tree.component.css']
})
export class JobTreeComponent implements OnInit {
    @Output() querydirPK: EventEmitter<any> = new EventEmitter<any>();
    @Output() treeNode: EventEmitter<any> = new EventEmitter<any>();
    @Output() rootNode: EventEmitter<any> = new EventEmitter<any>();
    @Output() nameChange: EventEmitter<any> = new EventEmitter<any>();
    zTreeObj; // 存放组件的zTree对象
    dataztreeNodes;  // 存放当前数据集类型的数据节点
    copyztreeNodes;  // 存放当前复制弹出层的树的数据节点
    copyTreePK;  // 存放复制弹出层的树的选中目录节点的pk
    copyTaskPK;  // 存放复制任务对象的pk
    copyTaskName; // 存放复制任务对象的name
    oldName;
    showCopytree = false; // 是否显示复制目录树
    simpleData = {
        enable: true,
        idKey: 'pk',
        pIdKey: 'pkParent',
        rootPID: 'root'
    };

    addHoverDom = [
        {
            key: 'rename',
            value: '重命名',
            display: [0, 1],
            menukey: 'type'
        },
        {
            key: 'copy',
            value: '复制',
            display: [1],
            menukey: 'type'
        },
        {
            key: 'delete',
            value: '删除',
            display: [0, 1],
            menukey: 'type'
        }];

    constructor(private apiService: ApiService, private streamSetsService: StreamSetsService) {
    }

    ngOnInit() {
        this.initAllzTree();
    }

    // 点击头部选中根目录
    checkRootNode() {
        this.zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        this.zTreeObj.expandAll(false); // 折叠全部节点
        this.rootNode.emit('root');
        this.treeNode.emit('folder');
    }

    // 点击新建文件夹
    newFolder() {
        const zTree = this.zTreeObj;
        if (!zTree) {
            return false;
        }
        const node = zTree.getSelectedNodes()[0];
        const Arr = zTree.getNodes();
        const children = node ? node.children : Arr;
        const str = '新建目录';
        const name = children ? Util.getDifName(str, children) : str;
        const newFolder = {
            name: name,
            pkParent: node ? node.pk : null
        };
        if (node && node.type === 1) { // 在非根目录下新建任务，需要校验目标类型是否为目录
            Util.showMessage('不能在任务下新建目录或任务', 'warning');
            return false;
        }
        this.apiService.addTaskTreeFolder(newFolder).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const parentNode = node ? node : null;
                const newWorkDirNode = {
                    authDesc: null,
                    name: data.name,
                    pk: data.pk,
                    type: 0,
                    isParent: true,
                    iconSkin: 'folderIcon'
                };
                const newNodes = zTree.addNodes(parentNode, 0, newWorkDirNode);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                // this.querydirPK.emit(newNode.pk);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        }).catch(function () {
            Util.showMessage('新增失败', 'error');
        });
    }

    // 新建任务
    addJob() {
        const zTree = this.zTreeObj;
        if (!zTree) {
            return false;
        }
        const node = zTree.getSelectedNodes()[0];
        const Arr = zTree.getNodes();
        const children = node ? node.children : Arr;
        const str = '新建任务';
        const name = children ? Util.getDifName(str, children) : str;
        const newTask = {
            pkTask: null,
            name: name,
            pkDir: node ? node.pk : null,
            createUser: sessionStorage.getItem('userCaption')
        };
        if (node && node.type === 1) { // 在非根目录下新建任务，需要校验目标类型是否为目录
            Util.showMessage('不能在任务下新建目录或任务', 'warning');
            return false;
        }
        this.apiService.addTaskTreeTask(newTask).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const newTaskNode = {
                    authDesc: null,
                    name: data.name,
                    pk: data.pkTask,
                    type: 1,
                    isParent: false,
                    iconSkin: 'taskIcon'
                };
                const parentNode = node ? node : null;
                const newNodes = zTree.addNodes(parentNode, 0, newTaskNode);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                this.querydirPK.emit(newNode.pk);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        }).catch(() => {
            Util.showMessage('新增失败', 'error');
        });
    }

    // 删除文件夹或任务
    deleteFolder(treeNode) {
        const data = {
            kind: treeNode.type === 1 ? 'task' : 'dir',
            pk: treeNode.pk
        };
        this.apiService.deleteFolderOrTask(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('删除成功', 'success');
                const parentNode = this.zTreeObj.getNodeByParam('pk', treeNode.pkParent);
                this.zTreeObj.removeNode(treeNode, true);
                if (!parentNode) { // 如果该对象或目录没有父目录，则是在根目录下，选中根目录
                    this.checkRootNode();
                } else {
                    this.zTreeObj.selectNode(parentNode);
                    this.treeNode.emit('folder');
                }
            } else {
                Util.showMessage('删除失败' + res.msg, 'error');
            }
        });
    }

    // 构建zTrees
    initAllzTree() {
        const that = this;
        // 用于在点击父目录时进行展开和折叠
        that.apiService.getTaskTree().then(res => {
            if (res.code === 200) {
                that.dataztreeNodes = this.addIcon(null, res.data);
                that.copyztreeNodes = Util.ArrayFilter(that.dataztreeNodes, 'type', 0);
                if (that.dataztreeNodes.length > 0) {
                    this.zTreeObj = $.fn.zTree.getZTreeObj('dataTreeID');
                    setTimeout(() => {
                        that.checkRootNode();
                    }, 50);
                } else {
                    that.dataztreeNodes = [];
                    this.zTreeObj = $.fn.zTree.getZTreeObj('dataTreeID');
                }
            } else {
                Util.showMessage('获取数据失败' + res.msg, 'error');
            }
        });
    }

    // 每次复制之前重新加载copytree
    reloadCopyTree() {
        const that = this;
        that.apiService.getTaskTree().then(res => {
            const arr = this.addIcon(null, res.data);
            that.copyztreeNodes = Util.ArrayFilter(arr, 'type', 0);
            this.showCopytree = true;
            $('#copyTask').modal('show');
        });
    }

    beforeClick() {
        const that = this;
        return (zTree, treeId, treeNode) => {
            if (treeNode.type === 0) {
                that.treeNode.emit('folder');
            }
            const pk = treeNode.pk;
            if (treeNode.type === 1) { // 当点击的树节点类型为任务时，触发右侧菜单的变化
                that.querydirPK.emit(pk);
            }
            that.rootNode.emit('node');
            return true;
        };
    }

    // 复制弹出层树的点击事件
    copyTreebeforeClick() {
        const that = this;
        return (zTree, treeId, treeNode) => {
            that.copyTreePK = treeNode.pk;
            return true;
        };
    }

    // 重命名操作
    onRename() {
        const that = this;
        return (zTree, event, treeId, treeNode) => {
            const api = that.apiService;
            if (treeNode.name === '') {
                treeNode.name = that.oldName;
                zTree.editName(treeNode);
                Util.showMessage('名称不能为空', 'warning');
            } else if (treeNode.name === that.oldName) {
                return false;
            } else { // 判断是否重名
                const pkParent = treeNode.pkParent;
                const name = treeNode.name;
                const pk = treeNode.pk;
                let arr;
                if (!pkParent) { // 为根目录，判断是否有重名，数组为dataztreeNodes
                    arr = that.zTreeObj.getNodes();
                } else { // 不是根目录，判断是否有重命名，数组为其父节点的所有子节点
                    arr = that.zTreeObj.getNodesByParam('pkParent', pkParent);
                }
                const flag = Util.ifRaname(name, pk, arr);
                if (flag) {
                    Util.showMessage('该名称已存在', 'error');
                    treeNode.name = that.oldName;
                    zTree.editName(treeNode);
                    return false;
                } else {
                    const obj = {
                        name: name,
                        kind: treeNode.type === 1 ? 'task' : 'dir',
                        pk: treeNode.pk,
                        modifyUser: sessionStorage.getItem('userCaption')
                    };
                    api.editFolderOrTask(obj).then((res) => {
                        if (res.code !== 200) {
                            treeNode.name = that.oldName;
                            zTree.editName(treeNode);
                            Util.showMessage('重命名失败', 'error');
                        } else if (res.code === 200) {
                            this.nameChange.emit(name);
                            Util.showMessage('重命名成功', 'success');
                        }
                    });
                }
            }
        };
    }

    onHoverDomClick() {
        const that = this;
        return (treeObj, ev, treeId, treeNode) => {
            if (ev.target.id === 'rename') {
                treeObj.editName(treeNode);
                ev.target.parentElement.innerHTML = '';
                this.oldName = treeNode.name;
            }
            if (ev.target.id === 'delete') {
                const len = treeNode.children ? treeNode.children.length : 0;
                const pk = treeNode.pk;
                const type = treeNode.type;
                if (type === 0) { // 目标为目录，需要验证是否有任务或子目录
                    this.apiService.checkDir(pk).then((res) => {
                        if (res.code === 200) {
                            if (res.data === 1 || len > 0) { // 表示目录下有任务或子目录
                                Util.showConfirm('该目录下有内容，确定要删除吗?', () => {
                                    that.deleteFolder(treeNode);
                                }, () => {
                                });
                            } else { // 表示目录没有下有任务或子目录
                                Util.showConfirm('确定要删除吗?', () => {
                                    that.deleteFolder(treeNode);
                                }, () => {
                                });
                            }
                        } else {
                            Util.showMessage(res.msg, 'error');
                        }
                    });
                } else {
                    Util.showConfirm('确定要删除吗?', () => {
                        that.deleteFolder(treeNode);
                    }, () => {
                    });
                }
                return false;
            }

            if (ev.target.id === 'copy') {
                this.copyTaskPK = treeNode.pk;
                this.copyTaskName = treeNode.name;
                this.reloadCopyTree();
                return false;
            }
        };
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

    // 复制弹出层取消按钮
    Cancelcopy() {
        this.copyTreePK = null;
        this.showCopytree = false;
        $('#copyTask').modal('hide');
    }

    // 复制弹窗选中根目录
    selectCopyRoot() {
        const zTreeObj = $.fn.zTree.getZTreeObj('TreeID');
        zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        zTreeObj.expandAll(false); // 折叠全部节点
        this.copyTreePK = 'root';
    }

    // 复制弹出层确定按钮
    ConfirmCopy() {
        const dir = this.copyTreePK;
        const pk = this.copyTaskPK;
        const name = this.copyTaskName;
        if (!pk || !dir) {
            Util.showMessage('请选择复制任务和目标目录', 'warning');
            return false;
        }
        const data = {
            pk: pk,
            dir: dir === 'root' ? null : dir,
            taskName: '',
            createUser: sessionStorage.getItem('userCaption')
        };
        // 检验目标目录下是否有重名的任务，并修改复制的任务名
        const zTree = $.fn.zTree.getZTreeObj('dataTreeID');
        let parentNode;
        if (data.dir) { // 选中的不是根目录，
            const nodes = zTree.getNodesByParam('pk', data.dir, null);
            parentNode = nodes[0];
            const children = nodes[0].children;
            if (!children || children.length === 0) { // 该目录下没有任务，
                data.taskName = name + 'copy';
            } else {
                const namecopy = name + 'copy';
                data.taskName = Util.getDifTaskName(namecopy, children);
            }
        } else {
            parentNode = null;
            const arr = Util.BigArrayFilter(this.dataztreeNodes, 'pkParent', null, 'type', 1);
            if (arr.length === 0) {
                data.taskName = name + 'copy';
            } else {
                const namecopy = name + 'copy';
                data.taskName = Util.getDifTaskName(namecopy, arr);
            }
        }

        this.apiService.cotyTask(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('复制成功', 'success');
                // 生成新的节点，并插入到主列表树
                const newTaskNode = {
                    authDesc: null,
                    name: data.taskName,
                    pk: res.data,
                    type: 1,
                    isParent: false,
                    iconSkin: 'taskIcon'
                };
                const newNodes = zTree.addNodes(parentNode, 0, newTaskNode);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                this.querydirPK.emit(res.data);
            } else {
                Util.showMessage('复制失败' + res.msg, 'error');
            }
            $('#copyTask').modal('hide');
        });
    }

}
