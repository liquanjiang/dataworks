/**
 * Created by wuzhengd on 2016/3/1.
 */
var CellsModel = (function(){
    var CellsModel = function(cellsModel){
        this.cellsModel = cellsModel;
        this.data = null;//表格数据
        if(this.cellsModel.DynamicModel[0] && this.cellsModel.DynamicModel[0].cellsArray){
            this.data = this.cellsModel.DynamicModel[0].cellsArray;
        }
        this.formatCellsModel = this.mapCellsFormat();
        this.buildBorderAndDrillInfo();
    };
    //format dynamicModel elements
    CellsModel.prototype.mapCellsFormat = function(){
            if(this.cellsModel.DynamicModel.length < 1){
                return this.cellsModel;
            }
            Handsontable.helper.arrayEach(this.cellsModel.DynamicModel, function (dynamicModel) {

                var fonts = dynamicModel.fonts;
                if(fonts){
                    var newFonts = {};
                    Handsontable.helper.arrayEach(fonts, function (font) {
                        newFonts[font.id] = font.detail;
                    });
                }
                var aligns = dynamicModel.aligns;
                if(aligns){
                    var newAligns = {};
                    Handsontable.helper.arrayEach(aligns, function (align) {
                        newAligns[align.id] = align.detail;
                    });
                }
                var lines = dynamicModel.lines;
                if(lines){
                    var newLines = {};
                    Handsontable.helper.arrayEach(lines, function (line) {
                        newLines[line.id] = line.detail;
                    });
                }
                var formats = dynamicModel.formats;
                if(formats){
                    var newFormats = {};
                    Handsontable.helper.arrayEach(formats, function (format) {
                        var oneFormat = {
                            font:newFonts[format.detail.fontId],
                            align:newAligns[format.detail.alignId],
                            line:newLines[format.detail.lineId],
                            isData:format.isData
                        };

                        newFormats[format.id] = oneFormat;
                    });
                    dynamicModel.formats = newFormats;
                }

            });

            return this.cellsModel;
    };

    //为有链接的单元格添加链接信息，为边缘单元格添加边线
    CellsModel.prototype.buildBorderAndDrillInfo = function() {
        if (this.formatCellsModel && this.formatCellsModel.AreaDatas) {
            var areaDatas = this.formatCellsModel.AreaDatas;
            for (var i = 0; i < areaDatas.length; i++) {
                var oneArea = areaDatas[i].area;
                //为起始行列的上一行或前一列设置边框色
                /*var formats = this.formatCellsModel.DynamicModel[0].formats;
                if (formats) {
                    var startRow = oneArea[0];
                    var startCol = oneArea[1];
                    var endRow = oneArea[2];
                    var endCol = oneArea[3];
                    //如果起始行 > 0，取起始行的上一行数据
                    if (startRow > 0) {
                        for (var col = startCol; col <= endCol; col++) {
                            var oneCellData = this.data[startRow - 1][col];
                            //如果起始行数据有上边框，则为起始行的上一行数据加下边框
                            var nextRowData = this.data[startRow][col];
                            if (nextRowData && nextRowData[1] && formats[nextRowData[1]] && formats[nextRowData[1]].line && formats[nextRowData[1]].line.topLine) {
                                //该数据应该为为null
                                if (!oneCellData) {
                                    this.data[startRow - 1][col] = [];
                                    this.data[startRow - 1][col][0] = '';//设置数据为空
                                    this.data[startRow - 1][col][1] = {
                                        line: {
                                            bottom: {
                                                bottomColor: formats[nextRowData[1]].line.topLine.topColor,
                                                bottomWidth: formats[nextRowData[1]].line.topLine.topWidth
                                            }
                                        }
                                    };
                                }
                            }
                        }
                    }
                    //如果起始列 > 0，取起始列的前一列数据
                    if (startCol > 0) {
                        for (var row = startRow; row <= endRow; row++) {
                            if(!this.data[row]){
                                continue;
                            }
                            var oneCellData = this.data[row][startCol - 1];
                            //如果起始列数据有左边框，则为起始列的前一列数据加右边框
                            var nextColData = this.data[row][startCol];
                            if (nextColData && nextColData[1] && formats[nextColData[1]] && formats[nextColData[1]].line && formats[nextColData[1]].line.leftLine) {
                                //该数据应该为为null
                                if (!oneCellData) {
                                    this.data[row][startCol - 1] = [];
                                    this.data[row][startCol - 1][0] = '';//设置数据为空
                                    this.data[row][startCol - 1][1] = {
                                        line: {
                                            right: {
                                                rightColor: formats[nextColData[1]].line.leftLine.leftColor,
                                                rightWidth: formats[nextColData[1]].line.leftLine.leftWidth
                                            }
                                        }
                                    };
                                }
                            }
                        }
                    }
                }*/

                //为每个链接规则字段 添加其数据区域信息（起始行列号）
                if (areaDatas[i].drillRules) {
                    for (var j = 0; j < areaDatas[i].drillRules.length; j++) {
                        var drillFieldName = areaDatas[i].drillRules[j].fldName;
                        var drillFieldArea = areaDatas[i].fldAreas.filter(function (item) {
                            return item.fldName === drillFieldName;
                        });
                        //链接规则
                        if (drillFieldArea[0]&&drillFieldArea[0].fldArea && drillFieldArea[0].fldArea.length > 0) {
                            //areaDatas[i].drillRules[j].fldArea = drillFieldArea[0].fldArea;
                            for (var k = 0; k < drillFieldArea[0].fldArea.length; k++) {
                                var oneFldArea = drillFieldArea[0].fldArea[k];//oneFldArea 起始行 起始列 结束行 结束列
                                var ruleStartRow = oneFldArea[0];
                                var ruleEndRow = oneFldArea[2];
                                var ruleStartCol = oneFldArea[1];
                                var ruleEndCol = oneFldArea[3];

                                //为该区域每一个单元格数据添加drillRules
                                for (var m = ruleStartRow; m <= ruleEndRow; m++) {
                                    for (var n = ruleStartCol; n <= ruleEndCol; n++) {
                                        var oneCellData = this.data[m][n];
                                        if (oneCellData) {
                                            if (!oneCellData[3]) {
                                                oneCellData[3] = {};
                                            }
                                            oneCellData[3].drillRules = areaDatas[i].drillRules[j];
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }//end for

            //循环遍历所有数据，如果是起始行列的上一行或前一列，则为其设置边框色
            /* var formats = this.formatCellsModel.DynamicModel[0].formats;
             if(formats){
             for(var rowNum = 0;rowNum < this.data.length;rowNum ++){
             var oneRowData = this.data[rowNum];
             for(var colNum = 0;colNum < oneRowData.length;colNum ++){
             var oneCellData = oneRowData[colNum];
             //遍历所有扩展区域
             for(var i=0;i< this.areaBorderInfo.length ;i++){
             var oneBorderInfo = this.areaBorderInfo[i]; //[起始行号   起始列号   结束行号   结束列号]
             //如果是起始行上一行，并在数据区域所占列内，看它所在列下一行(即起始行)表格是否有上边框线，如果有，为本单元格添加下边框
             if((rowNum === oneBorderInfo[0]-1) && colNum >= oneBorderInfo[1] && colNum <= oneBorderInfo[3]) {
             var nextRowData = this.data[oneBorderInfo[0]][colNum];
             if (nextRowData && nextRowData[1] && formats[nextRowData[1]] && formats[nextRowData[1]].line && formats[nextRowData[1]].line.topLine) {
             //该数据应该为为null
             if (!oneRowData[colNum]) {
             oneRowData[colNum] = [];
             oneRowData[colNum][0] = '';//设置数据为空
             oneRowData[colNum][1] = {line: {
             bottom: {
             bottomColor: formats[nextRowData[1]].line.topLine.topColor,
             bottomWidth: formats[nextRowData[1]].line.topLine.topWidth
             }
             }};
             }
             }
             }
             //如果是起始列前一列，并在数据区域所占行内，看它所在行下一列（即起始列）表格是否有左边框线，如果有，为本单元格添加右边框
             else if((colNum === oneBorderInfo[1] -1) && rowNum >= oneBorderInfo[0] && rowNum <= oneBorderInfo[2] ){
             var nextColData = this.data[rowNum][oneBorderInfo[1]];
             if(nextColData && nextColData[1] && formats[nextColData[1]] && formats[nextColData[1]].line && formats[nextColData[1]].line.leftLine){
             //该数据为null
             if(!oneRowData[colNum]){
             oneRowData[colNum]=[];
             oneRowData[colNum][0] = '';//设置数据为空
             oneRowData[colNum][1] = {line:{
             right: {
             rightColor: formats[nextColData[1]].line.leftLine.leftColor,
             rightWidth: formats[nextColData[1]].line.leftLine.leftWidth
             }
             }};
             }
             }
             }
             }

             }

             }
             }
             }//end if*/
        }
    };
    //add merge rules(an array) for handsontable mergeCells Property
    CellsModel.prototype.calcMergeCells = function () {
        var mergeCells = [];
        var areaCells = this.formatCellsModel.DynamicModel[0].areaCells;
        if(!areaCells){
            return mergeCells;
        }
        Handsontable.helper.arrayEach(areaCells, function (areaCell) {
            mergeCells.push({row:areaCell[0],col:areaCell[1],rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-areaCell[1]+1});
        });
        return mergeCells;
    };
    
    // bug修复,解决冻结后部分文字被遮挡问题 --tqy
    //修改了冻结的实现方式--tqy 2016.9.9
    CellsModel.prototype.freezingMergeCells = function (type,selectedInfo,freezingNum,areaCells) {
    	var startRow = selectedInfo[0];
        var startCol = selectedInfo[1];
        
        var mergeCells = [];
        if(!areaCells){
            return mergeCells;
        }
        
        if(type === 'lockRow'){
        	Handsontable.helper.arrayEach(areaCells, function (areaCell) {
        			var viarable = startRow-freezingNum[0];
        			if(areaCell[0]<startRow && areaCell[2] >= startRow){
        				mergeCells.push({row:areaCell[0]-viarable,col:areaCell[1],rowspan:startRow-areaCell[0],colspan:areaCell[3]-areaCell[1]+1});
        				mergeCells.push({row:startRow-viarable,col:areaCell[1],rowspan:areaCell[2]-startRow+1,colspan:areaCell[3]-areaCell[1]+1});
        			}else{
        				mergeCells.push({row:areaCell[0]-viarable,col:areaCell[1],rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-areaCell[1]+1});
        			}	
        	});
        }else if(type === 'lockColumn'){
        	Handsontable.helper.arrayEach(areaCells, function (areaCell) {
        			var viarable = startCol-freezingNum[1];
        			if(areaCell[1]<startCol && areaCell[3] >= startCol){
        				mergeCells.push({row:areaCell[0],col:areaCell[1]-viarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:startCol-areaCell[1]});
        				mergeCells.push({row:areaCell[0],col:startCol-viarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-startCol+1});
        			}else{
        				mergeCells.push({row:areaCell[0],col:areaCell[1]-viarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-areaCell[1]+1});
        			}	
            });
        }else if(type === 'lockRowColumn'){
        	Handsontable.helper.arrayEach(areaCells, function (areaCell) {
    			var rowViarable = startRow-freezingNum[0];
    			var colViarable = startCol-freezingNum[1];
    			if(areaCell[0]<startRow && areaCell[2] >= startRow){
    				mergeCells.push({row:areaCell[0]-rowViarable,col:areaCell[1]-colViarable,rowspan:startRow-areaCell[0],colspan:areaCell[3]-areaCell[1]+1});
    				mergeCells.push({row:startRow-rowViarable,col:areaCell[1]-colViarable,rowspan:areaCell[2]-startRow+1,colspan:areaCell[3]-areaCell[1]+1});
    			}else if(areaCell[1]<startCol && areaCell[3] >= startCol){
    				mergeCells.push({row:areaCell[0]-rowViarable,col:areaCell[1]-colViarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:startCol-areaCell[1]});
    				mergeCells.push({row:areaCell[0]-rowViarable,col:startCol-colViarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-startCol+1});
    			}else{
    				mergeCells.push({row:areaCell[0]-rowViarable,col:areaCell[1]-colViarable,rowspan:areaCell[2]-areaCell[0]+1,colspan:areaCell[3]-areaCell[1]+1});
    			}
        	});
        }
        return mergeCells;
    }
    CellsModel.prototype.getData = function(){
        return  this.data;
    };

    CellsModel.prototype.getFormatCellsModel = function(){
        return this.formatCellsModel;
    };




    return CellsModel;
})();