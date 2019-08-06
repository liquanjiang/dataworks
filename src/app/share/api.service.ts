/**
 * Created by LiQuanjiang on 2018/8/23 14:16.
 * Description:
 */
import { Injectable } from '@angular/core';
import { Headers, Http, URLSearchParams, Response, RequestOptions } from '@angular/http';
import { HttpHeaders, HttpClient, HttpResponse, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { AuthGuardService } from './auth-guard.service';
import Util from '../share/common/util';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/delay';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/debounceTime';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/observable/forkJoin';
import { LoginService } from './login.service';

const dz = window.location.protocol + '//' + window.location.hostname + (window.location.port ? ':' + window.location.port : '');
const origin = window.location.origin ? window.location.origin : dz;

@Injectable()
export class ApiService {
    constructor(public http: HttpClient) {
    }

    public workbench = 'workbench-back';
    public WORKBENCH = 'console/';
    public DWB = 'dwb/';
    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    private Postheaders = new HttpHeaders({
        'accept': 'text/html,application/json,application/xhtml+xml,application/xml,*/*',
        'charset': 'UTF-8',
        'Content-Type': 'application/x-www-form-urlencoded'
    });
    private cache = new HttpHeaders({ 'Cache-Control': 'no-cache', 'Pragma': 'no-cache', 'Expires': '-1' });
    private _userName = 'Sherlock Holmes';
    private usersUrl = '/api/users';  // URL to web api

    public handleMessage(response: any) {
        if (response.error) {
            // Util.showMessage(response.error, 'error');
            console.log(response.error);
        }
        if (response.info) {
            // Util.showMessage(response.info, 'info');
            console.log(response.info);
        }
        return response;
    }

    public handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        let msg = '获取数据失败';
        if (error.status === 500) {
            msg = '系统提示:调用远程服务失败';
            console.error('500:调用远程服务获取数据失败：' + error.url + '');
        } else if (error.status === 404) {
            msg = '系统提示:未找到相应接口';
            console.error('404:未找到以下接口：' + error.url + '');
        } else if (error.status === 401) {
            console.error('401:登录超时，请重新登录');
            $('.loading').hide();
            window.localStorage.setItem('timeoutType', '401');
            window.location.href = origin + '/dataworks#/login';
        }
        console.log(msg);
        return Promise.reject(error.message || error);
    }

    public extractData(res: Response) {
        const body: any = res.json();
        if (body.error) {
            console.log(body.error);
        }
        return body || {};
    }

    /*-------------------------http请求demo------------------------*/

    // get请求示例
    loadApiLists() {
        const url = this.workbench + '/risk/document/apis/';
        return this.http.get(url)
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    /*-------------------------用户设置中的请求接口方法------------------------*/

    // 获取数据的x-www-form-urlencoded的序列化参数
    urlencoded(data: any): any {
        const params = new HttpParams();
        for (const key of Object.keys(data)) {
            params.set(key, data[key]);
        }
        return params;
    }

    // 获取所有用户列表 （GET请求）
    getAllUserList() {
        const url = this.WORKBENCH + 'user/loadAllUsers';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    /*----------------------------dataworks -配置管理-接口开始-----------------------------------*/

    /*// 加载所有配置项的接口
    loadAllConfig(pageindex: any, recordPerPage: any): Promise<any> {
        const url = this.DWB + 'configmanage/ds/list';
        const data = 'pageindex=' + pageindex + '&recordPerPage=' + recordPerPage;
        return this.http.post(url, data, { headers: this.Postheaders })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }*/

    // 新增/修改配置接口 （POST请求）
    addConfig(data: any): Promise<any> {
        const param = JSON.stringify(data);
        const url = this.DWB + 'configmanage/ds/add';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 编辑/修改配置接口 （POST请求）
    editConfig(data: any): Promise<any> {
        const param = JSON.stringify(data);
        const url = this.DWB + 'configmanage/ds/edit';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 删除配置接口 （POST请求）
    deleteConfig(data: any): Promise<any> {
        const url = this.DWB + 'configmanage/ds/delete';
        const param = JSON.stringify(data);
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 测试链接的接口 （POST请求）
    testUrlLink(data): Promise<any> {
        const param = JSON.stringify(data);
        const url = this.DWB + 'configmanage/ds/testds';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 获取预制的数据源类型所有信息 （POST请求）
    getDSType(): Promise<any> {
        const url = this.DWB + 'configmanage/ds/dstype';
        return this.http.post(url, {}, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    /*----------------------------dataworks -配置管理-接口结束-----------------------------------*/

    /*----------------------------dataworks -元数据采集管理-接口开始-----------------------------------*/

    // 获取zTree数据（GET请求）
    getdirTree(): Promise<any> {
        const url = this.DWB + 'metamanage/dirtree';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 更新zTree节点(新增或重命名目录)（POST请求）
    updateTree(data: any): Promise<any> {
        const url = this.DWB + 'metamanage/dirsave';
        const param = JSON.stringify(data);
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 删除目录（POST请求）(headers为form)
    deleteFolder(pk: any): Promise<any> {
        const param = 'pk=' + pk;
        const url = this.DWB + 'metamanage/dirdel';
        return this.http.post(url, param, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 新增或修改采集任务（POST请求）
    addOrEditJob(data: any): Promise<any> {
        const url = this.DWB + 'metamanage/jobsave';
        const param = JSON.stringify(data);
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 删除之前获取删除的目录有没有内容 （POST请求）
    ifConfirmDel(pk: any): Promise<any> {
        const param = new HttpParams().set('pk', pk);
        const url = this.DWB + 'metamanage/befdirdel';
        return this.http.post(url, param, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 删除采集任务列表中的采集任务（POST请求）
    deleteJob(data: any): Promise<any> {
        const url = this.DWB + 'metamanage/jobdel';
        const param = JSON.stringify(data);
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 新增或修改采集任务时的下拉选项获取（GET请求）
    getMetaDs(): Promise<any> {
        const url = this.DWB + 'configmanage/ds/metaDs';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 新增或修改采集配置 （POST请求）
    addOrEidtScheSet(data): Promise<any> {
        const url = this.DWB + 'scheduler/addConsoleScheSet';
        const params = new HttpParams().set('addFlag', data.addFlag).set('businessId', data.businessId)
            .set('triggerName', data.triggerName).set('schePeriod', data.schePeriod)
            .set('selectTimes[]', data.selectTimes).set('specificTime', data.specificTime)
            .set('startTime', data.startTime).set('endTime', data.endTime).set('pause', data.pause)
            .set('buildCls', data.buildCls).set('moduleId', data.moduleId);
        return this.http.post(url, params, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 立即执行采集任务新接口（POST请求）
    newmetaExec(data): Promise<any> {
        const params = new HttpParams().set('businessId', data.businessId).set('buildCls', data.buildCls)
            .set('triggerName', data.triggerName).set('moduleId', data.moduleId);
        // const url = this.WORKBENCH + 'dw/scheduler/justInTimehaveLog';
        const url = this.DWB + 'scheduler/justInTimehaveLog';
        return this.http.post(url, params, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 根据配置的主键ID获取配置信息（GET请求）
    getScheSet(triggerId): any {
        const url = this.DWB + 'scheduler/loadConsoleScheSet?triggerId=' + triggerId;
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 获取日志作业ID（post请求）
    getLogId(triggerid): Promise<any> {
        const params = new HttpParams().set('triggerid', triggerid);
        const url = this.DWB + 'metamanage/loadtaskidbytrigger';
        return this.http.post(url, params, { headers: this.Postheaders })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据作业ID获取日志信息 GET请求）
    getlogsById(ID): Promise<any> {
        const params = new HttpParams().set('jobId', ID);
        const url = this.WORKBENCH + 'dw/scheduler/loadTasksByJobId';
        return this.http.get(url, { params: params })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 采集列表页面查询某个数据库的信息接口（post请求）
    getDetailsBypk(pk): Promise<any> {
        const data = { pk: pk };
        const param = JSON.stringify(data);
        const url = this.DWB + 'metamanage/query/schemadetail';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 立即执行，查看日志，修改任务，修改配置，新增配置，删除任务之前执行接口，验证任务是否还存在（POST请求）
    BeforeOpeation(pk): Promise<any> {
        const data = { key: pk };
        const param = JSON.stringify(data);
        const url = this.DWB + 'metamanage/befconsoledo';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    /*----------------------------dataworks -元数据采集管理-接口结束-----------------------------------*/

    /*----------------------------dataworks -元数据查询-接口开始-----------------------------------*/

    // 元数据类型获取借口（GET请求）
    getMetaTypes(): Promise<any> {
        const url = this.DWB + 'metamanage/query/modeltypelist';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 元数据详情（查询基础信息）（post请求）
    getMetaQueryDetail(pk): Promise<any> {
        const data = { pk: pk };
        const param = JSON.stringify(data);
        const url = this.DWB + 'metamanage/query/detail';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 元数据详情（影响关系）（GET）
    getMetaRelationShip(pk): Promise<any> {
        const url = this.DWB + 'metamanage/query/infrelationship?pk=' + pk;
        return this.http.get(url, { headers: this.Postheaders, responseType: 'text' })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 元数据详情（血缘关系）（GET）
    getMetaBloodRelationShip(pk): Promise<any> {
        const url = this.DWB + 'metamanage/query/bloodrelationship?pk=' + pk;
        return this.http.get(url, { headers: this.Postheaders, responseType: 'text' })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据数据表和字段名称查询字段的关联关系(GET)
    getColumnRelationShip(obj): Promise<any> {
        const pk = obj.pk;
        const name = obj.columnname;
        const url = this.DWB + `metamanage/query/relations?pk=${pk}&name=${name}`;
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 获取所有的数据源列表（GET）
    getAllSchemas(): Promise<any> {
        const url = this.DWB + `metamanage/schemas`;
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据数据源的PK查看某个schema下的表
    getTablesBySchema(pk): Promise<any> {
        const url = this.DWB + `metamanage/tables?pk=${pk}`;
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据表的pk查看某个表下的字段
    getColumnsByTable(pk): Promise<any> {
        const url = this.DWB + `metamanage/columns?pk=${pk}`;
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 添加影响关系 (POST)
    addRelation(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'metamanage/addRelation';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    /*----------------------------dataworks -元数据查询-接口结束-----------------------------------*/

    /*----------------------------dataworks -数据地图-接口开始-----------------------------------*/

    // 数据地图的统计（GET）
    getMapCount(): Promise<any> {
        const url = this.DWB + 'metamanage/map/categorycount';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据选择的视图名、存储过程名、表名查询元数据地图 (POST)
    queryMetaMapByName(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'metamanage/map/querymapbyname';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    // 查看某一个库下的数据地图 （POST）
    queryMetaSchema(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'metamanage/map/getmetamap';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    /*----------------------------dataworks -数据地图-接口结束-----------------------------------*/

    /*----------------------------dataworks -数据集成-任务管理-接口开始-----------------------------------*/

    // 任务管理树的加载（GET）
    getTaskTree(): Promise<any> {
        const url = this.DWB + 'di/taskmanage/show';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 任务管理树，新建目录 （POST）
    addTaskTreeFolder(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/taskmanage/addDir';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 任务管理树，添加任务 （POST）
    addTaskTreeTask(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/taskmanage/addTask';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除目录或任务 （POST）
    deleteFolderOrTask(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/taskmanage/delete';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除任务之前检查目录下是否有子目录或任务
    checkDir(pk): Promise<any> {
        const url = this.DWB + 'di/taskmanage/checkDelDir?pk=' + pk;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 修改目录或任务的名称 （POST）
    editFolderOrTask(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/taskmanage/modify';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 复制任务的接口 （POST）
    cotyTask(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/taskmanage/taskCopy';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    /*----------------------------dataworks -数据集成-任务管理-接口结束-----------------------------------*/

    /*----------------------------dataworks -数据集成-作业管理-接口开始-----------------------------------*/

    // 加载作业树 （GET）
    loadWorkTree(): Promise<any> {
        const url = this.DWB + 'di/jobmanage/jobtree';
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 新增目录 （POST）
    addWorkFolder(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/savedir';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 修改目录名称 （POST）
    modifyWorkFolder(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/savedir';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 新增作业 （POST）
    addWork(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/savejob';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 修改作业名称 （POST）
    modifyWorkName(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/renamejob';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 修改作业任务信息 （POST）
    modifyWorkTask(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/modifyjob';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除作业 （POST）
    deleteWork(pk): Promise<any> {
        const data = {
            'pkJob': pk
        };
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/deljob';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then()
            .catch(this.handleError);
    }

    // 删除目录 （POST）
    deleteWorkFolder(pk): Promise<any> {
        const data = {
            'pk': pk
        };
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/deldir';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除一个目录之前的判断 （GET）
    confirmDeleteWorkFolder(pk): Promise<any> {
        const url = this.DWB + 'di/jobmanage/befdeldir?pk=' + pk;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 复制作业 （POST）
    copyWork(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'di/jobmanage/copyjob';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 作业管理，加载所有的任务列表 （GET）
    loadTaskList(task): Promise<any> {
        let url;
        if (task) {
            url = this.DWB + 'di/jobmanage/tasklist?task=' + task;
        } else {
            url = this.DWB + 'di/jobmanage/tasklist';
        }
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 读取作业的任务流程图（GET）
    readTaskGraph(pkJob): Promise<any> {
        const url = this.DWB + 'di/jobmanage/taskgraph?pkJob=' + pkJob;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 作业流程图中，根据选中的任务，查询任务的基本信息（GET）
    queryTaskInfo(taskPk): Promise<any> {
        const url = this.DWB + 'di/taskmanage/taskinfo?pkTask=' + taskPk;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 查询作业的实时状态，（GET）
    queryJobStatus(jobId): Promise<any> {
        const url = this.DWB + 'di/jobmanage/jobstatus?jobId=' + jobId;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 正在执行中的作业立即停止操作（GET）
    JobStop(jobId): Promise<any> {
        const url = this.DWB + 'di/jobmanage/jobstop?jobId=' + jobId;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 作业执行中的任务的实时状态和作业日志信息 （GET）
    getRealtimeLog(jobId): Promise<any> {
        const url = this.DWB + 'di/jobmanage/schdlog?pkJob=' + jobId;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 根据作业的pk查询作业的所有最新的基本信息 （GET）
    getJobInfoByPK(pkJob): Promise<any> {
        const url = this.DWB + 'di/jobmanage/basicInfo?pkJob=' + pkJob;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    /*----------------------------dataworks -数据集成-作业管理-接口结束-----------------------------------*/

    /*----------------------------dataworks -数据集成-调度监控-接口开始-----------------------------------*/

    // 获取作业日志 （GET）
    getSchLog(jobId): Promise<any> {
        const url = this.WORKBENCH + 'scheduler/loadTasksByJobId?jobId=' + jobId;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }


    /*----------------------------dataworks -数据集成-调度监控-接口结束-----------------------------------*/

    /*----------------------------dataworks -许可验证-----------------------------------*/
    checkLicense(url): Promise<any> {
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    /*------------------------------dataworks -数据质量管理-变更查询-接口开始-------------------------------*/

    // 查询变更数据的接口 （POST）
    changeQuery(data): Promise<any> {
        const params = JSON.stringify(data);
        const url = this.DWB + 'dqmanage/historygraph';
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 获取所有数据库的接口 （GET）
    getAllSchema(): Promise<any> {
        const url = this.DWB + 'dqmanage/schemas';
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    /*------------------------------dataworks -数据质量管理-变更查询-接口结束-------------------------------*/

    /*------------------------------dataworks -数据质量管理-检核结果-接口开始-------------------------------*/

    // 头部查询结果的接口 （GET）
    getCheckResult(date): Promise<any> {
        const url = this.DWB + 'dqmanage/check/statistics?date=' + date;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 获取echarts数据 (GET)
    queryEchartsData(date): Promise<any> {
        const url = this.DWB + 'dqmanage/check/graph?date=' + date;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    /*------------------------------dataworks -数据质量管理-检核结果-接口结束-------------------------------*/

    /*----------------检验定义-----------------------*/

    // 获取系统列表的接口 （GET）
    getDsNames(): Promise<any> {
        const url = this.DWB + 'dqmanage/getdatasource';
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 获取表和字段的接口 （GET）
    gettable(dsName): Promise<any> {
        const url = this.DWB + 'dqmanage/gettable?dsName=' + dsName;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    getcolumn(dsName, tableName): Promise<any> {
        const url = this.DWB + 'dqmanage/getcolumn?dsName=' + dsName + '&tableName=' + tableName;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 保存 （POST）
    dqsave(checkObj): Promise<any> {
        const url = this.DWB + 'dqmanage/dqsave';
        return this.http.post(url, checkObj, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 修改
    getdq(pkQuality): Promise<any> {
        const url = this.DWB + 'dqmanage/getdq?pkQuality=' + pkQuality;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除
    dqdel(pkQuality): Promise<any> {
        const url = this.DWB + 'dqmanage/dqdel';
        const params = new HttpParams().set('pkQuality', pkQuality);
        return this.http.post(url, params, { headers: this.Postheaders })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核结果-获取数据源列表
    getDataSourceList(date): Promise<any> {
        const url = this.DWB + 'dqmanage/check/ds?date=' + date;
        return this.http.get(url, { headers: this.Postheaders })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核结果-获取检核规则类型列表
    getRuleTypes(): Promise<any> {
        const url = this.DWB + 'dqmanage/check/rules';
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核结果-获取问题记录的表头
    getIdentfields(pk, date): Promise<any> {
        const url = this.DWB + 'dqmanage/check/identfields?pk=' + pk + '&date=' + date;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核结果-根据查询的问题记录的详情决定是否显示
    getRecordDetails(pk, date): Promise<any> {
        const url = this.DWB + `dqmanage/check/issueRecord?pk=${pk}&date=${date}&limit=10&page=1`;
        return this.http.get(url, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核定义获取zTree数据（GET请求）
    getCheckTree(): Promise<any> {
        const url = this.DWB + 'dqmanage/dirtree';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核定义更新zTree节点(新增或重命名目录)（POST请求）
    updateCheckTree(data: any): Promise<any> {
        const url = this.DWB + 'dqmanage/dirsave';
        const param = JSON.stringify(data);
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 检核定义删除目录（POST请求）(headers为form)
    deleteCheckFolder(pk: any): Promise<any> {
        const param = 'pk=' + pk;
        const url = this.DWB + 'dqmanage/dirdel';
        return this.http.post(url, param, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 删除之前获取删除的目录有没有内容 （POST请求）
    ifCheckConfirmDel(pk: any): Promise<any> {
        const param = new HttpParams().set('pk', pk);
        const url = this.DWB + 'metamanage/befdirdel';
        return this.http.post(url, param, { headers: this.Postheaders })
            .toPromise()
            .then(res => res as any)
            .catch(this.handleError);
    }

    // 检核定义-操作之前检查数据状态
    BeforeCheck(pk): Promise<any> {
        const data = { key: pk };
        const param = JSON.stringify(data);
        const url = this.DWB + 'dqmanage/befconsoledo';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 检核定义，根据规则主键获取调度的triggerid
    loadCheckId(triggerid): Promise<any> {
        const params = new HttpParams().set('triggerid', triggerid);
        const url = this.DWB + 'dqmanage/loadtaskidbytrigger';
        return this.http.post(url, params, { headers: this.Postheaders })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 订阅报告获取数据源
    getReportDataSourceList(): Promise<any> {
        const url = this.DWB + 'dqmanage/report/dsSelect';
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 保存订阅报告
    saveReport(param): Promise<any> {
        const url = this.DWB + 'dqmanage/report/add';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    updateReport(param) {
        const url = this.DWB + 'dqmanage/report/update';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 删除
    reportDel(pk): Promise<any> {
        const url = this.DWB + 'dqmanage/report/delete';
        return this.http.post(url, { pk: pk }, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    // 订阅报告操作之前的检查
    beforeReport(pk): Promise<any> {
        const data = { pk: pk };
        const param = JSON.stringify(data);
        const url = this.DWB + 'dqmanage/report/befconsoledo';
        return this.http.post(url, param, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    getReportDetail(pk, checkDate?) {
        let url = this.DWB + 'dqmanage/report/detail?pk=' + pk;
        if (checkDate) {
            url += '&checkDate=' + checkDate;
        }
        return this.http.get(url)
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

    getIssuerecord(params) {
        const url = this.DWB + `dqmanage/report/issuerecord`;
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response as any)
            .catch(this.handleError);
    }

}

