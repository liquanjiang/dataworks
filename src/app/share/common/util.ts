/**
 * Created by LiQuanjiang on 2018/8/23 14:16.
 * Description:
 */
declare var $: any;
import constant from './constant';

const CONSOLE_CTX = constant.CONSOLE_CTX;
const dz = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const origin = window.location.origin ? window.location.origin : dz;
const showMessage = function (msg: string, type = 'success', opts: any = { timeOut: 3000 }) {
    const container = $('.msg-container');
    const $msgTpl = $('#msg-tpl').clone();
    $msgTpl.removeAttr('id');
    $msgTpl.addClass(type);
    $msgTpl.find('.msg-content').html(msg);
    const msgCount = container.children().length;
    const top: string = 100 + msgCount * 45 + 'px';
    container.append($msgTpl);
    $msgTpl.show().animate({ top: top, opacity: '1' }).delay(opts.timeOut).fadeOut(0, function () {
        $(this).remove();
    });
};

const typeArr = [
    { code: 'Schema', name: '库' },
    { code: 'View', name: '视图' },
    { code: 'Table', name: '表' },
    { code: 'Column', name: '字段' },
    { code: 'Procedure', name: '存储过程' },
    { code: 'ALL', name: '全部' }
];

// 消息confirm框
const showConfirm = function (msg: string, confirmFn: any, cancelFn: any, closeFn?) {
    const $confirmMD = $('#confirmMD').clone();
    const container = $('.msg-container');
    $confirmMD.removeAttr('id');
    $confirmMD.find('.confirm-content').html(msg);
    const msgCount = container.children('.dap-wrap').length;
    if (msgCount === 0) {
        container.append($confirmMD);
        $('.msg-container .dap-wrap').css('display', 'block');
        $('.confirm-ok').click(function () {
            confirmFn();
            $('.msg-container .dap-wrap').remove();
        });
        $('.confirm-cancel').click(function () {
            cancelFn();
            $('.msg-container .dap-wrap').remove();
        });
        $('.cancel').click(function () {
            if (closeFn) {
                closeFn();
            }
            $('.msg-container .dap-wrap').remove();
        });
    }
};


// 判断是否是IE浏览器
function IEBrowser() {
    const userAgent = navigator.userAgent; // 取得浏览器的userAgent字符串
    const isIE = userAgent.indexOf('compatible') > -1 && userAgent.indexOf('MSIE') > -1; // 判断是否IE<11浏览器
    const isEdge = userAgent.indexOf('Edge') > -1 && !isIE; // 判断是否IE的Edge浏览器
    const isIE11 = userAgent.indexOf('Trident') > -1 && userAgent.indexOf('rv:11.0') > -1; // 判断是否IE11浏览器
    return (isIE || isIE11);
}

// 根据图表类型获取图表类
function getIconClass(icon) {
    switch (icon) {
        case 'mm_map':
            return 'icon-dw_datamap';
        case 'mm_query':
            return 'icon-dw_datasearch';
        case 'mm_collect':
            return 'icon-dw_datacollection';
        case 'configmanage_ds':
            return 'icon-Datasourceconfigur';
        case 'jobmanage':
            return 'icon-Taskmanagement';
        case 'taskmanage':
            return 'icon-workmanagement';
        case 'schdmonitor':
            return 'icon-Schedulingmonitorin';
        case 'checkresult':
            return 'icon-Checkresult';
        case 'checkdef':
            return 'icon-Checkdefinition';
        case 'changehistory':
            return 'icon-Changequery';
        case 'orderreport':
            return 'icon-Subscriptionreport';
    }
}

// 仅限于新建目录获取不重名的目录名字使用
function getNumFromStr(str) {
    if (str.length > 4) {
        return parseInt(str.substring(4), 10);
    } else {
        return 0;
    }
}

// 获取不重名的目录名
function getDifName(name, arr) {
    const len = arr.length;
    let flag = false;
    const index = getNumFromStr(name) + 1;
    for (let i = 0; i < len; i++) {
        if (name === arr[i].name) {
            flag = true;
            name = name.substring(0, 4) + index;
        }
    }
    if (!flag) {
        return name;
    } else {
        return getDifName(name, arr);
    }
}

