import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import Util from '../../../../../share/common/util';
import { ApiService } from '../../../../../share/api.service';
import { RelationShipComponent } from '../../../../../share/common/components/relation-ship/relation-ship.component';

@Component({
    selector: 'app-childobj',
    templateUrl: './childobj.component.html',
    styleUrls: ['./childobj.component.css']
})
export class ChildobjComponent implements OnInit {
    @ViewChild('Relation')
    private relation: RelationShipComponent;
    @Input() querypk;
    @Input() metaType;
    @Input() preNameObj;
    @Output() back: EventEmitter<any> = new EventEmitter<any>();
    detailsColumnColHeaders = ['字段名称', '注释', '字段类型', '是否允许空', '采集时间'];
    detailsColumnColumns = [
        {
            data: 'meta_name'
        },
        {
            data: 'meta_comment'
        },
        {
            data: 'dataType'
        },
        {
            data: 'nullable'
        },
        {
            data: 'ts'
        }
    ];
    metaDetailData = {
        meta_name: '',
        meta_type: '',
        ts: '',
        namespace: '',
        sql: '',
        dataType: '',
        nullable: null,
        meta_comment: null
    };
    activeIndex = 0;
    tablist = [
        { name: '表', value: 'Table' },
        { name: '视图', value: 'View' },
        { name: '存储过程', value: 'Procedure' }
    ];
    ColumntableUrl = ''; // 存放当前的字段数组
    // 存放当前分页信息
    paramKey = '';
    param = {
        pk: '',
        metatype: ''
    };
    typeArr = Util.typeArr;
    relationPK = null; // 查询影响关系的pk
    bloodPK = null; // 查询血缘关系的pk
    PathArr = [];  // 存放路径字符串组成的数组
    showAddWindow = false; // 存放是否显示新增窗口
    addColumnObj = null; // 存放要传入添加关联关系子组件的字段信息

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        this.getMetaDetailsInfo();
    }

    // 获取当前查询的元数据信息
    getMetaDetailsInfo() {
        const pk = this.querypk;
        this.apiservice.getMetaQueryDetail(pk).then(res => {
            if (res.code === 200) {
                // 显示详情模块
                const data = res.data;
                this.metaDetailData = data;
                this.PathArr = this.getPathArr(data.namespace);
                const type = data.meta_type;
                this.tablist = this.getInfoByMetatype(type);
                const childrenType = data.childtype ? data.childtype[0] : '';
                const datapk = data.pk;
                if (childrenType) {
                    this.getMetaChildren(datapk, childrenType);
                }
            } else {
                Util.showMessage('获取数据失败' + res.msg, 'error');
            }
        });
    }

    // 根据主键查询子对象的信息
    getMetaChildren(datapk, childrenType) {
        this.paramKey = childrenType;
        this.ColumntableUrl = 'dwb/metamanage/query/childmetalist?pk='
            + datapk + '&metatype=' + childrenType;
    }

    // 返回查询详情列表页
    backToMetaDetails(toRoot) {
        this.back.emit(toRoot);
    }

    // 通过value获取key
    getkeyByvalue(value, arr) {
        const len = arr.length;
        if (!value || !arr || arr.length === 0) {
            return null;
        }
        for (let i = 0; i < len; i++) {
            if (value === arr[i].code) {
                return arr[i].name;
            }
        }
        return null;
    }

    // 根据元数据类型获取显示信息的种类
    getInfoByMetatype(metatype) {
        switch (metatype) {
            case 'Schema' :
                return [
                    { name: '表', value: 'Table' },
                    { name: '视图', value: 'View' },
                    { name: '存储过程', value: 'Procedure' }
                ];
            case 'Table' :
                return [
                    { name: '字段', value: 'Column' },
                    { name: '影响关系', value: 'relation' },
                    { name: '血缘关系', value: 'blood' }
                ];
            case 'View' :
                return [
                    { name: '字段', value: 'Column' }
                ];
            case 'Procedure' :
                return [];
            case 'Column' :
                return [];
            default:
                return [];
        }
    }

    // 切换table页
    Listtab(i, metaType, value) {
        this.activeIndex = i;
        const pk = this.querypk;
        if (value !== 'relation' && value !== 'blood') {
            this.getMetaChildren(pk, value);
        } else if (value === 'relation') {
            this.relationPK = pk;
        } else if (value === 'blood') {
            this.bloodPK = pk;
        }

    }

    // 根据英文返回汉字
    getCNbyEN(en) {
        switch (en) {
            case 'true' :
                return '是';
            case 'false':
                return '否';
        }
    }

    // 将路径分割成数组并分别展示
    getPathArr(str) {
        return Util.getArrByStr(str, '/');
    }

    // 添加新的关联关系
    addNewRelation($event) {
        this.addColumnObj = $event;
        this.showAdd();
    }

    // 显示遮罩和新增窗口
    showAdd() {
        this.showAddWindow = true;
        $('.zz').show();
        $('.add-zz').show();
        $('#addNewModel').show();
    }

    // 隐藏遮罩和新增窗口
    hideAdd() {
        this.showAddWindow = false;
        $('.zz').hide();
        $('.add-zz').hide();
        $('#addNewModel').hide();
    }

    // 添加或删除关联关系成功之后，重新绘图
    RedrawRelation($event) {
        this.hideAdd();
        this.relation.renderRelationMap();
    }
}
