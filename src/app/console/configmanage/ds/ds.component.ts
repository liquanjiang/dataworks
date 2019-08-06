import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild } from '@angular/core';
import Util from '../../../share/common/util';
import { ApiService } from '../../../share/api.service';
import * as _ from 'lodash';
import { NgYydatafinTableComponent } from 'ng-yydatafin';

declare var $: any;

@Component({
    selector: 'app-ds',
    templateUrl: './ds.component.html',
    styleUrls: ['./ds.component.css']
})
export class DsComponent implements OnInit, OnDestroy {
    @ViewChild('mainTable')
    private yyTable: NgYydatafinTableComponent;

    constructor(private apiservice: ApiService) {
    }

    tableColHeaders = ['名称', '类型', 'URL', '用户名', '操作'];
    tableColumns = [
        {
            data: 'dsname'
        },
        {
            data: 'dstype',
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = this.DSType[value][0];
                return td;
            }
        },
        {
            data: 'jdbc.url'
        },
        {
            data: 'jdbc.username'
        },
        {
            columnSorting: false,
            renderer: (instance, td, row, col, prop, value, cellProperties) => {
                td.innerHTML = '';
                const item = instance.getSourceDataAtRow(instance.toPhysicalRow(row));
                const table_edit = document.createElement('span');
                table_edit.className = 'table-edit table-span';
                table_edit.title = '编辑';
                table_edit.innerHTML = '<i class="icon iconfont icon-dw_edit"></i>';
                table_edit.addEventListener('click', () => {
                    this.ConfigEdit(item);
                });
                td.appendChild(table_edit);
                const table_delete = document.createElement('span');
                table_delete.className = 'table-delete table-span';
                table_delete.title = '删除';
                table_delete.innerHTML = '<i class="icon iconfont icon-dw_delete"></i>';
                table_delete.addEventListener('click', () => {
                    this.ConfigDelete(item);
                });
                td.appendChild(table_delete);
                return td;
            }
        }
    ];
    newConfig = { // 新增配置对象
        'dsname': '',
        'dstype': '',
        'jdbc.url': '',
        'jdbc.username': '',
        'jdbc.password': ''
    };

    newConfigUnit = { // 新增配置对象
        'dsname': '',
        'dstype': '',
        'jdbc.url': '',
        'jdbc.username': '',
        'jdbc.password': ''
    };

    editConfig = { // 修改配置对象
        'olddsname': '',
        'dsname': '',
        'dstype': '',
        'jdbc.url': '',
        'jdbc.username': '',
        'jdbc.password': ''
    };
    tableUrl = '';  // 存放主列表表格数据
    DSType = null; // 数据源类型数组，用来确定数据源类型的下拉框数据
    DSTypeArr = [];
    deleteObj = { dsname: null }; // 删除数据的pk参数对象
    showNewConfig = false; // 是否显示新增类型选择下拉项
    showEditConfig = false; // 是否显示新增类型选择下拉项
    EditOldName = null; // 存放修改数据源配置时的旧的数据源名称

    ngOnInit() {
        this.getAllDataSourceType().then(() => {
            this.getAlllist();
        });
    }

    ngOnDestroy() {
        $(window).off('resize').off('click');
    }

    // 获取预置的数据源类型的所有信息
    getAllDataSourceType() {
        return this.apiservice.getDSType().then(res => {
            if (res.code === 200) {
                this.DSType = res.data;
                const DSType = this.DSType;
                for (const k of Object.keys(DSType)) {
                    // 遍历对象，k即为key，obj[k]为当前k对应的值
                    const obj = {
                        key: DSType[k][0] ? DSType[k][0] : DSType[k],
                        url: DSType[k][1] ? DSType[k][1] : '',
                        value: k
                    };
                    this.DSTypeArr.push(obj);
                }
            } else {
                Util.showMessage('获取数据源类型失败', 'error');
            }
        });
    }

    // 新增配置
    addConfig() {
        this.newConfig = _.cloneDeep(this.newConfigUnit);
        $('#configModel').modal('show');
    }

    // 新增弹窗确认按钮
    ConfigManageAdd() {
        const that = this;
        const data = this.newConfig;
        // 校验数据格式
        const validate = this.validateData(data, false);
        if (!validate) {
            return false;
        } else {
            this.apiservice.addConfig(data).then(res => {
                if (res.code === 200) {
                    Util.showMessage('新增成功', 'success');
                    this.yyTable.getData();
                    this.CancelAdd();
                } else {
                    Util.showMessage('新增失败,' + res.msg, 'error');
                    this.CancelAdd();
                }
            }).catch(function () {
                Util.showMessage('新增失败', 'error');
                that.CancelAdd();
            });
        }
    }

    // 新增弹窗取消按钮
    CancelAdd() {
        this.newConfig = _.cloneDeep(this.newConfigUnit);
        $('#configModel').modal('hide');
    }

    // 点击表格编辑修改按钮
    ConfigEdit(item) {
        this.EditOldName = item.dsname;
        this.editConfig = _.cloneDeep(item);
        $('#EditconfigModel').modal('show');
    }

    // 编辑修改弹窗确定
    ConfigManageEidt() {
        this.editConfig.olddsname = this.EditOldName;
        const data = this.editConfig;
        // 校验数据格式
        const validate = this.validateData(data, true);
        if (!validate) {
            return false;
        } else {
            this.apiservice.editConfig(data).then(res => {
                if (res.code === 200) {
                    Util.showMessage('修改成功', 'success');
                    this.CancelEidt();
                    this.yyTable.getData();
                } else {
                    Util.showMessage('修改失败', 'error');
                    this.CancelEidt();
                }
            });
        }
    }

    // 修改修改弹窗取消
    CancelEidt() {
        this.EditOldName = null;
        $('#EditconfigModel').modal('hide');
    }

    // 点击表格中的删除按钮
    ConfigDelete(item) {
        this.deleteObj.dsname = item.dsname;
        $('#configDeleteModel').modal('show');
    }

    // 删除配置
    deleteConfig() {
        const data = this.deleteObj;
        this.apiservice.deleteConfig(data).then(res => {
            if (res.code === 200) {
                Util.showMessage('删除成功', 'success');
                this.yyTable.getData();
            } else {
                Util.showMessage('删除失败', 'error');
            }
        }).catch(function () {
            Util.showMessage('删除失败', 'error');
        });
    }

    // 校验新增或者修改的内容合法性
    validateData(config, bool) {
        const confValue0 = config['jdbc.url'];
        const confValue1 = config['jdbc.username'];
        const confValue2 = config['jdbc.password'];
        const dsName = config.dsname;
        const dsType = config.dstype;
        const canDo = function (a) {
            return a === '' || a === undefined || a === null;
        };
        if (canDo(dsName)) {
            Util.showMessage('名称不能为空！', 'warning');
            return false;
        } else if (canDo(dsType)) {
            Util.showMessage('请选择类型！', 'warning');
            return false;
        } else if (canDo(confValue0)) {
            Util.showMessage('URL不能为空！', 'warning');
            return false;
        } else if (canDo(confValue1)) {
            Util.showMessage('用户名不能为空！', 'warning');
            return false;
        } else if (canDo(confValue2)) {
            Util.showMessage('密码不能为空！', 'warning');
            return false;
        } else {
            return true;
        }
    }

    // 改变新增数据源的类型
    changenewConfig(item) {
        this.newConfig.dstype = item.value;
        this.newConfig['jdbc.url'] = item.url;
        this.hiddenAll();
    }

    // 改变修改数据源的类型
    changeeditConfig(item) {
        this.editConfig.dstype = item.value;
        if (!this.editConfig['jdbc.url']) {
            this.editConfig['jdbc.url'] = item.url;
        }
        this.hiddenAll();
    }

    // 隐藏所有
    hiddenAll() {
        this.showNewConfig = false;
        this.showEditConfig = false;
    }

    // 显示下拉选项
    showConfigUL(x) {
        const that = this;
        that.hiddenAll();
        if (x === 0) {
            this.showNewConfig = true;
        } else {
            this.showEditConfig = true;
        }
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
        $(window).off('click').on('click', function (e) {
            const obj = $(e.srcElement || e.target);
            const flag1 = $(obj).isChildAndSelfOf('#showEditConfig');
            const flag2 = $(obj).isChildAndSelfOf('.period-ul');
            const flag3 = $(obj).isChildAndSelfOf('#showNewConfig');
            const flag = flag1 || flag2 || flag3;
            if (!flag) {
                that.showNewConfig = false;
                that.showEditConfig = false;
            }
        });
    }

    // 搜索功能
    searchConfig() {

    }

    // 测试新增配置数据的链接
    testlink(data) {
        // 校验数据格式
        const validate = this.validateData(data, false);
        if (!validate) {
            return false;
        }
        this.apiservice.testUrlLink(data).then(res => {
            if (res.code === 200) {
                Util.showMessage('连接成功', 'success');
            } else {
                Util.showMessage('连接失败:' + res.msg, 'error');
            }
        }).catch(function (res) {
            Util.showMessage('测试出现错误' + res.msg, 'error');
        });
    }

    // 测试修改配置数据的链接
    testEditlink(data) {
        // 校验数据格式
        const validate = this.validateData(data, false);
        if (!validate) {
            return false;
        }
        this.apiservice.testUrlLink(data).then(res => {
            if (res.code === 200) {
                Util.showMessage('连接成功', 'success');
            } else {
                Util.showMessage('连接失败:' + res.msg, 'error');
            }
        }).catch(function (res) {
            Util.showMessage('测试出现错误' + res.msg, 'error');
        });
    }

    getAlllist() {
        this.tableUrl = 'dwb/configmanage/ds/show';
    }

    // 根据值返回关键字
    getKeyByValue(dstype, DSTypeArr) {
        if (!dstype) {
            return null;
        }
        return DSTypeArr[dstype][0];
    }
}
