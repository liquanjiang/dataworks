import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Http } from '@angular/http';
import { LoginService } from './login.service';
import { CookieService } from 'ngx-cookie-service';
import Util from '../share/common/util';

@Injectable()
export class AuthGuardService implements CanActivate {
    constructor(private http: Http, private loginService: LoginService, private router: Router, private cookieService: CookieService) {
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        const url: string = state.url;
        return this.checkLogin(url);
    }

    canActivateChild(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
        return this.canActivate(route, state);
    }

    checkLogin(url: string): Promise<boolean> {
        // 检查cookie，如果cookie中的SHAREJSESSIONID已经被清空，说明登录已超时，不需要再发请求检验登录状态
        const session = this.cookieService.get('SHAREJSESSIONID');
        if (!session || session.length === 0) {
            this.toLoginPage();
            return Promise.resolve(false);
        }
        const checkLogUrl = this.loginService.workbench + 'login/getUserInfo';
        return this.http.get(checkLogUrl)
            .toPromise()
            .then((response: any) => {
                const result = response.json();
                let isLogin = false;
                if (result) {
                    isLogin = true;
                    window.sessionStorage.setItem('userPhone', result.userPhone);
                    window.sessionStorage.setItem('userPK', result.userPk);
                    window.sessionStorage.setItem('userPwd', result.userPwd);
                    window.sessionStorage.setItem('userCaption', result.userCaption);
                    window.sessionStorage.setItem('userEmail', result.userEmail);
                    window.sessionStorage.setItem('userName', result.userName);
                } else {
                    window.sessionStorage.removeItem('userPhone');
                    window.sessionStorage.removeItem('userPK');
                    window.sessionStorage.removeItem('userPwd');
                    window.sessionStorage.removeItem('userCaption');
                    window.sessionStorage.removeItem('userEmail');
                    window.sessionStorage.removeItem('userName');
                    this.toLoginPage();
                }
                return isLogin;
            })
            .catch(() => {
                window.sessionStorage.removeItem('userPhone');
                window.sessionStorage.removeItem('userPK');
                window.sessionStorage.removeItem('userPwd');
                window.sessionStorage.removeItem('userCaption');
                window.sessionStorage.removeItem('userEmail');
                window.sessionStorage.removeItem('userName');
                this.toLoginPage();
                return false;
            });
    }

    // 用于在登录页面时验证登录状态，已登录则直接跳转到后台
    canLogin(): Promise<boolean> {
        const session = this.cookieService.get('SHAREJSESSIONID');
        if (!session || session.length === 0) {
            return Promise.resolve(true);
        }
        const checkLogUrl = this.loginService.workbench + 'login/getUserInfo?time=' + new Date();
        return this.http.get(checkLogUrl)
            .toPromise()
            .then((response: any) => {
                const result = response;
                let canLogin = true;
                if (result) {
                    canLogin = false;
                } else {
                    this.toLoginPage();
                }
                return canLogin;
            })
            .catch(() => {
                return true;
            });
    }

    toLoginPage() {
        const type = window.localStorage.getItem('timeoutType');
        this.cookieService.deleteAll();
        window.sessionStorage.clear();
        window.localStorage.clear();
        const port = window.location.port;
        window.localStorage.setItem('timeoutType', type ? type : 'noRoute');
        if (port === '9091') {
            this.router.navigate(['/login']);
        } else {
            window.location.href = Util.origin + '/dataworks#/login';
        }
    }
}