// 获取一个目录下的不重名的任务名
function getDifTaskName(name, arr) {
    const len = arr.length;
    let flag = false;
    const index = 1;
    for (let i = 0; i < len; i++) {
        if (name === arr[i].name) {
            flag = true;
            name = name.substring(0) + index;
        }
    }
    if (!flag) {
        return name;
    } else {
        return getDifTaskName(name, arr);
    }
}


// 判断目录下是否有重名的文件夹，名称相同但pk不同即为重名
function ifRaname(name, pk, arr) {
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (name === arr[i].name && pk !== arr[i].pk) {
            return true;
        }
    }
    return false;
}

// 获取pkParent所对应的节点的子节点数组
function getArr(pkParent, arr) {
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i].pk === pkParent && arr[i].children.length > 0) {
            return arr[i].children;
        } else if (arr[i].pk !== pkParent && arr[i].children.length > 0) {
            const a = getArr(pkParent, arr[i].children);
            if (a && a.length > 0) {
                return a;
            }
        }
    }
}

// 根据时间戳返回'yyyy-mm-dd hh:mm:ss'格式的字符串
function formatDateTime(inputTime) {
    const date = new Date(inputTime);
    const y = date.getFullYear();
    let m: any = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    let d: any = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    let h: any = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    let minute: any = date.getMinutes();
    let second: any = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
}

// 根据星期的数字返回星期的汉字
function getWeekDayByValue(value) {
    switch (value) {
        case  1 :
            return '星期一';
        case  2 :
            return '星期二';
        case  3 :
            return '星期三';
        case  4 :
            return '星期四';
        case  5 :
            return '星期五';
        case  6 :
            return '星期六';
        case  0 :
            return '星期日';
    }
}

// 根据'yyyy-mm-dd hh:mm:ss'格式的时间字符串获得时间戳
function getTimeByStr(str) {
    let date = str;
    date = date.substring(0, 19);
    date = date.replace(/-/g, '/');
    return new Date(date).getTime();
}

// 根据时间戳进行排序
function campareBytime(obj1, obj2) {
    const ts1 = getTimeByStr(obj1.ts);
    const ts2 = getTimeByStr(obj2.ts);
    if (ts1 < ts2) {
        return -1;
    } else if (ts1 > ts2) {
        return 1;
    } else {
        return 0;
    }
}

// 获取当前时间的'yyyy-mm-dd hh:mm:ss'格式的时间字符串
function setTimeNowStr() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const zmonth = month > 9 ? month.toString() : '0' + month.toString();
    const zday = day > 9 ? day.toString() : '0' + day.toString();
    const zhour = hour > 9 ? hour.toString() : '0' + hour.toString();
    const zminute = minute > 9 ? minute.toString() : '0' + minute.toString();
    const zsecond = second > 9 ? second.toString() : '0' + second.toString();
    return year.toString() + '-' + zmonth + '-' + zday + ' ' + zhour + ':' + zminute + ':' + zsecond;
}


// 根据class名称返回key
function getKeyByClassName(name) {
    if (!name) {
        return '';
    }
    switch (name) {
        case '视图' :
            return 'View';
        case '存储过程':
            return 'Procedure';
        case '数据表':
            return 'Table';
    }
}

// 由'/'为分割符的字符串转为数组
function getArrByStr(str, symbol) {
    if (!str || !symbol) {
        return [];
    }
    const arr = str.split(symbol);
    arr.shift();
    return arr;
}

// 获取随机整数，且不能等于某个数
function getRandomDifNum(max, num) {
    const Num = Math.floor(Math.random() * max);
    if (Num !== num) {
        return Num;
    }
    return getRandomDifNum(max, num);
}

// 数组过滤方法，返回满足条件的数组
function ArrayFilter(array, key, value) {
    function checked(obj) {
        return obj[key] === value;
    }

    return array.filter(checked);
}

