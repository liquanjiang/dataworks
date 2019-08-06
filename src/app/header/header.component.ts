import { AfterViewInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { LoginService } from '../share/login.service';
import { AuthGuardService } from '../share/auth-guard.service';
import { CookieService } from 'ngx-cookie-service';
import Util from '../share/common/util';
import { ApiService } from '../share/api.service';

declare var $: any;

@Component({
    selector: 'app-dataworks-header',
    templateUrl: './header.component.html',
    styleUrls: ['./header.component.css']
})
export class HeaderComponent implements AfterViewInit {
    @Input() topMenus: any[];
    @Output() selectedMenu = new EventEmitter<any>();
    @Input() nowMenuCode: string;
    @Input() modules: any[];
    @Input() nowModule: any;
    @Input() userName: any;

    constructor(public authGuardService: AuthGuardService, public loginService: LoginService, private apiservice: ApiService,
                private router: Router, private route: ActivatedRoute, private cookieService: CookieService) {
    }

    ngAfterViewInit() {
    }

    showThisMenu(index: number, item, e) {
        e.preventDefault(); // 阻止事件的默认行为，即阻止链接跳转
        const origin = Util.origin;
        const open = e.ctrlKey || e.metaKey;  // 按住Ctrl 或 commond键
        if (open && e.button === 0) { // 设置当点击ctrl 或 commond键在新窗口打开连接时的行为
            const url = item.url;
            const dw = origin + '/dataworks#';
            if (url === '/dwb/configmanage') {
                const newurl = dw + url + '/ds';
                window.open(newurl);
            } else {
                this.apiservice.checkLicense(url).then((res) => {
                    if (res.code === 200) {
                        if (url.includes('di')) {
                            const newurl = dw + url + '/jobmanage';
                            window.open(newurl);
                        } else if (url.includes('metamanage')) {
                            const newurl = dw + url + '/map';
                            window.open(newurl);
                        } else if (url.includes('dqmanage')) {
                            const newurl = dw + url + '/checkresult';
                            window.open(newurl);
                        }
                    } else {
                        Util.showMessage(res.msg, 'warning');
                        const obj = {
                            index: -1
                        };
                        this.selectedMenu.emit(obj);
                        return false;
                    }
                });
            }
        } else if (!open && e.button === 0) {  // 如果没有按住Ctrl 或 commond键,则正常跳转
            if (item.url === '/dwb/configmanage') { // 数据源配置模块不校验license
                this.changeRouter(index);
            } else { // 切换头部模块之前对每个模块进行license校验
                this.apiservice.checkLicense(item.url).then((res) => {
                    if (res.code === 200) {
                        this.changeRouter(index);
                    } else {
                        Util.showMessage(res.msg, 'warning');
                        const obj = {
                            index: -1
                        };
                        this.selectedMenu.emit(obj);
                        return false;
                    }
                });
            }
        }
    }

    // 根据指定的url切换路由
    changeRouter(index) {
        this.nowMenuCode = this.topMenus[index].menuCode;
        const sendData = { index };
        this.selectedMenu.emit(sendData);
    }

    showSetMenu() {
        this.nowMenuCode = 'user-set';
        const sendData = { index: -1 };
        this.selectedMenu.emit(sendData);
    }

    logout(): any {
        this.loginService.logout()
            .then(res => {
                Util.showMessage('注销成功', 'success');
                this.cookieService.deleteAll();
                window.localStorage.removeItem('SHAREJSESSIONID');
                window.localStorage.removeItem('userPK');
                window.localStorage.setItem('timeoutType', 'logout');
                this.authGuardService.toLoginPage();
            });
    }

    toNextSystem(mo: any): void {
        window.localStorage.setItem('currentRoleName', mo.moduleName);
        window.localStorage.setItem('currentRoleCode', mo.roleCode);
        window.location.href = mo.comments;
    }
}
