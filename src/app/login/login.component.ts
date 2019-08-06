import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { LoginService } from '../share/login.service';
import { AuthGuardService } from '../share/auth-guard.service';
import Util from '../share/common/util';

declare var $: any;

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
    usernameRemind: string;
    passwordRemind: string;
    totalRemind: string;
    passwordCGremind: string;
    rpPasswordCGremind: string;
    userPK: string;
    validationCode: SafeResourceUrl;
    checkData: any; // 用于存放checkUser接口的返回值，在重置密码的时候会用到
    password: string;

    constructor(public authGuardService: AuthGuardService, public loginService: LoginService, private router: Router,
                private route: ActivatedRoute, private sanitizer: DomSanitizer) {
    }

    ngOnInit() {
        this.createCode();
        this.authGuardService.canLogin()
            .then((canLogin) => {
                if (!canLogin) {
                    const href = window.localStorage.getItem('currentHome');
                    if (href) {
                        Util.showMessage('您已经登录', 'info');
                        window.location.href = window.localStorage.getItem('currentHome');
                    }
                } else {
                    const type = window.localStorage.getItem('timeoutType');
                    console.log(type);
                    if (type && type !== 'logout') {
                        Util.showMessage('登录超时，请重新登录', 'info');
                    }
                    window.localStorage.clear();
                }
            });
    }

    checkUser(username: string, password: string): any {
        this.loginService.checkUser(username).then((data) => {
            if (data.roleNames.length === 0) {
                Util.showMessage('当前用户没有设置角色！', 'error');
                return false;
            }
            if (data.roleSize === 0) {
                this.totalRemind = '无登录权限，请联系管理员';
                return;
            } else {
                this.password = password;
                if (password === '000000' && data.reset) {
                    this.checkData = data;
                    $('#resetPasswordModel').modal('show');
                } else {
                    if (data.moduleCodes.length === 0) {
                        Util.showMessage('登陆出现异常', 'warning');
                        return false;
                    }
                    const origin = window.location.origin;
                    let href = '', loginHref = '';
                    if (data.moduleCodes.indexOf('bdp') > -1) {
                        href = origin + '/workbench#/console';
                        loginHref = origin + '/dataworks#/login';
                        window.localStorage.setItem('currentRoleCode', data.roleNames[data.moduleCodes.indexOf('bdp')]);
                        window.localStorage.setItem('currentModule', 'bdp');
                    } else if (data.moduleCodes.indexOf('dw') > -1) {
                        href = origin + '/dataworks#/dwb';
                        loginHref = origin + '/dataworks#/login';
                        window.localStorage.setItem('currentRoleCode', data.roleNames[data.moduleCodes.indexOf('dw')]);
                        window.localStorage.setItem('currentModule', 'dw');
                    }
                    window.localStorage.setItem('userRole', data.roleNames);
                    window.localStorage.setItem('currentHome', href);
                    window.localStorage.setItem('currentLogin', loginHref);
                    window.localStorage.setItem('username', username);
                    window.localStorage.setItem('currentuserName', username);
                    window.location.href = href;
                }
            }
        });
    }

    login(username: HTMLInputElement, password: HTMLInputElement, validation: HTMLInputElement): any {
        const origin = window.location.origin;
        const href = origin + '/dataworks#/dwb';
        window.location.href = href;
        if (username.value.trim() === '') {
            Util.showMessage('用户名不能为空!', 'error');
            return;
        } else {
            this.usernameRemind = '';
        }
        if (password.value.trim() === '') {
            Util.showMessage('密码不能为空!', 'error');
            return;
        } else {
            this.passwordRemind = '';
        }
        if (validation.value.trim() === '') {
            Util.showMessage('请输入验证码!', 'error');
            return;
        }
        this.loginService.login(username.value, password.value, validation.value).then((data) => {
            if (data.success) {
                this.totalRemind = '';
                window.localStorage.setItem('SHAREJSESSIONID', data.SHAREJSESSIONID);
                window.localStorage.setItem('userPK', data.userPK);
                window.sessionStorage.setItem('userPK', data.userPK);
                this.userPK = data.userPK;
                this.checkUser(username.value, password.value);
                window.localStorage.setItem('dataworksappKey', 'dataworks');
            } else {
                this.createCode();
                this.totalRemind = data.message;
                Util.showMessage(data.message, 'error');
                window.localStorage.removeItem('SHAREJSESSIONID');
                window.localStorage.removeItem('userPK');
                window.localStorage.removeItem('dataworksappKey');
            }
        });
    }

    createCode() {
        this.loginService.getLoginValidation().then((res) => {
            const url = URL.createObjectURL(res);
            this.validationCode = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        });
    }

    modifyPassword(newPassword: HTMLInputElement, rpNewPassword: HTMLInputElement) {
        const pwdVal = this.password;
        const newPwdVal = newPassword.value;
        const newPwdValAgain = rpNewPassword.value;
        if (newPwdVal.trim() === '') {
            this.passwordCGremind = '密码不能为空';
            return;
        }
        if (newPwdVal === pwdVal) {
            this.passwordCGremind = '密码不能与原来一致';
            return;
        }
        const regx1 = new RegExp('^[0-9]+$');
        const regx2 = new RegExp('^[a-zａ-ｚＡ-ＺA-Z]+$');
        const regx3 = new RegExp('^[!#$%^&*_-]+$');
        if (regx1.test(this.chartChange(newPwdVal))) {
            this.passwordCGremind = '密码不能由纯数字组成';
            return;
        }
        if (regx2.test(this.chartChange(newPwdVal))) {
            this.passwordCGremind = '密码不能由纯英文组成';
            return;
        }
        if (regx3.test(this.chartChange(newPwdVal))) {
            this.passwordCGremind = '密码不能由纯特殊字符组成';
            return;
        }
        if (newPwdVal.length < 6 || newPwdVal.length > 18) {
            this.passwordCGremind = '密码最小长度为6最大长度18';
            return;
        }
        if (newPwdVal !== newPwdValAgain) {
            this.rpPasswordCGremind = '两次密码输入不一致';
            return;
        }
        this.loginService.resetPassword(this.userPK, newPwdVal, pwdVal).then((datas) => {
            if (datas.pwdError) {
                this.rpPasswordCGremind = datas.pwdError;
            } else {
                $('#resetPasswordModel').modal('hide');
                const data = this.checkData;
                const origin = window.location.origin;
                let href = '', loginHref = '';
                if (data.moduleCodes.indexOf('bdp') > -1) {
                    href = origin + '/workbench#/console';
                    loginHref = origin + '/dataworks#/login';
                    window.localStorage.setItem('currentRoleCode', data.roleNames[data.moduleCodes.indexOf('bdp')]);
                } else if (data.moduleCodes.indexOf('dw') > -1) {
                    href = origin + '/dataworks#/dwb';
                    loginHref = origin + '/dataworks#/login';
                    window.localStorage.setItem('currentRoleCode', data.roleNames[data.moduleCodes.indexOf('dw')]);
                }
                window.localStorage.setItem('userRole', data.roleNames);
                window.localStorage.setItem('currentHome', href);
                window.localStorage.setItem('currentLogin', loginHref);
                window.location.href = href;
            }
        });
    }

    chartChange = function (strInput) {
        let result = '';
        const length = strInput.length;
        for (let i = 0; i < length; i++) {
            let cCode = strInput.charCodeAt(i);
            cCode = (cCode >= 0xFF01 && cCode <= 0xFF5E) ? (cCode - 65248) : cCode;
            result += String.fromCharCode(cCode);
        }
        return result;
    };

    forgetPsw() {
        Util.showMessage('请联系管理员', 'info');
    }
}
