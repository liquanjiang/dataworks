import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';

declare var $: any;

@Component({
    selector: 'app-work-tree',
    templateUrl: './work-tree.component.html',
    styleUrls: ['./work-tree.component.css']
})
export class WorkTreeComponent implements OnInit {
    @Output() querydirPK: EventEmitter<any> = new EventEmitter<any>();
    @Output() treeNode: EventEmitter<any> = new EventEmitter<any>();
    @Output() rootNode: EventEmitter<any> = new EventEmitter<any>();
    zTreeObj; // 存放组件的zTree对象
    dataztreeNodes;  // 存放当前数据集类型的数据节点
    copyztreeNodes;  // 存放当前复制弹出层的树的数据节点
    copyTreePK;  // 存放复制弹出层的树的选中目录节点的pk
    copyTaskPK;  // 存放复制任务对象的pk
    copyTaskName; // 存放复制任务对象的name
    oldName;
    showCopyTree = false; // 存放是否显示复制目录树
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
    user = {  // 存放当前操作的用户的信息
        userName: '',
        userCaption: ''
    };

    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
        this.initAllzTree();
        this.user.userName = window.sessionStorage.getItem('userName');
        this.user.userCaption = window.sessionStorage.getItem('userCaption');
    }

    // 点击头部选中根目录
    checkRootNode() {
        this.zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        this.zTreeObj.expandAll(false); // 折叠全部节点
    }

    // 点击新建文件夹
    newFolder() {
        const zTree = this.zTreeObj;
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
            Util.showMessage('不能在作业下新建目录或任务', 'warning');
            return false;
        }
        this.apiService.addWorkFolder(newFolder).then(res => {
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
                this.querydirPK.emit('folder');
            } else {
                Util.showMessage(res.msg, 'error');
            }
        }).catch(function () {
            Util.showMessage('新增失败', 'error');
        });
    }

    // 新建作业
    addJob() {
        const userInfo = this.user.userCaption;
        const zTree = this.zTreeObj;
        const node = zTree.getSelectedNodes()[0];
        const Arr = zTree.getNodes();
        const children = node ? node.children : Arr;
        const str = '新建作业';
        const name = children ? Util.getDifName(str, children) : str;
        const newWork = {
            jobName: name,
            pkDir: node ? node.pk : null,
            tasks: {},
            user: userInfo
        };
        if (node && node.type === 1) { // 在非根目录下新建作业，需要校验目标类型是否为目录
            Util.showMessage('不能在作业下新建目录或作业', 'warning');
            return false;
        }
        this.apiService.addWork(newWork).then(res => {
            if (res.code === 200) {
                const data = res.data;
                const newWorkNode = {
                    create_time: data.create_time ? data.create_time : '',
                    create_user: data.create_user ? data.create_user : '',
                    modify_user: data.modify_user ? data.modify_user : '',
                    ts: data.ts ? data.ts : '',
                    name: data.jobName,
                    pk: data.pk,
                    type: 1,
                    isParent: false,
                    iconSkin: 'taskIcon'
                };
                const parentNode = node ? node : null;
                const newNodes = zTree.addNodes(parentNode, 0, newWorkNode);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                this.querydirPK.emit(newNode.pk);
                this.treeNode.emit(newNode);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 删除目录或作业
    deleteFolder(treeNode) {
        const pk = treeNode.pk;
        if (treeNode.type === 0) {  // 删除类型为目录
            this.apiService.deleteWorkFolder(pk).then((res) => {
                if (res.code === 200) {
                    Util.showMessage('删除成功', 'success');
                    this.afterDelete(treeNode);
                } else {
                    Util.showMessage('删除失败' + res.msg, 'error');
                }
            });
        }

    }

    // 删除目录或作业后的操作，从ztree删除节点
    afterDelete(treeNode) {
        const parentNode = this.zTreeObj.getNodeByParam('pk', treeNode.pkParent);
        this.zTreeObj.removeNode(treeNode, true);
        if (!parentNode) {
            this.checkRootNode();
        } else {
            this.zTreeObj.selectNode(parentNode);
        }

    }

    // 构建zTrees
    initAllzTree() {
        const that = this;
        that.apiService.loadWorkTree().then(res => {
            if (res.code === 200) {
                that.dataztreeNodes = this.addIcon(null, res.data);
                that.copyztreeNodes = Util.ArrayFilter(that.dataztreeNodes, 'type', 0);
                this.zTreeObj = $.fn.zTree.getZTreeObj('dataTreeID');
                setTimeout(() => {
                    that.checkRootNode();
                }, 50);
            } else {
                Util.showMessage(res.msg, 'error');
            }

        });
    }

    // 每次复制之前重新加载copytree
    reloadCopyTree() {
        const that = this;
        that.apiService.loadWorkTree().then(res => {
            const arr = this.addIcon(null, res.data);
            that.copyztreeNodes = Util.ArrayFilter(arr, 'type', 0);
            this.showCopyTree = true;
            $('#copyTask').modal('show');
        });
    }

    beforeClick() {
        const that = this;
        return (zTree, treeId, treeNode) => {
            that.treeNode.emit(treeNode);
            const pk = treeNode.pk;
            if (treeNode.type === 1) { // 当点击的树节点类型为作业时，触发右侧菜单的变化
                that.querydirPK.emit(pk);
            } else {
                that.querydirPK.emit('folder');
            }
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
                    if (treeNode.type === 0) { // 重命名目录
                        const obj = {
                            name: name,
                            pkDir: treeNode.pk
                        };
                        api.modifyWorkFolder(obj).then((res) => {
                            if (res.code !== 200) {
                                treeNode.name = that.oldName;
                                zTree.editName(treeNode);
                                Util.showMessage('重命名失败', 'error');
                            } else {
                                Util.showMessage('重命名成功', 'success');
                            }
                        });
                    } else { // 重命名作业
                        const userInfo = this.user.userCaption;
                        const obj = {
                            jobName: name,
                            pkJob: treeNode.pk,
                            user: userInfo
                        };
                        api.modifyWorkName(obj).then((res) => {
                            if (res.code !== 200) {
                                treeNode.name = that.oldName;
                                zTree.editName(treeNode);
                                Util.showMessage('重命名失败', 'error');
                            } else {
                                this.rootNode.emit(treeNode.pk);
                                Util.showMessage('重命名成功', 'success');
                            }
                        });
                    }

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
                const pk = treeNode.pk;
                if (treeNode.type === 0) { // 删除目录
                    this.apiService.confirmDeleteWorkFolder(pk).then((res) => {
                        if (res.code === 200) {
                            if (res.msg === '1') { // 无子目录和作业
                                Util.showConfirm('确定要删除吗?', () => {
                                    that.deleteFolder(treeNode);
                                }, () => {
                                });
                            } else if (res.msg === '3') {  // 目录下有作业
                                Util.showConfirm('该目录下有作业，确定要删除吗?', () => {
                                    that.deleteFolder(treeNode);
                                }, () => {
                                });
                            } else if (res.msg === '2') {  // 目录下有子目录
                                Util.showConfirm('该目录下有子目录，确定要删除吗?', () => {
                                    that.deleteFolder(treeNode);
                                }, () => {
                                });
                            }
                        } else {
                            Util.showMessage(res.msg, 'error');
                        }
                    });
                } else { // 删除作业
                    Util.showConfirm('确定要删除吗？', () => {
                        this.apiService.deleteWork(pk).then((res) => {
                            if (res.code === 200) {
                                Util.showMessage('删除成功', 'success');
                                this.afterDelete(treeNode);
                                this.querydirPK.emit('folder');
                            } else {
                                Util.showMessage('删除失败' + res.msg, 'error');
                            }
                        });
                    }, () => {
                    });
                }
                return false;
            }

            if (ev.target.id === 'copy') {
                this.copyTaskPK = treeNode.pk;
                this.copyTaskName = treeNode.name;
                this.copyTreePK = null;
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
        this.showCopyTree = false;
        $('copyTask').modal('hide');
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
        if (!dir) {
            Util.showMessage('请选择目标目录', 'warning');
            return false;
        }
        const userInfo = this.user.userCaption;
        const data = {
            pkJob: pk,
            pkDir: dir === 'root' ? null : dir,
            name: '',
            user: userInfo
        };
        // 检验目标目录下是否有重名的任务，并修改复制的任务名
        const zTree = $.fn.zTree.getZTreeObj('dataTreeID');
        let parentNode;
        if (data.pkDir) { // 选中的不是根目录，
            const nodes = zTree.getNodesByParam('pk', data.pkDir, null);
            parentNode = nodes[0];
            const children = nodes[0].children;
            if (!children || children.length === 0) { // 该目录下没有任务，
                data.name = name + 'copy';
            } else {
                const namecopy = name + 'copy';
                data.name = Util.getDifTaskName(namecopy, children);
            }
        } else {
            parentNode = null;
            const arr = Util.BigArrayFilter(this.dataztreeNodes, 'pkParent', null, 'type', 1);
            if (arr.length === 0) {
                data.name = name + 'copy';
            } else {
                const namecopy = name + 'copy';
                data.name = Util.getDifTaskName(namecopy, arr);
            }
        }
        this.apiService.copyWork(data).then((res) => {
            if (res.code === 200) {
                Util.showMessage('复制成功', 'success');
                const obj = res.data;
                const newWorkNode = {
                    create_time: obj.create_time ? obj.create_time : '',
                    create_user: obj.create_user ? obj.create_user : '',
                    modify_user: obj.modify_user ? obj.modify_user : '',
                    ts: obj.ts ? obj.ts : '',
                    name: obj.jobName,
                    pk: obj.pk,
                    type: 1,
                    isParent: false,
                    iconSkin: 'taskIcon'
                };
                const newNodes = zTree.addNodes(parentNode, 0, newWorkNode);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                this.querydirPK.emit(newNode.pk);
                this.treeNode.emit(newNode);
            } else {
                Util.showMessage('复制失败' + res.msg, 'error');
            }
            $('#copyTask').modal('hide');
        });
    }
}