// 数组过滤方法，返回满足条件的数组
function BigArrayFilter(array, key, value, key1, value1) {
    function checked(obj) {
        return obj[key] === value && obj[key1] === value1;
    }

    return array.filter(checked);
}

// 根据pk 或者 id 返回 name
function getNameByKey(str, arr, key, key2, key3) {
    if (!key || !arr || !str || !key2 || arr.length === 0) {
        return null;
    }
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i][key] === str) {
            if (key3) {
                return arr[i][key3] + arr[i][key2];
            }
            return arr[i][key2];
        }
    }
    return null;
}

// 根据key值，返回所有value组成的字符串，用','隔开
function getNamesByArr(arr, key, key2) {
    if (!arr || arr.length === 0 || !key) {
        return '';
    }
    const len = arr.length;
    let str = '';
    for (let i = 0; i < len; i++) {
        if (i < len - 1) {
            str = str + arr[i][key] + arr[i][key2] + ',';
        } else {
            str = str + arr[i][key] + arr[i][key2];
        }
    }
    return str;
}


// 根据序号选择颜色，如果超过颜色种类，则从0开始
function getColorByIndex(index, colorsArr) {
    if (colorsArr.length === 0 || isNaN(index)) {
        return '';
    }
    const i = index % 10;
    return colorsArr[i];
}

// 从数组中找出数据最小的那一项，并返回这个项的index
function getTheleast(arr, count, key) {
    if (!arr || !count || !key || arr.length === 0) {
        return null;
    }
    const len = arr.length;
    let num = count;
    let index = 0;
    for (let i = 0; i < len; i++) {
        if (arr[i][key] && arr[i][key] < num) {
            num = arr[i][key];
            index = i;
        }
    }
    return index;
}

// 查找数组中满足条件的第一个元素，并返回这个元素的下标
function getIndexByFilter(array, key, value, key2, value2) {
    if (!array || !key || array.length === 0 || !key2) {
        return null;
    }
    if (Array.prototype.findIndex) {
        return array.findIndex((item) => {
            return item[key] === value && item[key2] === value2;
        });
    }
    const len = array.length;
    let index;
    for (let i = 0; i < len; i++) {
        if (array[i][key] === value && array[i][key2] === value2) {
            index = i;
            break;
        }
    }
    return index;
}

// 校验元素是否已经在数组中,且show为true
function checkRepeat(arr, key, value, key2) {
    if (!arr || !key) {
        return false;
    }
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i][key] === value && arr[i][key2] === true) {
            return true;
        }
    }
    return false;
}

// 校验元素是否已经在数组中,且show为false
function checkRepeatFalse(arr, key, value, key2) {
    if (!arr || !key) {
        return null;
    }
    const obj = {
        repeat: true,
        show: true,
        index: null
    };
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i][key] === value && arr[i][key2] === false) {
            obj.show = false;
            obj.index = i;
            return obj;
        }
    }
    return false;
}

// 返回满足条件的值的下标
function getIndexByValue(arr, value) {
    if (Array.prototype.findIndex) {
        return arr.findIndex((item) => {
            return item === value;
        });
    }
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i] === value) {
            return i;
        }
    }
    return null;
}

// 遍历数组，找出有没有指定的选项
function ArrHasEle(arr, key, value) {
    if (!arr || !key || !value) {
        return null;
    }
    if (Array.prototype.some) {
        return arr.some((item) => {
            return item[key] === value;
        });
    }
    const len = arr.length;
    for (let i = 0; i < len; i++) {
        if (arr[i][key] === value) {
            return true;
        }
    }
    return false;
}

// 获取一个对象的所有key
function getKeys(object) {
    const keys = [];
    for (const val in object) {
        if (object.hasOwnProperty(val)) {
            keys.push(val);
        }

    }
    return keys;
}

// 获取一个对象的所有value
function getValues(object) {
    const values = [];
    for (const val in object) {
        if (object.hasOwnProperty(val)) {
            values.push(object[val]);
        }
    }
    return values;
}

