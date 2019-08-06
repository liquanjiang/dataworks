/**
* 表格Div工具
*/
;CellsDivUtil = (function () {

	var CellsDivUtil =function(){

	};
	CellsDivUtil.getChildNode = function(parentDiv,childId)
	{
		if(!parentDiv){
			return null;
		}
		var childrens = parentDiv.childNodes;
		for(var i = 0; i < childrens.length; i++)
		{
			var children = childrens[i];
			if(children.id == childId)
			{
				return children;
			}
		}
		return null;
	};
	CellsDivUtil.removeAllChildNodes = function(parentDiv)
	{
		while(parentDiv.hasChildNodes())
		{
			parentDiv.removeChild(parentDiv.firstChild);
		}
	};

	CellsDivUtil.getEventSrc = function(e)
	{
		var src = null;
		if(IS_IE)
		{
			src = e.srcElement;
		}
		else
		{
			src = e.currentTarget;
		}

		return src;
	};


	return CellsDivUtil;
})();

