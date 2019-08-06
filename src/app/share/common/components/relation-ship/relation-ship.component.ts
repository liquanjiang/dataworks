import { Component, Input, Output, OnInit, AfterViewInit, EventEmitter } from '@angular/core';
import { ApiService } from '../../../api.service';

declare var $: any;
declare var SQL: any;
declare var CreatSQLDesigner: any;

@Component({
    selector: 'app-relation-ship',
    templateUrl: './relation-ship.component.html',
    styleUrls: ['./relation-ship.component.css']
})
export class RelationShipComponent implements OnInit, AfterViewInit {
    @Input() querypk; // 表的pk
    @Input() Blood;  // 影响关系图或血缘关系图，true为血缘关系，false为影响关系
    @Input() name;  // 主表的名称
    @Output() addNewRelation: EventEmitter<any> = new EventEmitter<any>(); // 添加新的关联关系
    designerObj = null; // 存放designer对象

    constructor(private apiservice: ApiService) {
    }

    ngOnInit() {
        const sql = SQL;
        let d;
        if (typeof (sql.Designer) === 'function') {
            d = this.designerObj = new sql.Designer();
        } else {
            CreatSQLDesigner();
            d = this.designerObj = new sql.Designer();
        }
        if (!this.Blood) {
            this.renderRelationMap();
        } else {
            this.renderBloodMap();
        }

    }

    ngAfterViewInit() {
        $.fn.isChildAndSelfOf = function (b) {
            return (this.closest(b).length > 0);
        };
    }

    // 渲染影响关系图
    renderRelationMap() {
        const d = this.designerObj;
        const pk = this.querypk;
        this.apiservice.getMetaRelationShip(pk).then((res) => {
            const xml = res;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            d.io.fromXML(xmlDoc);
            this.selectMainTable();
        });
    }

    // 渲染血缘关系图
    renderBloodMap() {
        const d = this.designerObj;
        const pk = this.querypk;
        this.apiservice.getMetaBloodRelationShip(pk).then((res) => {
            const xml = res;
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            d.io.fromXML(xmlDoc);
            this.selectMainTable();
        });
    }

    // 选择主表并修改颜色
    selectMainTable() {
        const that = this;
        const tables = $('.schema-table');
        const theads = $('.schema-table thead');
        if (theads.length === 0) { // 如果当前没有影响关系或血缘关系，则表明不需要执行染色操作
            return false;
        }
        const tds = $('.schema-table thead tr td');
        const len = tds.length;
        let index = null;
        for (let i = 0; i < len; i++) {
            if (tds[i].innerHTML === this.name) { // 当前展示的表即为主表
                index = i;
            }
            if (tds[i].innerHTML.includes('.')) {
                $(tables[i])[0].classList.add('outTable');
                $(theads[i])[0].classList.add('out');
            }
        }
        $(tables[index])[0].classList.add('mainTable');
        $(theads[index])[0].classList.add('main');
        const adds = $('.add-relation');
        adds.on('click', function (e) {
            const columnname = e.target.nextSibling.textContent;
            const obj = {
                pk: that.querypk,
                name: that.name,
                columnname: columnname
            };
            that.addNewRelation.emit(obj);
        });
    }

}
