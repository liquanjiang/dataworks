import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';

@Injectable({
  providedIn: 'root'
})
export class LogService {
    // 所有的webSocket列表
    webSocketsList: any = {};
    // 所有日志列表
    logList: any = {};
    // 当服务端websockets响应时触发此事件
    onWebSocketMessage = new Subject();
    // 监听websockets的实例，只保证有一个实例存在
    listener;
    constructor() { }

    addWebSocket(pkTask) {
        if (this.webSocketsList[pkTask]) {
            return;
        }
        const that = this;
        const ws = new WebSocket('ws://' + window.location.host + '/dwb/log/debug/' + pkTask);
        ws.onopen = function() {
            // Web Socket 已连接上，使用 send() 方法发送数据
            that.logList[pkTask] = [];
            ws.send(pkTask);
        };

        ws.onmessage = function (evt) {
            console.log(evt.data);
            const received_msg = JSON.parse(evt.data);
            if (received_msg.code !== 2) {
                that.logList[pkTask].push(received_msg);
            }
            that.onWebSocketMessage.next(received_msg);
        };
        ws.onerror = function() {
            // 关闭 websocket
            delete that.webSocketsList[pkTask];
            that.onWebSocketMessage.next({code: 3, msg: 'error'});
        };
        ws.onclose = function() {
            // 关闭 websocket
            if (that.webSocketsList[pkTask]) {
                delete that.webSocketsList[pkTask];
                that.onWebSocketMessage.next({code: 2, msg: 'close'});
            }
        };
        this.webSocketsList[pkTask] = ws;
    }

    getLog(pkTask) {
        return this.logList[pkTask];
    }

    closeWebSocket(pkTask) {
        if (this.webSocketsList[pkTask]) {
            this.webSocketsList[pkTask].close();
        }
    }
}
