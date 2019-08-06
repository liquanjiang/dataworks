import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
const dz = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const origin = window.location.origin ? window.location.origin : dz;
@Injectable({
  providedIn: 'root'
})
export class StreamSetsService {

    constructor(public http: HttpClient) { }

    private api = 'dwb/';

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        let msg = '获取数据失败';
        if (error.status === 500) {
            msg = '系统提示:调用远程服务失败';
            console.log('500:调用远程服务获取数据失败：' + error.url + '');
        } else if (error.status === 404) {
            msg = '系统提示:未找到相应接口';
            console.log('404:未找到以下接口：' + error.url + '');
        } else if (error.status === 401) {
            console.error('401:登录超时，请重新登录');
            $('.loading').hide();
            window.localStorage.setItem('timeoutType', '401');
            window.location.href = origin + '/dataworks#/login';
        }
        console.log(msg);
        return Promise.reject(error.message || error);
    }

    /**
     * 获取右侧节点列表
     * @returns {Promise<any>}
     */
    getStageLibarays(): Promise<any> {
        const url = this.api + 'di/taskmanage/etlnodes';
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /**
     * 获取任务的配置信息
     * @param pkTask 当前任务id
     * @returns {Promise<any>}
     */
    getStage(pkTask): Promise<any> {
        const url = this.api + 'di/taskmanage/taskgraph?pkTask=' + pkTask;
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /**
     * 获取任务的基本信息
     * @param pkTask 当前任务id
     * @returns {Promise<any>}
     */
    getStageInfo(pkTask): Promise<any> {
        const url = this.api + 'di/taskmanage/taskinfo?pkTask=' + pkTask;
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /**
     * 获取任务的状态
     * @param pkTask 当前任务id
     * @param userName 用户名
     * @returns {Promise<any>}
     */
    getStageStatus(pkTask, userName): Promise<any> {
        const url = this.api + 'di/taskmanage/status?taskId=' + pkTask + '&userName=' + userName;
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }


    /**
     * 保存当前任务的配置信息
     * @param config 配置信息
     * @returns {Promise<any>}
     */
    savePipelineConfig(config) {
        const url = this.api + 'di/taskmanage/savegraph';
        return this.http.post(url, config).toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /**
     * 执行当前任务
     *
     * @param pkTask 任务id
     * @param userName 用户名
     * @returns {Promise<any>}
     */
    startPipeline(pkTask, userName) {
        const url = this.api + 'di/taskmanage/start?taskId=' + pkTask + '&userName=' + userName;
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /**
     * 停止当前任务
     * @param pkTask 任务id
     * @param userName 用户名
     * @returns {Promise<any>}
     */
    stopPipeline(pkTask, userName) {
        const url = this.api + 'di/taskmanage/stop?taskId=' + pkTask + '&userName=' + userName;
        return this.http.get(url) .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }
}
