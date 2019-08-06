import { Component, OnInit, Input, Output, EventEmitter, OnChanges, ElementRef } from '@angular/core';

@Component({
  selector: 'app-simple-select',
  templateUrl: './simple-select.component.html',
  styleUrls: ['./simple-select.component.css']
})
export class SimpleSelectComponent implements OnInit, OnChanges {

    /**
     * 选中的值
     */
    @Input() selectValue;

    /**
     * 下拉列表list
     */
    @Input() selectList;
    /**
     * 是否只读，默认为true
     */
    @Input() readonly = true;
    /**
     * 是否延迟显示，默认为false
     */
    @Input() lazyShow = false;

    /**
     * placeholder
     */
    @Input() placeholder = '';

    /**
     * multi
     */
    @Input() multi = false;

    /**
     * 当选中的值发生变化时触发此事件
     * @type {EventEmitter<any>}
     */
    @Output() selectValueChange: EventEmitter<any> = new EventEmitter<any>();

    /**
     * 当选中的值发生变化时触发此事件
     * @type {EventEmitter<any>}
     */
    @Output() selectListLoad: EventEmitter<any> = new EventEmitter<any>();

    /**
     * 下拉列表是否显示
     * @type {boolean}
     */
    selectListShow = false;
    selectValueName = '';
    originList;
    filterList;

    constructor(private elementRef: ElementRef) { }

    ngOnInit() {
        this.init();
    }

    ngOnChanges(changes) {
        if (changes.selectList) {
            this.init();
            if (this.selectListShow) {
                this.getListDom();
            }
        }
        if (changes.selectValue) {
            this.selectValueName = this.getSelectValue();
        }
    }


    init() {
        this.originList = this.selectList.map( (item) => {
            if (!item.name) {
                return {name: item, value: item};
            } else {
                return item;
            }
        });
        this.selectValueName = this.getSelectValue();
        this.filterList = this.originList;
    }

    /**
     * 获取当前选中的值的名称
     * @returns {any}
     */
    getSelectValue() {
        if (this.selectValue === undefined) {
            return '';
        }
        if (this.originList && this.originList.length > 0) {
            if (this.multi) {
                let returnNames = '';
                const selectValueArray = this.selectValue.split(',');
                for (let j = 0; j < selectValueArray.length; j++) {
                    const tempValue = selectValueArray[j];
                    let hasValue = false;
                    for (let i = 0; i < this.originList.length; i++) {
                        if (this.originList[i].value === tempValue) {
                            hasValue = true;
                            returnNames += this.originList[i].name + ',';
                        }
                    }
                    if (!hasValue) {
                        returnNames += tempValue + ',';
                    }
                }
                return returnNames.substring(0, returnNames.length - 1);
            } else {
                for (let i = 0; i < this.originList.length; i++) {
                    if (this.originList[i].value === this.selectValue) {
                        return this.originList[i].name;
                    }
                }
            }

        }
        return  this.selectValue;
    }

    setSelectValue(value) {
        this.selectValue = value;
        this.selectValueChange.emit(this.selectValue);
        // this.selectValueName = this.getSelectValue();
        if (value === '') {
            this.filterList = this.originList;
        } else {
            this.filterList = this.originList.filter( (item) => {
                if (this.multi) {
                    const currentValueArray = value.split(',');
                    const currentValue = currentValueArray[currentValueArray.length - 1];
                    if (currentValue === '') {
                        return true;
                    } else {
                        return !(item.value.toLowerCase().indexOf(currentValue.toLowerCase()) < 0);
                    }
                } else {
                    return !(item.value.toLowerCase().indexOf(value.toLowerCase()) < 0);
                }
            });
        }
        if (!this.selectListShow) {
            this.selectListShow = true;
            const ul = this.getSelectListDom(event);
            document.body.appendChild(ul);
        } else {
            this.refreshList();
        }
    }

    /**
     * 下拉列表显示和隐藏
     */
    selectListToggle(event) {
        if (document.querySelector('#simpleSelectList')) {
            document.querySelector('#simpleSelectList').remove();
            document.querySelector('.overlay-backdrop').remove();
        }
       this.selectListShow = !this.selectListShow;
        if (this.lazyShow) {
            this.selectListLoad.emit();
        } else {
            this.getListDom();
        }
    }

    getListDom() {
        if (this.selectListShow) {
            const ul = this.getSelectListDom(event);
            const div = document.createElement('div');
            div.className = 'overlay-backdrop';
            document.body.appendChild(div);
            document.body.appendChild(ul);
            const blurFunction = (e) => {
                const obj = $(e.srcElement || e.target);
                const flag = $(obj).closest('.simple-select').length > 0;
                const flagList = $(obj).closest('.simple-select-list').length > 0;
                if ((!flag)) {
                    if (flagList && this.multi) {
                        return false;
                    }
                    this.selectListShow = false;
                    this.filterList = this.originList;
                    if (document.querySelector('#simpleSelectList')) {
                        document.querySelector('#simpleSelectList').remove();
                        document.querySelector('.overlay-backdrop').remove();
                    }
                    $(div).off('click', blurFunction);
                    $(window).off('resize', resizeFunction);
                    // $(document.body).off('mousewheel');
                }
            };
            const resizeFunction = () => {
                if (document.querySelector('#simpleSelectList')) {
                    document.querySelector('#simpleSelectList').remove();
                    document.querySelector('.overlay-backdrop').remove();
                }
                this.getListDom();
            };
            $(div).on('click', blurFunction);
            $(window).on('resize', resizeFunction);
        }
    }

