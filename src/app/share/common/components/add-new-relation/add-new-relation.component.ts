import { Component, EventEmitter, Input, OnInit, Output, OnDestroy } from '@angular/core';
import { ApiService } from '../../../api.service';
import Util from '../../util';
import * as _ from 'lodash';

@Component({
    selector: 'app-add-new-relation',
    templateUrl: './add-new-relation.component.html',
    styleUrls: ['./add-new-relation.component.css']
})
export class AddNewRelationComponent implements OnInit, OnDestroy {
    @Input() columnObj; // 存放输入的字段的详细信息
    @Output() closeAdd: EventEmitter<any> = new EventEmitter<any>();
    @Output() addSuccess: EventEmitter<any> = new EventEmitter<any>();
    relationColumns = [
        {
            destColumnName: '',
            path: 'aaa',
            destColumnPk: '',
            schemaPk: '',
            destTableName: '',
            namespace: '',
            destTablePk: '',
            schemaName: ''
        }
    ];
    showSchemaApp = [];
    showTableApp = [];
    showColumnApp = [];
    schemasName = []; // 存放被选中的数据库的信息
    tablesName = []; // 存放被选中的表的信息
    columnsName = []; // 存放被选中的字段的信息
    SchemasArr = []; // 存放所有的数据源列表
    TablesArr = []; // 某个数据源下所有表的列表
    ColumnsArr = []; // 某个表下的所有字段的列表
    ColumnFilterArr = []; // 需要过滤掉的字段，指的是采集生成的关联关系，在可选字段中需要过滤掉
    TableFilterArr = []; // 表的字段不能再和本身这张表的字段有关联关系

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.hidePullDown();
        this.getRelation();
        this.getAllSchemas();
        this.TableFilterArr.push(this.columnObj.pk)
    }

    ngOnDestroy() {
        $(window).off('click');
    }

    // 获取所有的数据源列表
    getAllSchemas() {
        this.apiservice.getAllSchemas().then((res) => {
            if (res.code === 200) {
                this.SchemasArr = res.data;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 根据数据源加载所有的Tables信息
    getAllTables(pk) {
        return this.apiservice.getTablesBySchema(pk);
    }

    // 根据选中的表信息，加载所有的字段
    getAllColumns(pk) {
        return this.apiservice.getColumnsByTable(pk);
    }

    // 根据输入的字段的详细信息，获取当前字段的所有影响关系
    getRelation() {
        const obj = this.columnObj;
        this.apiservice.getColumnRelationShip(obj).then((res) => {
            if (res.code === 200) {
                this.relationColumns = res.data;
                this.InitRelation();
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 初始化原有的影响关系信息
    InitRelation() {
        const arr = this.relationColumns;
        const len = arr.length;
        for (let i = 0; i < len; i++) {
            if (arr[i].path) {
                this.ColumnFilterArr.push(arr[i].destColumnPk);
            }
        }
        if (len === 0) {
            this.addRelation();
        }
    }

    // 新增关联关系
    addRelation() {
        this.addColumn();
    }

    // 关闭窗口
    close() {
        this.closeAdd.emit('close');
    }

    // 窗口的确认按钮
    confirmAdd() {
        const relation = this.relationColumns;
        const len = relation.length;
        const flag = this.checkData();
        if (!flag) {
            return false;
        } else {
            const obj = {
                srcTablePk: this.columnObj.pk,
                srcColumn: this.columnObj.columnname,
                relations: null
            };
            const arr = [];
            for (let i = 0; i < len; i++) {
                const obja = {
                    destTablePk: relation[i].destTablePk,
                    destColumnPk: relation[i].destColumnPk,
                    path: relation[i].path ? relation[i].path : ''
                };
                arr.push(obja);
            }
            obj.relations = arr;
            this.apiservice.addRelation(obj).then((res) => {
                if (res.code === 200) {
                    Util.showMessage('保存成功', 'success');
                    this.addSuccess.emit('add');
                } else {
                    Util.showMessage(res.msg, 'error');
                }
            });
        }
    }

    // 校验数据格式
    checkData() {
        const relation = this.relationColumns;
        const len = relation.length;
        // 检验是否有空数据
        for (let i = 0; i < len; i++) {
            const re = relation[i];
            const num = i + 1;
            if (!re.schemaName || !re.schemaPk) {
                Util.showMessage('请选择第' + num + '条数据的数据源!', 'warning');
                return false;
            } else if (!re.destTableName || !re.destTablePk) {
                Util.showMessage('请选择第' + num + '条数据的数据表!', 'warning');
                return false;
            } else if (!re.destColumnName || !re.destColumnPk) {
                Util.showMessage('请选择第' + num + '条数据的字段!', 'warning');
                return false;
            }
        }

        // 检验是否有重复的数据
        const array = Util.DeleteArrRepeat(relation, 'destColumnPk');

        if (array.length !== relation.length) {
            Util.showMessage('添加的数据中有重复！', 'warning');
            return false;
        }
        return true;
    }

    // 切换是否显示数据库选择的下拉列表
    showSchemaApps(index, path) {
        if (path) {
            Util.showMessage('采集关联关系不可编辑', 'warning');
            return false;
        }
        this.hideSchemaApps();
        const array = this.showSchemaApp;
        array[index] = true;
    }

    // 切换是否显示数据表选择的下拉列表
    showTableApps(index, path) {
        if (path) {
            Util.showMessage('采集关联关系不可编辑', 'warning');
            return false;
        }
        this.hideTableApps();
        const array = this.showTableApp;
        array[index] = true;
    }

    // 切换是否显示字段选择的下拉列表
    showColumnApps(index, path) {
        if (path) {
            Util.showMessage('采集关联关系不可编辑', 'warning');
            return false;
        }
        this.hideColumnApps();
        const array = this.showColumnApp;
        array[index] = true;
    }

    // 隐藏所有数据库下拉列表
    hideSchemaApps() {
        const len = this.showSchemaApp.length;
        const array = this.showSchemaApp;
        for (let i = 0; i < len; i++) {
            array[i] = false;
        }
    }

    // 隐藏所有数据表下拉列表
    hideTableApps() {
        const len = this.showTableApp.length;
        const array = this.showTableApp;
        for (let i = 0; i < len; i++) {
            array[i] = false;
        }
    }

    // 隐藏所有字段下拉列表
    hideColumnApps() {
        const len = this.showColumnApp.length;
        const array = this.showColumnApp;
        for (let i = 0; i < len; i++) {
            array[i] = false;
        }
    }

    // 绑定下拉列表的隐藏事件
    hidePullDown() {
        const that = this;
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('.schema-app-div');
            const flag2 = $(obj).isChildAndSelfOf('.table-app-div');
            const flag3 = $(obj).isChildAndSelfOf('.column-app-div');
            if (!flag1) {
                that.hideSchemaApps();
            }
            if (!flag2) {
                that.hideTableApps();
            }
            if (!flag3) {
                that.hideColumnApps();
            }
        });
    }

    // 选中新的数据库
    selectSchema($event, index) {
        this.relationColumns[index].schemaName = $event.namespace + $event.name;
        this.relationColumns[index].schemaPk = $event.pk;
        this.hideSchemaApps();
        const pk = $event.pk;
        this.getAllTables(pk).then((res) => {
            if (res.code === 200) {
                this.TablesArr[index] = res.data;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 选中新的数据表
    selectTable($event, index) {
        const name = $event.name;
        const arr = this.tablesName;
        arr[index] = name;
        this.relationColumns[index].destTableName = $event.name;
        this.relationColumns[index].destTablePk = $event.pk;
        this.hideTableApps();
        const pk = $event.pk;
        this.getAllColumns(pk).then((res) => {
            if (res.code === 200) {
                this.ColumnsArr[index] = res.data;
            } else {
                Util.showMessage(res.msg, 'error');
            }
        });
    }

    // 选中新的字段
    selectColumnName($event, index) {
        const name = $event.name;
        const arr = this.columnsName;
        arr[index] = name;
        this.relationColumns[index].destColumnName = $event.name;
        this.relationColumns[index].destColumnPk = $event.pk;
        this.hideColumnApps();
    }

    // 添加字段
    addColumn() {
        const obj = {
            destColumnName: '',
            path: '',
            destColumnPk: '',
            schemaPk: '',
            destTableName: '',
            namespace: '',
            destTablePk: '',
            schemaName: ''
        };
        this.relationColumns.push(obj);
        this.showSchemaApp.push(false);
        this.showTableApp.push(false);
        this.showColumnApp.push(false);
        this.schemasName.push('');
        this.tablesName.push('');
        this.columnsName.push('');
        this.TablesArr.push([]);
        this.ColumnsArr.push([]);
    }

    // 删除字段
    delColumn(i) {
        const arr = this.relationColumns;
        arr.splice(i, 1);
        this.showSchemaApp.splice(i, 1);
        this.showTableApp.splice(i, 1);
        this.showColumnApp.splice(i, 1);
        this.schemasName.splice(i, 1);
        this.tablesName.splice(i, 1);
        this.columnsName.splice(i, 1);
        this.TablesArr.splice(i, 1);
        this.ColumnsArr.splice(i, 1);
    }

    // 根据relationColumns的长度，改变showSchemaApp;showTableApp;howColumnApp;的长度
    getLength() {
        const len = this.relationColumns.length;
        const arr = [];
        for (let i = 0; i < len; i++) {
            arr[i] = false;
        }
        this.showSchemaApp = arr;
        this.showTableApp = arr;
        this.showColumnApp = arr;
    }

}