// 阻止事件冒泡的通用方法
function stopBubble(e) {
    //  如果提供了事件对象，则这是一个非IE浏览器
    if (e && e.stopPropagation) {
        //  因此它支持W3C的stopPropagation()方法
        e.stopPropagation();
    } else {
        //  否则，我们需要使用IE的方式来取消事件冒泡
        window.event.cancelBubble = true;
    }
}

// 根据状态数字返回状态汉字
function getStatusByNum(num) {
    switch (num) {
        case 0 :
            return '';
        case 1 :
            return '成功';
        case 2 :
            return '失败';
        case 3 :
            return '执行中';
        case 4 :
            return '暂停';
        case 5 :
            return '部分完成';
        default:
            return '';
    }
}

// 根据汉字返回英文的key
function getKeybyValue(value) {
    switch (value) {
        case '新增':
            return 'A_COUNT';
        case '修改':
            return 'U_COUNT';
        case '删除':
            return 'D_COUNT';
        case '表':
            return 'Table';
        case '视图':
            return 'View';
        case '存储过程':
            return 'Procedure';
        case '字段':
            return 'Column';
    }
}

// 数组求和的方法
function ArraySum(array) {
    const len = array.length;
    if (len === 0) {
        return null;
    }
    if (typeof array === 'string') {
        return array;
    }
    let str = '';
    for (let i = 0; i < len; i++) {
        if (i < len - 1) {
            str = str + array[i] + ',';
        } else {
            str = str + array[i];
        }
    }
    return str;
}

// 判断数组中的元素某个属性是否都等于某个值
function ObjectHasEqual(obj, value) {
    return obj['Table'] + obj['View'] + obj['Procedure'] + obj['Column'] === value;
}

// 根据执行状态数字返回状态汉字
function getJobStatusByNum(num) {
    switch (num) {
        case 0 :
            return '';
        case 1 :
            return '成功';
        case 2 :
            return '失败';
        case 3 :
            return '执行中';
        case 4 :
            return '暂停';
        case 5 :
            return '部分完成';
        default:
            return '';
    }
}

// 根据检核规则的英文返回中文
function getChcekRuleName(name) {
    switch (name) {
        case 'UniqueIntegrityCheck':
            return '完整性/唯一检查';
        case 'UniqueNotNullCheck':
            return '完整性/非空检查';
        case 'UniqueForeignCheck':
            return '完整性/外键检查';
        case 'CorrectLengthCheck':
            return '正确性/长度检查';
        case 'CorrectCodeCheck':
            return '正确性/代码检查';
        case 'ConsistencyCheck':
            return '一致性检查';
        case 'CustomCheck':
            return '自定义检查';
        default:
            return '';
    }
}

// 去除数组中重复的元素，
function DeleteArrRepeat(arr, key) {
    const len = arr.length;
    const res = [];
    const obj = {};
    for (let i = 0; i < len; i++) {
        if (!obj[arr[i][key]]) {
            res.push(arr[i]);
            obj[arr[i][key]] = true;
        }
    }
    return res;
}

export default {
    CONSOLE_CTX,
    origin,
    showMessage,
    getIconClass,
    showConfirm,
    IEBrowser,
    getDifName,
    ifRaname,
    getArr,
    formatDateTime,
    getWeekDayByValue,
    getTimeByStr,
    campareBytime,
    setTimeNowStr,
    typeArr,
    getArrByStr,
    ArrayFilter,
    BigArrayFilter,
    getNameByKey,
    getNamesByArr,
    getDifTaskName,
    getColorByIndex,
    getTheleast,
    getIndexByFilter,
    getKeyByClassName,
    checkRepeat,
    checkRepeatFalse,
    getIndexByValue,
    ArrHasEle,
    getKeys,
    stopBubble,
    getStatusByNum,
    getKeybyValue,
    ArraySum,
    ObjectHasEqual,
    getJobStatusByNum,
    getChcekRuleName,
    DeleteArrRepeat
};