    /**
     * 选中的值变化
     * @param selectItem
     */
    selectChange(selectItem) {
        if (this.multi) {
            const selectValueArray = this.selectValue.split(',');
            if (selectValueArray.indexOf(selectItem.value) < 0) {
                selectValueArray.splice(selectValueArray.length - 1, 1, selectItem.value);
                this.selectValue = selectValueArray.join(',');
                this.selectValue += ',';
                this.filterList = this.originList;
            } else {
                const index = selectValueArray.indexOf(selectItem.value);
                selectValueArray.splice(index, 1);
                this.selectValue = selectValueArray.join(',');
            }
        } else {
            this.selectListShow = false;
            if (this.selectValue === selectItem.value) {
                return false;
            }
            this.selectValue = selectItem.value;
        }
        this.selectValueName = this.getSelectValue();
        this.selectValueChange.emit(this.selectValue);
    }

    getSelected(value) {
        if (this.multi) {
            const selectValueArray = this.selectValue.split(',');
            return !(selectValueArray.indexOf(value) < 0);
        } else {
            return value === this.selectValue;
        }
    }

    getSelectListDom(e) {
        const bounds = this.elementRef.nativeElement.children[0].getBoundingClientRect();
        const ul = document.createElement('ul');
        ul.id = 'simpleSelectList';
        ul.className = 'simple-select-list';
        ul.style.width = bounds.width + 'px';
        ul.style.left = bounds.left + 'px';
        const listHeight = this.filterList.length * 28;
        const listTop = bounds.bottom + (listHeight < 100 ? listHeight : 100);
        if (window.innerHeight > listTop) {
            ul.style.top = bounds.bottom + 'px';
        } else {
            ul.style.bottom = (window.innerHeight - bounds.top) + 'px';
        }
        for (let i = 0 ; i < this.filterList.length; i++) {
            const item = this.filterList[i];
            const hasSelected = this.getSelected(item.value);
            const li = document.createElement('li');
            li.className = hasSelected ? 'selected' : '';
            li.onclick = () => {
                this.selectChange(item);
                if (li.className.indexOf('selected') < 0) {
                    li.className = 'selected';
                } else {
                    li.className = '';
                }
                if (this.multi) {
                    const bg = li.querySelector('.checkbox-bg');
                    if (bg.className.indexOf('active') < 0) {
                        bg.className = 'checkbox-bg active';
                    } else {
                        bg.className = 'checkbox-bg';
                    }
                } else {
                    this.selectListShow = false;
                    document.querySelector('#simpleSelectList').remove();
                    document.querySelector('.overlay-backdrop').remove();
                }
            };
            if (this.multi) {
                const spanCheck = document.createElement('span');
                spanCheck.className = hasSelected ? 'checkbox-bg active' : 'checkbox-bg';
                li.appendChild(spanCheck);
            }
            const spanName = document.createElement('span');
            spanName.innerText = item.name;
            li.appendChild(spanName);
            ul.appendChild(li);
        }
        return ul;
    }

    refreshList() {
        const ul = document.getElementById('simpleSelectList');
        ul.innerHTML = '';
        for (let i = 0 ; i < this.filterList.length; i++) {
            const item = this.filterList[i];
            const hasSelected = this.getSelected(item.value);
            const li = document.createElement('li');
            li.className = hasSelected ? 'selected' : '';
            li.onclick = () => {
                this.selectChange(item);
                if (li.className.indexOf('selected') < 0) {
                    li.className = 'selected';
                } else {
                    li.className = '';
                }
                if (this.multi) {
                    const bg = li.querySelector('.checkbox-bg');
                    if (bg.className.indexOf('active') < 0) {
                        bg.className = 'checkbox-bg active';
                    } else {
                        bg.className = 'checkbox-bg';
                    }
                } else {
                    this.selectListShow = false;
                    this.filterList = this.originList;
                    document.querySelector('#simpleSelectList').remove();
                    document.querySelector('.overlay-backdrop').remove();
                }
            };
            if (this.multi) {
                const spanCheck = document.createElement('span');
                spanCheck.className = hasSelected ? 'checkbox-bg active' : 'checkbox-bg';
                li.appendChild(spanCheck);
            }
            const spanName = document.createElement('span');
            spanName.innerText = item.name;
            li.appendChild(spanName);
            ul.appendChild(li);
        }
    }
}
