import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ApiService } from '../../../../share/api.service';
import Util from '../../../../share/common/util';
import * as _ from 'lodash';

declare var $: any;

@Component({
    selector: 'app-check-treemodel',
    templateUrl: './treemodel.component.html',
    styleUrls: ['./treemodel.component.css']
})
export class TreemodelComponent implements OnInit {
    @Output() querydirPK: EventEmitter<any> = new EventEmitter<any>();
    @Output() treeNode: EventEmitter<any> = new EventEmitter<any>();
    @Output() rootNode: EventEmitter<any> = new EventEmitter<any>();
    zTreeObj; // 存放组件的zTree对象
    dataztreeNodes;  // 存放当前数据集类型的数据节点
    oldName;
    simpleData = {
        enable: true,
        idKey: 'pkDir',
        pIdKey: 'pkParent',
        rootPID: 'root'
    };

    addHoverDom = [
        {
            key: 'rename',
            value: '重命名'
        },
        {
            key: 'delete',
            value: '删除'
        }];

    constructor(private apiService: ApiService) {
    }

    ngOnInit() {
        this.initAllzTree();
    }

    // 点击头部选中根目录
    checkRootNode() {
        this.zTreeObj.cancelSelectedNode();   // 先取消所有的选中状态
        this.zTreeObj.expandAll(false); // 折叠全部节点
        this.rootNode.emit('root');
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
            pkParent: node ? node.pkDir : null
        };
        this.apiService.updateCheckTree(newFolder).then(res => {
            if (res.code === 200) {
                const parentNode = node ? node : null;
                const newNodes = zTree.addNodes(parentNode, 0, res.data);
                const newNode = newNodes[0];
                zTree.editName(newNode);
                this.oldName = newNode.name;
                this.querydirPK.emit(newNode.pkDir);
                this.rootNode.emit(newNode.pkDir);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        }).catch(function () {
            Util.showMessage('新增失败', 'error');
        });
    }

    // 删除文件夹
    deleteFolder(treeNode) {
        this.apiService.deleteCheckFolder(treeNode.pkDir).then((res) => {
            if (res.code === 200) {
                Util.showMessage(res.msg, 'success');
                let parentNode = this.zTreeObj.getNodeByParam('pkDir', treeNode.pkParent);
                this.zTreeObj.removeNode(treeNode, true);
                if (!parentNode) {
                    parentNode = this.zTreeObj.getNodes()[0];
                }
                this.zTreeObj.selectNode(parentNode);
                this.treeNode.emit(parentNode);
                this.querydirPK.emit(parentNode.pkDir);
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 构建zTrees
    initAllzTree() {
        const that = this;
        // 用于在点击父目录时进行展开和折叠
        that.apiService.getCheckTree().then(res => {
            that.dataztreeNodes = res;
            if (that.dataztreeNodes.length >= 0) {
                this.zTreeObj = $.fn.zTree.getZTreeObj('dataTreeID');
                setTimeout(() => {
                    if (that.dataztreeNodes.length > 0) {
                        const currentNode = this.zTreeObj.getNodeByParam('pkDir', that.dataztreeNodes[0].pkDir);
                        this.zTreeObj.selectNode(currentNode);
                        that.treeNode.emit(currentNode);
                        const pk = currentNode.pkDir;
                        that.querydirPK.emit(pk);
                    } else {
                        that.rootNode.emit('root');
                    }
                }, 50);
            }
        });
    }

    beforeClick() {
        const that = this;
        return (zTree, treeId, treeNode) => {
            that.treeNode.emit(treeNode);
            const pk = treeNode.pkDir;
            that.querydirPK.emit(pk);
            that.rootNode.emit('node');
            return true;
        };
    }

    onRename() { // 重命名操作
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
                const pk = treeNode.pkDir;
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
                        pkDir: treeNode.pkDir,
                        pkParent: treeNode.pkParent
                    };
                    api.updateCheckTree(obj).then((res) => {
                        if (res.code !== 200) {
                            treeNode.name = that.oldName;
                            zTree.editName(treeNode);
                            Util.showMessage('重命名失败', 'error');
                        } else {
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
                const childNodes = treeObj.getNodesByParam('pkParent', treeNode.pk, null);
                const pk = treeNode.pkDir;
                that.apiService.ifCheckConfirmDel(pk).then((res) => {
                    if (res.code === 200) {
                        if (res.msg === '3') {
                            Util.showConfirm('该目录下有检核定义，确定要删除吗?', () => {
                                that.deleteFolder(treeNode);
                            }, () => {
                            });
                        } else if (res.msg === '2') {
                            Util.showConfirm('该目录下有目录，确定要删除吗?', () => {
                                that.deleteFolder(treeNode);
                            }, () => {
                            });
                        } else {
                            Util.showConfirm('确定要删除吗?', () => {
                                that.deleteFolder(treeNode);
                            }, () => {
                            });
                        }
                    } else {
                        Util.showMessage(res.msg, 'error');
                    }
                });

                return false;
            }
        };
    }
}
