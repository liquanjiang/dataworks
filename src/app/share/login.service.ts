import { Injectable } from '@angular/core';
import { HttpHeaders, HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
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

@Injectable()
export class LoginService {

    constructor(private http: HttpClient) {
    }

    private _userName = 'Sherlock Holmes';
    private header_image = new HttpHeaders({ 'Content-Type': 'image/jpeg' });
    private headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    public workbench = 'console/';
    public appKey = 'dataworks';

    private handleMessage(response: any) {
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

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        let msg = '获取数据失败';
        if (error.status === 500) {
            msg = '系统提示:调用远程服务失败';
            console.log('500:调用远程服务获取数据失败：' + error.url + '');
        } else if (error.status === 404) {
            msg = '系统提示:未找到相应接口';
            console.log('404:未找到以下接口：' + error.url + '');
        }
        console.log(msg);
        return Promise.reject(error.message || error);
    }

    private extractData(res: Response) {
        const body: any = res.json();
        if (body.error) {
            console.log(body.error);
        }
        return body || {};
    }

    /*-------------------------http请求demo------------------------*/

    // get请求示例
    checkUser(username: any): Promise<any> {
        const url = this.workbench + 'user/checkUser?userName=' + username;
        return this.http.get(url)
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    // 用户登录
    login(username: any, password: any, validation: any): Promise<any> {
        const url = 'master/login';
        const obj = {
            name: 1,
            value:2
        };
        const params = JSON.stringify(obj);
       // const params = new HttpParams().set('username', username).set('password', password).set('captcha', validation);
        return this.http.post(url, params, { headers: this.headers })
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    // 获取登录验证码
    getLoginValidation() {
        const url = this.workbench + 'genCaptcha/login';
        return this.http.get(url, { headers: this.header_image, responseType: 'blob' })
            .toPromise()
            .then(res => res)
            .catch(this.handleError);
    }

    // 获取用户信息
    getLoginUserInfo() {
        const url = this.workbench + 'login/getUserInfo';
        return this.http.get(url)
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    // 获取菜单信息
    getMenus(moduleCode: string, roleCode: string) {
        const url = this.workbench + 'menus?moduleCode=' + moduleCode + '&roleCode=' + roleCode;
        return this.http.get(url)
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    // 注销
    logout() {
        const url = this.workbench + 'logout';
        return this.http.get(url)
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }

    // 重置密码
    resetPassword(userPk: string, password: any, oldPassword: string): Promise<any> {
        const url = this.workbench + 'user/modifyUserPwd';
        const params = new HttpParams().set('userPk', userPk).append('password', password).append('oldPassword', oldPassword);
        return this.http.post(url, {}, { params: params })
            .toPromise()
            .then(response => response)
            .catch(this.handleError);
    }
}
