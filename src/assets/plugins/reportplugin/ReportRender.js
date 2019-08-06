var ReportRender = (function () {

    var ReportRender = function () {

        this.eventListener = {};
        this.formatCellsModel = null; //模型全量
        this.container = null;  // handsontable容器
        this.filterCellInfo = []; //已筛选的单元格信息 row col areaId
        this.curSelectedCell = null;//当前选中单元格
        this.curSelectedRange = null;//当前选中区域
        this.handsontableData = null; // 填入handsontable的数据
        this.handsontableObj = null; //表格实例

        //冻结功能所需记录的字段
        this.cellsArray = null; //记录冻结前单元格数组
        this.rowHeaderArray = null;//记录冻结前行数组
        this.columnHeaderArray = null;//记录冻结前列数组
        this.freezingType = null;//记录冻结类型
        this.changeRowNum = 0;//冻结后改变数据的行数
        this.changeColNum = 0;//冻结后改变数据的列数
        this.areaCells = null;//记录冻结前合并单元格的数组
        this.freezingOperType = null;//冻结状态下,筛选或排序标记
        this.filterAreaCells = null; //冻结状态下,记录筛选或排序的合并单元格数组

        this.handsonProp = {
            CellFont: {
                FontStyle_Normal: 0,
                FontStyle_Bold: 1,
                FontStyle_Slope: 2,
                FontStyle_Bold_Slope: 3,
                FontStyle_UnderLine: 4
            },
            CellAlign: {
                Undefined: -2,
                AlignLeft: 2,
                AlignCenter: 0,
                AlignRight: 4,
                AlignTop: 1,
                AlignBottom: 3
            },
            CellOperationImag: {
                AscSort: 0,
                DescSort: 1,
                UnSort: 2,
                Filter: 3,
                Linkage: 4
            },
            defaultColHeaderWidth: 50,//默认列头宽
            defaultColWidth: 71, //默认列宽
            defaultRowHeight: 23, //最小行高
            //设置为0,为了能在设计器设置行高--heyongg
//            defaultRowHeight:0, //最小行高
            defaultMinRowNum: 50,  //默认最少行数
            isShowRowHeaders: true
        };
    };


//-----------------------------------动态计算补充行列数----------------------------------------------------------------
    ReportRender.prototype.calcRealProp = function () {
        var arr = this.calcRealColPop();
        //补充行
        if (this.handsontableData.length < this.handsonProp.defaultMinRowNum) {
            this.handsontableData.length = this.handsonProp.defaultMinRowNum;
        }
        return arr;
    };


    //计算补充后的列数，列宽和stretch属性
    ReportRender.prototype.calcRealColPop = function () { //calcRealColPop

        var originalColWidthsArray = this.formatCellsModel.columnHeader ? this.formatCellsModel.columnHeader.headerArray.slice(0, this.handsontableData[ 0 ].length) : [];

        //表格应占宽度
        //var handsontableWidth = $('.preview-body').width() - ($('.preview-search-template').is(':visible')? 180 : 0);
        var handsontableWidth = $(this.container.parentNode).width();
        //目前表格宽度
        // var tableWidth = eval(originalColWidthsArray.join('+'));
        var tableWidth = 0;
        //替换以上使用的eval方法
        for (var ii = 0; ii < originalColWidthsArray.length; ii++) {
            var tmp = originalColWidthsArray[ ii ];
            if ((typeof tmp === 'number') && !isNaN(tmp)) {
                tableWidth += tmp;
            } else {
                throw new Error('数据存在异常！');
            }
        }
        ;

        if (!tableWidth) {
            tableWidth = 0;
        }
        //显示表头，去掉表头宽度
        if (this.handsonProp.isShowRowHeaders) {
            tableWidth += this.handsonProp.defaultColHeaderWidth;
        }
        //计算补充区域的宽度
        var fillWith = handsontableWidth - tableWidth;
        //没有补充区域
        if (fillWith <= 0) {
            /* for(i=0;i< this.handsontableData.length;i++){
                 this.handsontableData[i].length = this.handsontableData[0].length;
             }*/
            return [ originalColWidthsArray/*,'none'*/ ];
        }
        //补充区域列宽固定值
        var fillColWidth = this.handsonProp.defaultColWidth;
        //计算需要补充列数，下取整
        var fillColNum = parseInt(fillWith / fillColWidth);
        var totalColNum = fillColNum + originalColWidthsArray.length;
        //保存补充各列宽的数组
        var fillColWidthArray = [];
        for (var i = 0; i < fillColNum; i++) {
            fillColWidthArray[ i ] = fillColWidth;
        }
        var colWidthsArray = originalColWidthsArray.concat(fillColWidthArray); //不能改变originalColWidthsArray
        //补充数据,遍历行，每行数据增长
        for (i = 0; i < this.handsontableData.length; i++) {
            if (this.handsontableData[ i ]) {
                this.handsontableData[ i ].length = totalColNum;
            }
        }
        //当出现水平滚动条时，即页面宽度小于实际填充数据总列宽，设置stretchH: 'last'会引起最后一列显示异常
        //var stretchH = totalColNum > originalColWidthsArray.length ? 'last' :'none';

        return [ colWidthsArray/*,stretchH*/ ];
    };

//-----------------------------------渲染报表入口----------------------------------------------------------
    ReportRender.prototype.renderReport = function (reponse, container, reportId) {
        if (!container) {
            return;
        }
        this.container = container;
        if (this.IS_IE()) {
            this.container.style.height = (this.container.clientHeight) + 'px';
        }
        if (!reponse || !reponse.DynamicModel) {
            reponse = {
                DynamicModel: [ { cellsArray: [ [] ] } ]
            };
        }
        this.CellsModel = new CellsModel(reponse);
        this.reportId = reportId;
        this.formatCellsModel = this.CellsModel.getFormatCellsModel();
        var data = this.CellsModel.getData();
        this.handsontableData = JSON.parse(JSON.stringify(data));
        this.createHandsonOption();

    };
    //handsontable需要动态计算的配置项
    ReportRender.prototype.getDynamicSettings = function () {
        //实际数据的行列数
        var colWidthsArray = this.formatCellsModel.columnHeader ? this.formatCellsModel.columnHeader.headerArray : [];
        //var stretchH = 'none';
        //显示表格线，需要重新计算列数、列宽、填充数据
        if (this.handsonProp.isShowCellLine) {
            var prop = this.calcRealProp();
            colWidthsArray = prop[ 0 ];
        }


        var rowHeight = this.handsonProp.defaultRowHeight;
        if (this.formatCellsModel.rowHeader && this.formatCellsModel.rowHeader.headerArray) {
            for (var i = 0; i < this.formatCellsModel.rowHeader.headerArray.length; i++) {
                var oneHeight = this.formatCellsModel.rowHeader.headerArray[ i ];
                if (oneHeight !== 0) {
                    oneHeight = oneHeight < this.handsonProp.defaultRowHeight ? (this.formatCellsModel.rowHeader.headerArray[ i ] = this.handsonProp.defaultRowHeight) : 0;
                }
            }
            rowHeight = this.formatCellsModel.rowHeader.headerArray;
        }
        var rowHeight = this.formatCellsModel.rowHeader.headerArray;
        return { 'colWidthsArray': colWidthsArray, 'rowHeight': rowHeight };
    };


    //准备handsontable配置
    ReportRender.prototype.createHandsonOption = function () {

        var self = this;
        var myRender = function (instance, td, row, col, prop, value, cellProperties) {

            self.renderCellFormat(instance, td, row, col, prop, value, cellProperties);
            self.renderCellExtFmt(instance, td, row, col, prop, value, cellProperties);
        };

        //-----------------------------formatCellsModel中未找到属性
        var isShowHeadersFlag = self.CellsModel.cellsModel.tableSetting.styleSet;

        //是否显示行头  列头
        this.handsonProp.isShowColHeaders = isShowHeadersFlag.showColHeader;
        this.handsonProp.isShowRowHeaders = isShowHeadersFlag.showRowHeader;
        //是否显示表格线
        this.handsonProp.isShowCellLine = true;
        //---------------------------------------end

        //handsontable需要动态计算的配置项
        var dynamicSettings = this.getDynamicSettings();
        var colWidthsArray = dynamicSettings.colWidthsArray;
        var dynamicRowHeight = dynamicSettings.rowHeight;
        var handsontableOption = {
            colHeaders: this.handsonProp.isShowColHeaders,
            rowHeaders: this.handsonProp.isShowRowHeaders,
            manualColumnResize: true,
            manualRowResize: true,
            fillHandle: false,
            // manualColumnResize:true,
            autoColumnSize: true,
            data: this.handsontableData, //更新数据需重新计算
            /* startCols:startColumn,  //This option is only has effect in Handsontable contructor and only if data option is not provided
             startRows:startRow,*/
            colWidths: colWidthsArray,//更新数据需重新计算
            rowHeights: dynamicRowHeight,//this.formatCellsModel.rowHeader ? this.formatCellsModel.rowHeader.headerArray:[],//更新数据需重新计算
            stretchH: 'last',
            outsideClickDeselects: false,
            persistentState: true, //turns on saving the state of column sorting ,column positions and column sizes in local storage
            readOnly: true,//只读，防止被delete 或backspace键删除文本内容
            //fragmentSelection:true,
            search: true,
            minSpareCols: 1,//最后永远多一列空白列
            // renderAllRows:true, //该属性影响性能吗?????????? 最后一列文字折行显示，快速拖拽最后一列时，出现下面部分单元格不渲染，添加该属性解决
            cells: function (row, col, prop) {
                this.renderer = myRender;
                this.editor = false;
            },
            beforeCopy: function(data, coords){
                for(var i = 0,len = data.length;i < len;i++){
                    for(var k = 0,len2 = data[i].length;k<len2;k++){
                        data[i][k] = data[i][k][0];
                    }
                }
            },
            mergeCells: this.CellsModel.calcMergeCells() // 更新数据需重新计算
        };
        this.handsontableObj = new Handsontable(this.container, handsontableOption);
        //修复报表设计器设置隐藏或者设置列宽为0,轻量报表预览无效果的bug--tqy
        this.handsontableObj.view.wt.wtSettings.update('defaultColumnWidth', 0);

//        Handsontable.hooks.add("modifyRowHeight",(function(height,row){
//        	var enabled = self.handsontableObj.getSettings().manualRowResize;
//        	if (enabled) {
//        	      var autoRowSizePlugin = this.hot.getPlugin('autoRowSize');
//        	      var autoRowHeightResult = autoRowSizePlugin ? autoRowSizePlugin.heights[row] : null;
//        	      row = this.hot.runHooks('modifyRow', row);
//        	      var manualRowHeight = this.manualRowHeights[row];
////        	      if (manualRowHeight !== void 0 && (manualRowHeight === autoRowHeightResult || manualRowHeight > (height || 0))) {
////        	        return manualRowHeight;
////        	      }
//        	      //修改 行方向 只能调大不能调小 问题
//        	      if (manualRowHeight !== void 0 && (manualRowHeight === autoRowHeightResult || manualRowHeight >  0)) {
//        	    	  if(manualRowHeight > this.handsonProp.defaultRowHeight){
//        	    		  return  manualRowHeight;
//        	    	  }
//        	    	  return this.handsonProp.defaultRowHeight;
//        	      }
//        	    }
//        	    return height;
//        }),self.handsontableObj);
        var onSelectedEnd = function (startRow, startCol, endRow, endCol) {
            if (!self.eventListener.changefilterBtnsState) {
                return;
            }
            //修正冻结后单元格 对应的坐标-tqy
            if (self.freezingType) {
                startRow += self.changeRowNum;
                startCol += self.changeColNum;
                endRow += self.changeRowNum;
                endCol += self.changeColNum;
            }

            var areaId = self.getCellAreaInfo(startRow, startCol);

            /*渲染有筛选的单元格时，将areaNum存在cellProperties中，此时取出，比重新计算areaNum 快吗？一般getCellAreaInfo的计算量很小，先重新获取
            var cellProp = self.handsontableObj.getCellMeta(startRow,startCol);
            if(!isNaN(cellProp.areaId )){
             areaId = cellProp.areaId;
            }else{
             areaId = self.getCellAreaInfo(startRow,startCol);
            }*/
            function setAllBtnsDisable() {
                // self.eventListener.setFilterBtnsDisable();
                // self.eventListener.changeSortBtnsState('disable');
                // self.eventListener.setLockBtnsDisable();
                // self.eventListener.changeLockBtnState("disable");
            };
            //如果该单元格不在有效扩展区域内，则所有按钮不可点击
            if (!areaId) {
                setAllBtnsDisable();
                return;
            }

            //没有内容的单元格在有效扩展区域，但不在有效字段区域，则筛选、排序按钮不可点击(常见自由报表等某些区域内的单元格是没有意义的单元格，而不是数值为空的单元格)
            var value = self.handsontableObj.getValue(startRow, startCol);
            if (!self.isCombineCell(areaId)) {

            }

            if (!self.isCombineCell(areaId) && (!value || !value[ 0 ])) {
                var fldArea = self.getCellFldArea(startRow, startCol, areaId);
                if (fldArea.length < 1) {
                    // self.eventListener.setFilterBtnsDisable();
                    self.eventListener.changeSortBtnsState('disable');
                    self.eventListener.changeLockBtnState('enable');
                    return;
                }
            }

            //选中一片区域，只有冻结可操作，选中一个单元格，所有操作均有效
            //选中一个合并单元格，该合并单元格跨行合并而不是跨列，也可以对该列进行筛选和排序
            if ((startRow === endRow && startCol === endCol && areaId
            ) || self.isMergeCell(startRow, startCol, endRow, endCol)) {
                var isFilter;
                self.curSelectedCell = new CurSelectedCells(startRow, startCol, areaId);
                //交叉表
                if (self.isCrossTable(areaId) && self.isDataCell(startRow, startCol, areaId)) {
                    self.eventListener.setfilterBtnsValid();
                } else if (self.isCrossTable(areaId) && self.isHeader(startRow, startCol, areaId)) {
                    isFilter = false;//false  该列未筛选
                    //如果与某一已经设置筛选的单元格，在同一区域，且同一列，则取消筛选生效
                    if (self.filterCellInfo.length > 0) {
                        for (var i = 0; i < self.filterCellInfo.length; i++) {
                            var cell = self.filterCellInfo[ i ];
                            if (cell.col === self.curSelectedCell.col && cell.areaId === self.curSelectedCell.areaId
                                && cell.row === self.curSelectedCell.row) {
                                self.eventListener.changefilterBtnsState('disable'); //设置筛选无效，取消筛选有效
                                isFilter = true;
                                break;
                            }
                        }
                    }
                    //如果该列未筛选过，则筛选生效
                    if (!isFilter) {
                        self.eventListener.changefilterBtnsState('enable');
                    }
                } else if (self.isInFreeTableDataRange(startRow, startCol, areaId)) {
                    //如果是自由表,则数据区域都可以点击筛选和取消筛选
                    self.eventListener.setfilterBtnsValid();
                }
                else {
                    isFilter = false;//false  该列未筛选
                    //如果与某一已经设置筛选的单元格，在同一区域，且同一列，则取消筛选生效
                    if (self.filterCellInfo.length > 0) {
                        for (var i = 0; i < self.filterCellInfo.length; i++) {
                            var cell = self.filterCellInfo[ i ];
                            if (cell.col === self.curSelectedCell.col && cell.areaId === self.curSelectedCell.areaId) {
                                self.eventListener.changefilterBtnsState('disable'); //设置筛选无效，取消筛选有效
                                isFilter = true;
                                break;
                            }
                        }
                    }
                    //如果该列未筛选过，则筛选生效
                    if (!isFilter) {
                        self.eventListener.changefilterBtnsState('enable');
                    }
                }
                self.eventListener.changeSortBtnsState('enable');
            }//end 选中一个单元格情况
            else { //否则选中多个单元格，或选中无效区域的单元格，或选中跨列合并的单元格，筛选、排序均无效
                //console.log('here?');
                // self.eventListener.setFilterBtnsDisable();
                self.eventListener.changeSortBtnsState('disable');
            }
            //如果该单元格所在区域为折叠显示，则排序按钮不可点击--jzf
            if (self.isCollapsibale(areaId)) {
                self.eventListener.changeSortBtnsState('disable');
            }
            self.curSelectedRange = [ startRow, startCol, endRow, endCol ];

            //冻结后,标题行未完整显示时,筛选和排序按钮均不可点击
            var areaData = self.getAreaData(areaId);
            if ((self.changeRowNum && self.changeRowNum > areaData.area[ 0 ]) || (self.changeColNum && self.changeColNum > areaData.area[ 1 ])) {
                // self.eventListener.setFilterBtnsDisable();
                self.eventListener.changeSortBtnsState('disable');
            }

            //如果area是组合区域时，即只有冻结功能可用
            if (self.isCombineCell(areaId)) {
                // self.eventListener.setFilterBtnsDisable();
                self.eventListener.changeSortBtnsState('disable');
            }
            self.eventListener.changeLockBtnState('enable');
        };
        // Handsontable.hooks.add('afterOnCellMouseDown',onCellClick,this.handsontableObj);
        // todo: 区域选择，筛选、冻结相关
        // Handsontable.hooks.add('afterSelectionEnd', onSelectedEnd, this.handsontableObj);
    };

    //render value formats contains align 、lineStyle 、fontStyle
    ReportRender.prototype.renderCellFormat = function (instance, td, row, col, prop, value, cellProperties) {

        // var params = [instance,td,row,col, prop, textvalue, cellProperties];
        //可防止渲染错位
        Handsontable.renderers.TextRenderer.apply(this, arguments);
        var textvalue = value;
        var curDrillRules = null;
        var curFormat = null;
        var iconvalue;
        if (!value) {
            textvalue = '';
        } else {
            textvalue = value[ 0 ];

            if (value[ 3 ] && value[ 3 ].drillRules) {
                curDrillRules = value[ 3 ].drillRules;
            }
            if (value[ 1 ] != null) {
                /*if(value[1].line){ //如果为Null单元格设置了边框，则value[1]中有Line对象
        //                    curFormat = {attachedLine:value[1].line};
                }else{*/
                var formats = this.formatCellsModel.DynamicModel[ 0 ].formats;
                curFormat = formats ? formats[ value[ 1 ] ] : null;
                /*}*/
            }
            // 如果值是图片标记"_icon_"，则根据reportI、row、col去请求图片
            if (textvalue == '_icon_') {
                iconvalue = textvalue;
                textvalue = '<img src="/report/rest/cellsimage/getImage/' +
                    this.reportId + '_' + row + ',' + col + '" />';
            }
        }
        //内容为null 的单元格只设置边线
        if (value === null) {
            this.renderCellLine(td, row, col, value, curFormat);
            return;
        }

        td.style.padding = 0;
        td.style.position = 'relative';
        td.style.paddingRight = '2px';

        var textDiv = CellsDivUtil.getChildNode(td, 'txt');
        if (!textDiv) {
            Handsontable.dom.empty(td);
            var textDiv = document.createElement('a');
            if (curDrillRules) {
                textDiv.className = 'cellTextLink';
                var self = this;
                textDiv.onclick = function (e) {
                    self.eventListener.onDrillClick(curDrillRules, $(textDiv).offset().left, $(textDiv).offset().top + $(textDiv).height(), row, col);
                };
            } else {
                textDiv.className = 'cellTextNormal';
            }
            textDiv.id = 'txt';

            // todo：图片样式是否符合需求
            // if(iconvalue == '_icon_' && curFormat && curFormat.align.expandImage == -2){
            //     textDiv.style.display = 'inline-block';
            //     textDiv.style.height = '100%';
            //     textvalue = '<img width="100%" height="100%" src="/report/rest/cellsimage/getImage/'+ this.reportId + '_' + row + ',' + col + '" />';
            // }

            textDiv.innerHTML = textvalue;
            td.appendChild(textDiv);
        } else {
            textDiv.innerHTML = textvalue; //else important! 否则出现显示错行
        }

        /*var self = this;
         textDiv.onclick = function(e){
         self.eventListener.onLinkageClick($(textDiv).offset().left,$(textDiv).offset().top + $(textDiv).height(),row,col);
         };*/

        //每个单元格都试图渲染其边框
        this.renderCellLine(td, row, col, value, curFormat);
        //有attachedLine的单元格只设置边线
        if (curFormat && !curFormat.attachedLine) {
            this.renderFormat(td,row, col, textDiv, textvalue, curFormat);
        }

    };

    ReportRender.prototype.renderFormat = function (td,row, col, textDiv, textvalue, format) {
        //有数据的单元格，渲染字体，对齐方式
        if (textvalue) {
            this.renderCellFont(textDiv, format.font);
            this.renderCellHAlign(textDiv, format.align, format.isData, td);
        }
        this.renderTdBgColor(td,row, col, format.font);
        this.renderCellVAlign(td, format.align, format.isData);
    };

    //render cell by extended format
    ReportRender.prototype.renderCellExtFmt = function (instance, td, row, col, prop, value, cellProperties) {
        this.renderCellCondFmt(instance, td, row, col, prop, value, cellProperties);
        this.renderCustomExtFormat(instance, td, row, col, prop, value, cellProperties);
    };


    //渲染表格边框
    ReportRender.prototype.renderCellLine = function (td, row, col, value, curFormat) {
        //不显示表格线 ，所有表格边线先去掉
        if (!this.handsonProp.isShowCellLine) {
            td.style.border = 'none';
        }
        var bottomCellFormatLine, rightCellFormatLine;
        var cellsArray = this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray;//所有单元格信息
        //取得本单元格正下方的单元格的边框信息
        if (row < cellsArray.length - 1 && cellsArray[ row + 1 ][ col ]) {
            var formatLineId = cellsArray[ row + 1 ][ col ][ 1 ];//得到边框信息的id值
            if (formatLineId) {
                bottomCellFormatLine = this.formatCellsModel.DynamicModel[ 0 ].formats[ formatLineId ];
            }
        }
        //取得本单元格右边的单元格的边框信息
        if (col < cellsArray[ 0 ].length - 1 && row < cellsArray.length && cellsArray[ row ][ col + 1 ]) {
            var formatLineId = cellsArray[ row ][ col + 1 ][ 1 ];//得到边框信息的id值
            if (formatLineId) {
                rightCellFormatLine = this.formatCellsModel.DynamicModel[ 0 ].formats[ formatLineId ];//得到边框信息
            }
        }
        var defaultLineColor = '#276fc0', defaultTitleColor = '#9eb6ce';
        if (curFormat && curFormat.line) {
            //本单元格定义了边框样式,进行渲染
            var cellLines = curFormat.line;//当前单元格边框信息
            //渲染下边框
            if (cellLines && cellLines.bottomLine && cellLines.bottomLine.bottomColor) {
                var color = cellLines.bottomLine.bottomColor;//边框颜色
                var size = cellLines.bottomLine.bottomWidth;//边框宽度
                if (color && size > 0) {
                    td.style.borderBottom = '' + size + 'px solid ' + color;
                }
                //如果正下方单元格有上边框样式,则显示该上边框样式
                if (bottomCellFormatLine && bottomCellFormatLine.line && bottomCellFormatLine.line.topLine.topColor
                    && color != defaultLineColor && bottomCellFormatLine.line.topLine.topColor != defaultTitleColor) {
                    td.style.borderBottom = '' + bottomCellFormatLine.line.topLine.topWidth
                        + 'px solid ' + bottomCellFormatLine.line.topLine.topColor;
                }
            }
            //渲染右边框
            if (cellLines && cellLines.rightLine && cellLines.rightLine.rightColor) {
                var color = cellLines.rightLine.rightColor;
                var size = cellLines.rightLine.rightWidth;
                if (color && size > 0) {
                    td.style.borderRight = '' + size + 'px solid ' + color;
                }
                //如果右边一列单元格有左边框样式,则显示该左边框样式
                if (rightCellFormatLine && rightCellFormatLine.line && rightCellFormatLine.line.leftLine.leftColor
                    && color != defaultLineColor && rightCellFormatLine.line.leftLine.leftColor != defaultTitleColor) {
                    td.style.borderRight = '' + rightCellFormatLine.line.leftLine.leftWidth
                        + 'px solid ' + rightCellFormatLine.line.leftLine.leftColor;
                }
            }
            //第0行的上边线要由本单元格自己加载
            if (row === 0 && cellLines && cellLines.topLine) {
                var color = cellLines.topLine.topColor;
                var size = cellLines.topLine.topWidth;
                if (color && size > 0) {
                    td.style.borderTop = '' + size + 'px solid ' + color;
                }
            }
            //第0列的左边线要由本单元格自己加载
            if (col === 0 && cellLines && cellLines.leftLine) {
                var color = cellLines.leftLine.leftColor;
                var size = cellLines.leftLine.leftWidth;
                if (color && size > 0) {
                    td.style.borderLeft = '' + size + 'px solid ' + color;
                }
            }
        } else {
            //如果正下方单元格有上边框样式,则显示该上边框样式
            if (bottomCellFormatLine && bottomCellFormatLine.line && bottomCellFormatLine.line.topLine.topColor) {
                td.style.borderBottom = '' + bottomCellFormatLine.line.topLine.topWidth
                    + 'px solid ' + bottomCellFormatLine.line.topLine.topColor;
            }
            //显示右边单元格的左边框样式
            if (rightCellFormatLine && rightCellFormatLine.line && rightCellFormatLine.line.leftLine.leftColor) {
                td.style.borderRight = '' + rightCellFormatLine.line.leftLine.leftWidth
                    + 'px solid ' + rightCellFormatLine.line.leftLine.leftColor;
            }
        }
    };

    ReportRender.prototype.renderCellCondFmt = function (instance, td, row, col, prop, value, cellProperties) {
        if (!value || !value[ 3 ] || !value[ 3 ].cond) {
            return;
        }
        for (var i = 0; i < value[ 3 ].cond.length; i++) {
            var condFmtArray = value[ 3 ].cond[ i ];

            var type = condFmtArray[ 0 ];
            var condFmt = condFmtArray[ 1 ];

            if (condFmt != undefined && condFmt != null) {
                var textDiv = CellsDivUtil.getChildNode(td, 'txt');
                var formats = this.formatCellsModel.DynamicModel[ 0 ].formats;
                var format = formats ? formats[ condFmt ] : null;
                if (format) {
                    this.renderFormat(td, row, col, textDiv, value, format);
                }
            }

            if (type == 'I') {
                this.renderCellCondIcon(instance, td, row, col, prop, value, cellProperties, condFmtArray);
            }
            if (type == 'D') {
                this.renderCellCondDataRope(instance, td, row, col, prop, value, cellProperties, condFmtArray);
            }
        }
    };

    //render cell which has an icon on the left of data
    ReportRender.prototype.renderCellCondIcon = function (instance, td, row, col, prop, value, cellProperties, condFmtArray) {
        var iconDiv = CellsDivUtil.getChildNode(td, 'condIcon'); //if cell contais childNode which id is 'condIcon',then return this childNode,else return null
        var iconBasePath = 'assets/imgs/report/';
        var iconSrc = iconBasePath + condFmtArray[ 2 ];
        if (iconDiv != null) {
            //TODO
            return;
        }

        var iconDiv = document.createElement('div');
        iconDiv.id = 'condIcon';
        iconDiv.className = 'cellCondIcon';
        iconDiv.style.backgroundImage = 'url(' + iconSrc + ')';
        var isDataOnly = condFmtArray[ 3 ];

        iconDiv.style.height = '20px';
        iconDiv.style.width = '22px';
        iconDiv.style.float = 'left';
        iconDiv.style.backgroundRepeat = 'no-repeat';
        /*var cellHeight = parseInt(instance.getRowHeight(row));
         var iconHeight = parseInt(iconDiv.style.height);
         var topMargin = parseInt((cellHeight-iconHeight)/2);
         iconDiv.style.marginTop = "3px";//topMargin+"px";*/

        var textDiv = CellsDivUtil.getChildNode(td, 'txt');

        if (textDiv) {
            textDiv.style.width = 'calc(100% - 22px)';
            if (isDataOnly) {
                textDiv.innerHTML = '';
            }
            td.insertBefore(iconDiv, textDiv);
        } else {
            td.appendChild(iconDiv);
        }
    };


    //render cell which has an gradient bar( the length is determined by business logic) on the left of data
    ReportRender.prototype.renderCellCondDataRope = function (instance, td, row, col, prop, value, cellProperties, condFmtArray) {
        var dRopeDiv = CellsDivUtil.getChildNode(td, 'condDataRope');
        if (dRopeDiv != null) {
            //TODO
            /*var rate = condFmtArray[2];
             var totalWidth = parseInt(cellDiv.style.width);
             var ropeWidth = totalWidth*rate;

             dRopeDiv.style.width = ropeWidth+"px";
             var ropeHeight = parseInt(cellDiv.clientHeight)-4;
             dRopeDiv.style.height = ropeHeight+"px";*/
            return;
        }
        var dRopeDiv = document.createElement('div');
        dRopeDiv.id = 'condDataRope';
        dRopeDiv.className = 'cellCondDataRope';

        var rate = condFmtArray[ 2 ];
        var color = condFmtArray[ 3 ];

        /*var totalWidth = parseInt(td.clientWidth);
         var totalWidth = parseInt(instance.getColWidth(col));
         var ropeWidth = totalWidth*rate;
         dRopeDiv.style.width = ropeWidth+"px";
         var ropeHeight =  parseInt(td.clientHeight) - 4;//parseInt(instance.getRowHeight(row))-4;*/
        dRopeDiv.style.height = '100%';//ropeHeight+"px";
        dRopeDiv.style.width = (rate * 100) + '%';

        if ('IE' === userBrowser()) {
            dRopeDiv.style.filter = 'progid:DXImageTransform.Microsoft.Gradient(gradientType=1,startColorStr=' + color + ',endColorStr=white);';
        }
        else if ('Chrome' === userBrowser() || 'Safari' === userBrowser()) {
            dRopeDiv.style.background = '-webkit-gradient(linear,left top, right bottom, from(' + color + '), to(white))';
        }
        else if ('FF' === userBrowser()) {
            dRopeDiv.style.background = '-moz-linear-gradient(left,' + color + ',white)';
        }

        var isDataOnly = condFmtArray[ 4 ];
        if (isDataOnly) {
            //TODO
            var textDiv = CellsDivUtil.getChildNode(cellDiv, 'txt');
            textDiv.innerHTML = '';
        }
        td.appendChild(dRopeDiv);
    };

    ReportRender.prototype.renderCellFont = function (textDiv, font) {

        if (!font || !textDiv) return;

        var fontName = font.fontName;
        textDiv.style.fontFamily = fontName;

        var fontStyle = font.fontStyle;
        if (fontStyle != null) {
            if (fontStyle == this.handsonProp.CellFont.FontStyle_Bold) {
                textDiv.style.fontWeight = 'bold';
            }
            else if (fontStyle == this.handsonProp.CellFont.FontStyle_Slope) {
                textDiv.style.fontStyle = 'italic';
            }
            else if (fontStyle == this.handsonProp.CellFont.FontStyle_Bold_Slope) {
                textDiv.style.fontWeight = 'bold';
                textDiv.style.fontStyle = 'italic';
            }
            else if (fontStyle == this.handsonProp.CellFont.FontStyle_UnderLine) {
                textDiv.style.textDecoration = 'underline';
            }
        }

        var fontSize = font.fontSize;
        if (fontSize > 0) {
            textDiv.style.fontSize = '' + fontSize + 'px';
            textDiv.style.lineHeight = '' + fontSize + 'px';
        }
        //处理扩展区域外的折行显示,未设置
        if (fontSize == -2) {
            textDiv.style.lineHeight = '21px';
        }

        // textDiv.style.paddingTop = "" + parseInt((textDivHeight - fontSize)/2) + 'px';

        var foreColor = font.foreColor;
        if (foreColor != null) {
            textDiv.style.color = foreColor;
        }
    };

    ReportRender.prototype.renderTdBgColor = function (td,row,col, font) {
        if (!font || !td) return;
        //数据隔行显示
        var areaId = this.getCellAreaInfo(row,col);
        var area = this.getAreaData(areaId);
        var startRow = this.getStartRow(areaId);
        var rowMIn = row-startRow;
        if(isNaN(rowMIn)||rowMIn<0||!area.sepreate){//表头或未设置隔行显示
            var bgColor = font.bgColor;
            if (bgColor) {
                td.style.backgroundColor = bgColor;
            }
        }else{
            if(rowMIn%2 === 1){//奇数行
                td.style.backgroundColor = area.sepreate;
            }else{//偶数行
                var bgColor = font.bgColor;
                if (bgColor) {
                    td.style.backgroundColor = bgColor;
                }
            }
        }
    };

    ReportRender.prototype.renderCellHAlign = function (textDiv, cellAlign, isData, td) {
        if (!cellAlign || !textDiv) return;

        var hAlign = cellAlign.hAlign;
        if (hAlign != null) {
            if (hAlign != this.handsonProp.CellAlign.Undefined) {
                if (hAlign == this.handsonProp.CellAlign.AlignLeft) {
                    td.style[ 'text-align' ] = 'left';
                    td.style.paddingLeft = '16px';
                }
                if (hAlign == this.handsonProp.CellAlign.AlignCenter) {
                    td.style[ 'text-align' ] = 'center';
                }
                else if (hAlign == this.handsonProp.CellAlign.AlignRight) {
                    td.style[ 'text-align' ] = 'right';
                    td.style.paddingRight = '16px';
                }
            }
            else if (isData) {
                td.style[ 'text-align' ] = 'right';
                td.style.paddingRight = '16px';
            }
            else {
                td.style[ 'text-align' ] = 'left';
                td.style.paddingLeft = '16px';
            }
        }

        if (textDiv != null) {
            if (cellAlign.fontFold == this.handsonProp.CellAlign.Undefined || !cellAlign.fontFold) {
                textDiv.style.whiteSpace = 'nowrap'; //不换行
                textDiv.style.textOverflow = 'ellipsis';
            }
            else {
                textDiv.style.wordBreak = 'break-all'; //允许在单词内换行
                //if(parseInt(textDiv.clientWidth ) > textDiv.clientWidth-5)
                //{
                //textDiv.style.left = "0px";
                //textDiv.style.top = "0px";
                textDiv.style.float = 'none';
                textDiv.style.display = 'block';
                textDiv.style.wordWrap = 'break-word';
                // textDiv.style.overflow = 'hidden';
                //}
            }
        }
        //更改列宽时更改字体大小
//      if(cellAlign.shrink && cellAlign.shrink != this.handsonProp.CellAlign.Undefined)
//      {
//          var length = td.clientWidth;
//          if(td.clientWidth < length)
//          {
//              var fontSize = parseInt(td.style.fontSize)*parseInt(td.clientWidth)/length;
//              fontSize = parseInt(fontSize);
//              if(fontSize > 0)
//              {
//                  td.style.fontSize = ""+fontSize+"px";
//              }
//          }

        //缩小字体填充,重新实现--tqy
        if (cellAlign.shrink && cellAlign.shrink != this.handsonProp.CellAlign.Undefined) {
            var textDivWidth = textDiv.offsetWidth;
            var tdWidth = td.offsetWidth;
            if (this.handsontableObj) {
                //拖动单元格大小时的缩小字体填充效果
                tdWidth = this.handsontableObj.view.wt.wtTable.getStretchedColumnWidth(this.handsontableObj.view.wt.wtTable.columnFilter.renderedToSource(td.cellIndex - this.handsontableObj.view.wt.getSetting('rowHeaders').length));
            }
            if (textDivWidth > tdWidth) {
                var shrinkNum = 1 / (textDivWidth / tdWidth);
                if (shrinkNum >= 1) {
                    return;
                }
                var div = document.createElement('div');
                td.appendChild(div);
                div.appendChild(textDiv);

                //兼容浏览器
                div.style.WebkitTransform = 'scale(' + shrinkNum + ')';
                div.style.WebkitTransformOrigin = 'left center';

                div.style.MozTransform = 'scale(' + shrinkNum + ')';
                div.style.MozTransformOrigin = 'left center';

                div.style.NsTransform = 'scale(' + shrinkNum + ')';
                div.style.NsTransformOrigin = 'left center';

                div.style.OTransform = 'scale(' + shrinkNum + ')';
                div.style.OTransformOrigin = 'left center';
            }
        }
    };

    ReportRender.prototype.renderCellVAlign = function (td, cellAlign, isData) {
        if (!cellAlign || !td) return;
        var vAlign = cellAlign.vAlign;
        td.style[ 'vertical-align' ] = 'middle';
        if (vAlign != null) {
            if (vAlign != this.handsonProp.CellAlign.Undefined) {
                if (vAlign == this.handsonProp.CellAlign.AlignTop) {
                    td.style[ 'vertical-align' ] = 'top';
                }
                if (vAlign == this.handsonProp.CellAlign.AlignCenter) {
                    td.style[ 'vertical-align' ] = 'middle';
                }
                else if (vAlign == this.handsonProp.CellAlign.AlignBottom) {
                    td.style[ 'vertical-align' ] = 'bottom';
                }
            }
            else {
                td.style[ 'vertical-align' ] = 'middle';
            }
        }
    };


    ReportRender.prototype.linkageRender = function (instance, td, row, col, prop, value, cellProperties) {
        var textvalue = value;
        if (value === null || value === '') {
            textvalue = '';
        } else {
            textvalue = value[ 0 ];
        }
        var params = [ instance, td, row, col, prop, textvalue, cellProperties ];
        Handsontable.renderers.getRenderer('base').apply(this, params);
        //TODO

    };
    //渲染筛选  排序 冻结操作
    ReportRender.prototype.renderCustomExtFormat = function (instance, td, row, col, prop, value, cellProperties) {
        if (!value || !value[ 3 ]) {
            return;
        }
        this.renderFilterIcon(instance, td, row, col, prop, value, cellProperties);
        this.renderSortIcon(instance, td, row, col, prop, value, cellProperties);
        this.renderLinkIcon(instance, td, row, col, prop, value, cellProperties);
        this.renderExpandInfo(instance, td, row, col, prop, value, cellProperties);
    };

    //渲染 链接头和内容
    ReportRender.prototype.renderLinkIcon = function (instance, td, row, col, prop, value, cellProperties) {
        if (value[ 3 ].drill_marker_src && !CellsDivUtil.getChildNode(CellsDivUtil.getChildNode(td, 'operaDiv'), 'link')) {
            console.log('渲染链接图标  当前单元格行列号：' + row + '  ' + col);
            this.renderCellRightDiv(td, 'drill_marker.png', 'link', row, col);
        }

    };
    //添加级次展开收缩信息
    //jzf添加组合区域时的级次显示效果(末尾)
    //增加 折叠显示/组合区域的级次显示的判断--tyq
    ReportRender.prototype.renderExpandInfo = function (instance, td, row, col, prop, value, cellProperties, cell, cellDiv) {
        var self = this;
        if (value[ 3 ] && value[ 3 ].is_collapse_val) {
            var cellExtFmt = value[ 3 ];
            var level = parseInt(cellExtFmt.key_expand_level);
            var src = cellExtFmt.key_expand_src;
            var top = (parseInt(td.clientHeight) - 16) / 2;
            var left = level * 6 + 4;
            var textDiv = CellsDivUtil.getChildNode(td, 'txt');
            if (src) {
                var imgId = 'expandIMG_' + row + '_' + col;
                var img = document.getElementById(imgId);
                var img_zIndex = 50;
                if (!img) {
                    img = document.createElement('img');
                    img.id = imgId;
                    img.onclick = function (e) {
//        				ReportExpand.eventNotify(this,cell);
                        if (self.eventListener.expandLinstener) {
                            console.log('here?');
                            //console.log('点击单元格筛选按钮，列号：' + col );
                            self.eventListener.expandLinstener(e, row, col);
                        }
                    };
                } else {
                    img_zIndex = $(img).parents('div:eq(3)').css('z-index');
                    img_zIndex = img_zIndex || img_zIndex === 'auto' ? 50 : parseInt(img_zIndex);
                }
                img.src = src;
                // img.style.position="relative";//"absolute";
                img.style.zIndex = 3;

                // 微调整，为了更好地布局，在展开收缩时，添加<div>wrap在td中--jzf
                var divWrapper = document.createElement('div');
                divWrapper.className = 'expand-wrapper';

                var td_zIndex = $(td).parents('div:eq(3)').css('z-index');
                td_zIndex = td_zIndex === 'auto' ? 50 : parseInt(td_zIndex);

                if (td_zIndex >= img_zIndex) {
                    divWrapper.appendChild(img);
                }
                divWrapper.appendChild(textDiv);
                CellsDivUtil.removeAllChildNodes(td);
                td.appendChild(divWrapper);
                // img.style.height="16px";
                // td.insertBefore(img,textDiv);
                //img.style.left=left+"px";
                //img.style.top=top+"px";
                /* textDiv.style.left=(level*6+20)+"px";
                 textDiv.style.position = "absolute";
                 textDiv.style.top = "0px";*/
            } else {
                //判断是否为组合区域--tqy
                if (self.isCombineCell(self.getCellAreaInfo(row, col))) {
                    textDiv.style.marginLeft = (level * 12 + 12) + 'px'; //有一种层次数据没有src
                }
            }
            ;
            // textDiv.style.width = "calc(100% - " + (level*6+20) +"px)";
        }
    };

    //渲染筛选
    ReportRender.prototype.renderFilterIcon = function (instance, td, row, col, prop, value, cellProperties) {
        var areaId = this.getCellAreaInfo(row, col);
        //修正行列坐标,防止冻结状态下行列坐标变化导致取不到areaId
        if (this.freezingType != null) {
            areaId = this.getCellAreaInfo(row + this.changeRowNum, col + this.changeColNum);
        }
        if (value[ 3 ].filter_src && !CellsDivUtil.getChildNode(CellsDivUtil.getChildNode(td, 'operaDiv'), 'filter')) {
            /*report-directive命令中这段逻辑被注释*/
            //在已过滤单元格中找与当前单元格   同一列，并且在同一个扩展区域 的单元格，如果没有，则将当前单元格加入已过滤单元格
            var sameColAndAreaCell = this.filterCellInfo.filter(function (item) {
                return item.col === col && item.areaId === areaId;
            });
            if (sameColAndAreaCell.length < 1) {
                this.filterCellInfo.push({ 'row': row, 'col': col, areaId: areaId });
            }
            this.renderCellRightDiv(td, 'filter.png', 'filter', row, col);
        } else {
            //同一个单元格会渲染4次,前两次是请求前的数据,后两次是请求后的数据
            if (!value[ 3 ].filter_src && this.filterCellInfo != null) {
                for (var i = 0; i < this.filterCellInfo.length; i++) {
                    var cell = this.filterCellInfo[ i ];
                    if (cell.col === col && cell.row === row && cell.areaId === areaId) {
                        this.filterCellInfo.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };

    //渲染排序
    ReportRender.prototype.renderSortIcon = function (instance, td, row, col, prop, value, cellProperties) {

        if (value[ 3 ].sort_TYPE) {
            if (value[ 3 ].sort_TYPE === 'sort_asc') {
                this.renderCellRightDiv(td, 'sort_asc.png', 'sort', row, col);
            } else if (value[ 3 ].sort_TYPE === 'sort_desc') {
                this.renderCellRightDiv(td, 'sort_desc.png', 'sort', row, col);
            }
        }
    };
    //渲染右侧按钮组的父div
    ReportRender.prototype.renderCellRightDiv = function (td, imgPath, imgId, row, col) {
        /*var pid = row + '_' + col;
         td.id = pid;*/
        //单元格右侧按钮的父div
        var cellRightDiv = CellsDivUtil.getChildNode(td, 'operaDiv');
        if (!cellRightDiv) {
            cellRightDiv = document.createElement('div');
            cellRightDiv.id = 'operaDiv';
            cellRightDiv.className = 'cellOperaDiv';

            // TODO dap5.1版本：排序相关的图标按钮先去掉，【qugx】
            // td.appendChild(cellRightDiv);
        }
        this.renderCellRightIcon(td, imgPath, imgId, row, col, cellRightDiv);
    };
    //渲染右侧按钮图标
    ReportRender.prototype.renderCellRightIcon = function (td, imgPath, imgId, row, col, rightDiv) {
        var imageBasePath = 'assets/imgs/report/celloperationicon/';
        if (imgId === 'filter') {
            //如果获取到筛选按钮，则返回,否则新建筛选按钮
            if (CellsDivUtil.getChildNode(rightDiv, imgId)) {
                return;
            }
        }
        else if (imgId === 'sort') {
            //如果获取到排序按钮，则 更新排序按钮图片，否则新建排序按钮
            var sortIcon = CellsDivUtil.getChildNode(rightDiv, imgId);
            if (sortIcon) {
                sortIcon.src = imageBasePath + imgPath;
                return;
            }
        }
        //新建按钮，顺序插入右侧
        var rightIcon = document.createElement('IMG');
        rightIcon.src = imageBasePath + imgPath;
        rightIcon.id = imgId;
        // rightIcon.style.float = 'left';
        //rightDiv.insertBefore(rightIcon,rightDiv.firstChild);
        rightDiv.appendChild(rightIcon);

        var self = this;
        rightIcon.onclick = function (e) {
            if (imgId === 'filter' && self.eventListener.queryFilterValue) {
                self.eventListener.queryFilterValue(e, row, col, '', $(rightIcon).offset().left, $(rightIcon).offset().top + $(rightIcon).height());
            }
        };
    };

    //当前选中单元格
    var CurSelectedCells = (function () {
        var CurSelectedCells = function (row, col, areaId) {
            this.row = row;
            this.col = col;
            this.areaId = areaId;
        };
        return CurSelectedCells;

    })();

    //areaId 该单元格所属扩展区域exId
    ReportRender.prototype.getCellAreaInfo = function (row, col) {
        var areaId = null;
        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var areaInfo = this.CellsModel.formatCellsModel.AreaDatas[ i ].area;
            if (row >= areaInfo[ 0 ] && row <= areaInfo[ 2 ] && col >= areaInfo[ 1 ] && col <= areaInfo[ 3 ]) {
                areaId = this.CellsModel.formatCellsModel.AreaDatas[ i ].exId;
                break;
            }
        }
        return areaId;
    };

    //根据areaId返回对应area --tongqy
    ReportRender.prototype.getAreaData = function (areaId) {
        var area = null;
        if (areaId) {
            for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
                area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
                if (area.exId == areaId) {
                    return area;
                }
            }
        }
        return area;
    };

    //找到匹配的字段区间
    ReportRender.prototype.getCellFldArea = function (row, col, areaId) {
        var fldArea = [];
        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            if (this.CellsModel.formatCellsModel.AreaDatas[ i ].exId === areaId) {
                for (var j = 0; j < this.CellsModel.formatCellsModel.AreaDatas[ i ].fldAreas.length; j++) { //遍历每个字段信息
                    var oneFldAreas = this.CellsModel.formatCellsModel.AreaDatas[ i ].fldAreas[ j ]; //oneFldAreas一个字段信息：{fldArea:[],fldName:''}
                    //取第一个区间的起始列号，如果单元格在该列区间内，再遍历所有该列区间内的行区间，判断该单元格是否在当前字段的有效区间
                    if (oneFldAreas.fldArea && oneFldAreas.fldArea.length > 0) {
                        var startCol = oneFldAreas.fldArea[ 0 ][ 1 ];
                        var endCol = oneFldAreas.fldArea[ 0 ][ 3 ];
                        if (col >= startCol && col <= endCol) {
                            fldArea = oneFldAreas.fldArea.filter(function (item) {
                                return row >= item[ 0 ] && row <= item[ 2 ];
                            });
                            break;//找到匹配的字段列区间则break
                        }
                    }


                }
                break;//找到匹配的扩展区域则break
            }
        }
        return fldArea;
    };

    //某单元格是否在有效区间
    ReportRender.prototype.isValidCell = function (row, col) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var areaInfo = this.CellsModel.formatCellsModel.AreaDatas[ i ].area; //[起始行号   起始列号   结束行号   结束列号]
            if (row >= areaInfo[ 0 ] && row <= areaInfo[ 2 ] && col >= areaInfo[ 1 ] && col <= areaInfo[ 3 ]) {
                return true;
            }
        }
        return false;
    };

    //判断该area是否为折叠显示 --jzf
    ReportRender.prototype.isCollapsibale = function (areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId && area.isCollapsibale == 1) {
                return true;
            }
        }
        return false;
    };
    //判断该area是否为交叉表显示 --heyong
    ReportRender.prototype.isCrossTable = function (areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId && area.type == 2) {
                return true;
            }
        }
        return false;
    };
    //返回crossHeadersCnt --heyong
    ReportRender.prototype.getCrossHeadersCnt = function (areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId) {
                return area.crossHeadersCnt;
            }
        }
    };

    //某单元格是否在区域的数据区域 --heyong
    ReportRender.prototype.isDataCell = function (row, col, areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId) {
                var areaInfo = this.CellsModel.formatCellsModel.AreaDatas[ i ].area; //[起始行号   起始列号   结束行号   结束列号]
                if (row >= areaInfo[ 0 ] + area.crossHeadersCnt[ 1 ]
                    && row <= areaInfo[ 2 ] && col >= areaInfo[ 1 ] + area.crossHeadersCnt[ 0 ] && col <= areaInfo[ 3 ]) {
                    return true;
                }
            }
        }
        return false;
    };

    //获取字段数据区域的起始列
    ReportRender.prototype.getStartRow = function (areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId) {
                var startArea;
                var fldAreas = area.fldAreas;
                if(!fldAreas){
                    return undefined;
                }
                for(var j = 0,ll = fldAreas.length; j < ll;j++){
                    if(!fldAreas[j].fldArea){
                        return undefined;
                    }
                    var fldAreaArray = fldAreas[j].fldArea;
                    for(var k = 0,lll = fldAreaArray.length; k < lll;k++){
                        var fldArea = fldAreaArray[k];
                        if(startArea === undefined){
                            startArea = fldArea[0];
                        }else if(startArea > fldArea[0]){
                            startArea = fldArea[0]
                        }
                    }
                }
                return startArea;
            }
        }
        return undefined;
    };

    //某单元格是否在自由表的数据区域
    ReportRender.prototype.isInFreeTableDataRange = function (row, col, areaId) {
        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            //交叉表区域
            if (area.exId == areaId && area.type == 2) {
                return true;
            }
            if (area.exId == areaId && area.type == 3) {
                for (var j = 0; j < area.fldAreas.length; j++) {
                    var fldArea = area.fldAreas[ j ].fldArea;
                    for (var k = 0; k < fldArea.length; k++) {
                        var fldAreaRange = fldArea[ k ];
                        if (row >= fldAreaRange[ 0 ] && row <= fldAreaRange[ 2 ]
                            && col >= fldAreaRange[ 1 ] && col <= fldAreaRange[ 3 ]) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    };
    //某单元格是否在表头 --heyong
    ReportRender.prototype.isHeader = function (row, col, areaId) {

        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId) {
                var areaInfo = this.CellsModel.formatCellsModel.AreaDatas[ i ].area; //[起始行号   起始列号   结束行号   结束列号]
                //行标题走正常逻辑-heyongg
                if ((row >= areaInfo[ 0 ] && row < areaInfo[ 0 ] + area.crossHeadersCnt[ 1 ])
                /*|| (col >= areaInfo[1] && col <= areaInfo[1]+area.crossHeadersCnt[0])*/) {
                    return true;
                }
            }
        }
        return false;
    };
    //判断该区域是否是一个跨行合并而不是跨列合并的单元格
    ReportRender.prototype.isMergeRowCell = function (startRow, startCol, endRow, endCol) {
        var mergeCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
        //开始和结束列号相同
        if (startCol === endCol && mergeCells) {
            for (var i = 0; i < mergeCells.length; i++) {
                if (startRow === mergeCells[ i ][ 0 ] && endRow === mergeCells[ i ][ 2 ]) {
                    return true;
                }
            }

        }
        return false;
    };
    //判断该区域是否是合并单元格
    ReportRender.prototype.isMergeCell = function (startRow, startCol, endRow, endCol) {
        var mergeCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
        if (mergeCells) {
            for (var i = 0; i < mergeCells.length; i++) {
                if (startRow >= mergeCells[ i ][ 0 ] && endRow <= mergeCells[ i ][ 2 ] &&
                    startCol >= mergeCells[ i ][ 1 ] && endCol <= mergeCells[ i ][ 3 ]) {
                    return true;
                }
            }
        }
        return false;
    };
    //判断该区域是否为组合区域--jzf
    ReportRender.prototype.isCombineCell = function (areaId) {
        for (var i = 0; i < this.CellsModel.formatCellsModel.AreaDatas.length; i++) {
            var area = this.CellsModel.formatCellsModel.AreaDatas[ i ];
            if (area.exId == areaId && area.type == 1) {
                return true;
            }
        }
        return false;
    };

    var userBrowser = function () {
        var userAgent = navigator.userAgent;
        if (userAgent.indexOf('Opera') > -1) {
            return 'Opera';
        }
        ;
        if (userAgent.indexOf('Firefox') > -1) {
            return 'FF';
        }
        if (userAgent.indexOf('Chrome') > -1) {
            return 'Chrome';
        }
        if (userAgent.indexOf('Safari') > -1) {
            return 'Safari';
        }
        if (userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1 && !isOpera) {
            return 'IE';
        }
        ;
    };

    //更新表格数据 扩展区域起始行列号（CellsModel.AreaDatas）  和 渲染数据本身（cellsModel.DynamicModel[0].cellsArray） 改变
    ReportRender.prototype.updateData = function (reponse) {
        //更新CellsModel,即更新了样式、扩展区域起始行列号、为起始行列的上一行或前一列设置边框色 等
        if (!reponse || !reponse.DynamicModel) {
            reponse = {
                DynamicModel: [ { cellsArray: [ [] ] } ]
            };
        }
        this.CellsModel = new CellsModel(reponse);

        this.formatCellsModel = this.CellsModel.getFormatCellsModel();
        var data = this.CellsModel.getData();
        this.handsontableData = JSON.parse(JSON.stringify(data));

        var dynamicSettings = this.getDynamicSettings();

        //!!!!!!!!!!!!!!先loadData，再更新配置
        //否则发现bug: loadData和updateSettings都会渲染数据   对两个扩展区域的同一列分别进行筛选后，取消某区域该列的筛选，
        // 如果先updateSettings,则会渲染之前已筛选的数据，导致renderFilterIcon中，为cellfilterIcon加入该单元格，逻辑错误

        /*如果先loadData,再updateSettings,也会出现新的bug:交叉表表头有多行且列数超过屏幕的情况下,
         * 拖拽滚动条筛选第一行表头,出现一直loading的bug.现在暂时先updateSettings,再loadData,
         * 之前bug从其他地方修改--heyongg*/
        if (this.freezingType == null) {

            this.handsontableObj.updateSettings({
                colWidths: dynamicSettings.colWidthsArray,
                rowHeights: dynamicSettings.rowHeight,
                mergeCells: this.CellsModel.calcMergeCells(),
                data:this.handsontableData
            });
            // this.handsontableObj.loadData(this.handsontableData);
        } else {
            this.handsontableObj.loadData(this.handsontableData);
            //在冻结状态下对筛选或排序操作的处理,仅限于标题完整显示的情况
            var fixedRowsTop = this.freezingNum[ 0 ];
            var fixedColumnsLeft = this.freezingNum[ 1 ];
            if (this.freezingType == 'lockRow') {
                fixedRowsTop = this.freezingNum[ 0 ];
            } else if (this.freezingType == 'lockColumn') {
                fixedColumnsLeft = this.freezingNum[ 1 ];
            } else if (this.freezingType == 'lockRowColumn') {
                fixedRowsTop = this.freezingNum[ 0 ];
                fixedColumnsLeft = this.freezingNum[ 1 ];
            }
            //记录当前操作的合并单元格数组,用于取消冻结
            this.filterAreaCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
            //记录当前操作的行头和列头数组,用于取消冻结
            dynamicSettings.rowHeight.splice(0, this.selectedInfo[ 0 ] - this.freezingNum[ 0 ]);
            dynamicSettings.colWidthsArray.splice(0, this.selectedInfo[ 1 ] - this.freezingNum[ 1 ]);
            this.rowHeaderArray = dynamicSettings.rowHeight;
            this.columnHeaderArray = dynamicSettings.colWidthsArray;
            //单元格数据需要截取为冻结后的数据--处理行标题上面有空行,冻结时有一部分被舍去而导致错位的情况
            var countRows = this.handsontableObj.countRows();
            var countCols = this.handsontableObj.countCols();
            var operData = this.handsontableObj.getData(this.selectedInfo[ 0 ] - this.freezingNum[ 0 ], this.selectedInfo[ 1 ] - this.freezingNum[ 1 ], countRows - 1, countCols - 1);
            this.handsontableObj.updateSettings({
                data: operData,
                colWidths: dynamicSettings.colWidthsArray,
                rowHeights: dynamicSettings.rowHeight,
                fixedRowsTop: fixedRowsTop,
                fixedColumnsLeft: fixedColumnsLeft,
                mergeCells: this.CellsModel.freezingMergeCells(this.freezingType, this.selectedInfo, this.freezingNum, this.filterAreaCells)
            });
            //将冻结类型置为过滤冻结
            this.freezingOperType = 'filterLock';
        }

    };

    ReportRender.prototype.resize = function (hasPager, ieHeight) {
        //ie浏览器给Handsontable容器固定宽高，才出滚动条
        if (this.IS_IE()) {
            this.container.style.height = ieHeight + 'px';
        }

        if (hasPager) {
            this.container.style.height = (document.documentElement.clientHeight - 50 - (hasPager ? 36 : 0)) + 'px';
        }
        if (this.handsontableObj) {
            //显示表格线，需重新计算表格列数
            if (this.handsonProp.isShowCellLine) {
                var prop = this.calcRealProp();
                this.handsontableObj.updateSettings({
                    colWidths: prop[ 0 ]
                    //stretchH: prop[1]
                });
            }
            this.handsontableObj.render();
        }
    };

    //更新冻结行列值
    //实现根据鼠标所在单元格不同位置的动态冻结效果--tongqy
    ReportRender.prototype.updateFixedSetting = function (type, rowNum, colNum, selectedInfo, freezingNum) {
        //表格总行数 总列数
        var countRows = this.handsontableObj.countRows();
        var countCols = this.handsontableObj.countCols();

        if (type === 'lockRow') {
            //冻结所需记录的各种状态
            this.freezingType = type;
            this.changeRowNum = rowNum - freezingNum[ 0 ];//冻结时被舍去的行数
            this.selectedInfo = selectedInfo;
            this.freezingNum = freezingNum;
            this.cellsArray = this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray;
            this.rowHeaderArray = this.CellsModel.cellsModel.rowHeader.headerArray.concat();//行标题高度数组
            this.columnHeaderArray = this.CellsModel.cellsModel.columnHeader.headerArray.concat();//列标题高度数组
            this.formatCellsModel = this.CellsModel.getFormatCellsModel();
            this.areaCells = angular.copy(this.formatCellsModel.DynamicModel[ 0 ].areaCells);

            //冻结需要的所有单元格数据
            var data = this.handsontableObj.getData(this.changeRowNum, 0, countRows - 1, countCols - 1);
            this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray = data;
            //行数组
            this.CellsModel.cellsModel.rowHeader.headerArray.splice(0, this.changeRowNum);
            var jsonData = JSON.parse(JSON.stringify(data));

            //获取冻结所需的areaCells数据
            var areaCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
            var freezingAreaCells = [];
            for (i in areaCells) {
                if (areaCells[ i ][ 2 ] >= this.changeRowNum) {
                    if (areaCells[ i ][ 0 ] <= this.changeRowNum) {
                        areaCells[ i ][ 0 ] = this.changeRowNum;
                    }
                    freezingAreaCells.push(areaCells[ i ]);
                }
            }
            //对冻结所需areaCells数据,进行冻结状态合并单元格的处理,主要解决冻结分割处文字遮挡问题
            var mergeCells = this.CellsModel.freezingMergeCells(type, selectedInfo, freezingNum, freezingAreaCells);

            //修改初始化配置信息
            this.handsontableObj.updateSettings({
                data: data,
                fixedRowsTop: freezingNum[ 0 ],
                fixedColumnsLeft: 0,
                mergeCells: mergeCells
            });
            //加载本地数据
            this.handsontableObj.loadData(jsonData);
        } else if (type === 'lockColumn') {
            this.freezingType = type;
            this.changeColNum = colNum - freezingNum[ 1 ];
            this.selectedInfo = selectedInfo;
            this.freezingNum = freezingNum;

            this.cellsArray = this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray;
            this.rowHeaderArray = this.CellsModel.cellsModel.rowHeader.headerArray.concat();
            this.columnHeaderArray = this.CellsModel.cellsModel.columnHeader.headerArray.concat();
            this.formatCellsModel = this.CellsModel.getFormatCellsModel();
            this.areaCells = angular.copy(this.formatCellsModel.DynamicModel[ 0 ].areaCells);

            var data = this.handsontableObj.getData(0, this.changeColNum, countRows - 1, countCols - 1);
            this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray = data;
            this.CellsModel.cellsModel.columnHeader.headerArray.splice(0, this.changeColNum);
            var jsonData = JSON.parse(JSON.stringify(data));

            var areaCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
            var freezingAreaCells = [];
            for (i in areaCells) {
                if (areaCells[ i ][ 3 ] >= this.changeColNum) {
                    if (areaCells[ i ][ 1 ] <= this.changeColNum) {
                        areaCells[ i ][ 1 ] = this.changeColNum;
                    }
                    freezingAreaCells.push(areaCells[ i ]);
                }
            }
            var mergeCells = this.CellsModel.freezingMergeCells(type, selectedInfo, freezingNum, freezingAreaCells);

            this.handsontableObj.updateSettings({
                data: data,
                fixedRowsTop: 0,
                fixedColumnsLeft: freezingNum[ 1 ],
                mergeCells: mergeCells
            });
            this.handsontableObj.loadData(jsonData);
        } else if (type === 'lockRowColumn') {
            this.freezingType = type;
            this.changeRowNum = rowNum - freezingNum[ 0 ];
            this.changeColNum = colNum - freezingNum[ 1 ];
            this.selectedInfo = selectedInfo;
            this.freezingNum = freezingNum;

            this.cellsArray = this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray;
            this.rowHeaderArray = this.CellsModel.cellsModel.rowHeader.headerArray.concat();
            this.columnHeaderArray = this.CellsModel.cellsModel.columnHeader.headerArray.concat();
            this.formatCellsModel = this.CellsModel.getFormatCellsModel();
            this.areaCells = angular.copy(this.formatCellsModel.DynamicModel[ 0 ].areaCells);

            var data = this.handsontableObj.getData(this.changeRowNum, this.changeColNum, countRows - 1, countCols - 1);
            this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray = data;
            this.CellsModel.cellsModel.rowHeader.headerArray.splice(0, this.changeRowNum);
            this.CellsModel.cellsModel.columnHeader.headerArray.splice(0, this.changeColNum);
            var jsonData = JSON.parse(JSON.stringify(data));

            var areaCells = this.formatCellsModel.DynamicModel[ 0 ].areaCells;
            var freezingAreaCells = [];
            for (i in areaCells) {
                if (areaCells[ i ][ 2 ] >= this.changeRowNum) {
                    if (areaCells[ i ][ 0 ] <= this.changeRowNum) {
                        areaCells[ i ][ 0 ] = this.changeRowNum;
                    }
                    freezingAreaCells.push(areaCells[ i ]);
                }
            }

            var freezingAreaCells2 = [];
            for (i in freezingAreaCells) {
                if (freezingAreaCells[ i ][ 3 ] >= this.changeColNum) {
                    if (freezingAreaCells[ i ][ 1 ] <= this.changeColNum) {
                        freezingAreaCells[ i ][ 1 ] = this.changeColNum;
                    }
                    freezingAreaCells2.push(freezingAreaCells[ i ]);
                }
            }
            var mergeCells = this.CellsModel.freezingMergeCells(type, selectedInfo, freezingNum, freezingAreaCells2);

            this.handsontableObj.updateSettings({
                data: data,
                fixedRowsTop: freezingNum[ 0 ],
                fixedColumnsLeft: freezingNum[ 1 ],
                mergeCells: mergeCells
            });
            this.handsontableObj.loadData(jsonData);
        } else if (type === 'cancelLock') {
            //重置,还原为未冻结的状态
            this.changeRowNum = 0;
            this.changeColNum = 0;
            this.freezingNum = [ 0, 0 ];
            this.freezingType = null;

            this.CellsModel.formatCellsModel.DynamicModel[ 0 ].cellsArray = this.cellsArray;
            this.CellsModel.cellsModel.rowHeader.headerArray = this.rowHeaderArray;
            this.CellsModel.cellsModel.columnHeader.headerArray = this.columnHeaderArray;

            //如果在冻结下有筛选或者排序操作,取消冻结后,显示当前页面状态,否则显示为冻结前的初始状态
            if (this.freezingOperType == 'filterLock') {
                this.formatCellsModel.DynamicModel[ 0 ].areaCells = this.filterAreaCells;
            } else {
                this.formatCellsModel.DynamicModel[ 0 ].areaCells = this.areaCells;
            }
            this.handsontableObj.updateSettings({
                data: this.handsontableData,
                //解决动态冻结状态下,不应出现的行高列宽变化问题
                rowHeights: this.rowHeaderArray,
                colWidths: this.columnHeaderArray,
                fixedRowsTop: 0,
                fixedColumnsLeft: 0,
                mergeCells: this.CellsModel.calcMergeCells()
            });
        }
        //取消选中区域效果
        this.handsontableObj.deselectCell();
    };

    ReportRender.prototype.IS_IE = function () {
        return ('ActiveXObject' in window);
    };

    ReportRender.prototype.addEListener = function (name, callback) {
        this.eventListener[ name ] = callback;
    };

    ReportRender.prototype.getSelected = function () {
        //return this.handsontableObj.getSelected();
        return this.curSelectedRange;
    };
    return ReportRender;
})();
