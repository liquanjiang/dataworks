import { Component, OnInit, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router, NavigationStart, NavigationEnd } from '@angular/router';
import { LoginService } from '../share/login.service';
import { ApiService } from '../share/api.service';
import Util from '../share/common/util';

declare var $: any;

@Component({
    selector: 'app-console',
    templateUrl: './console.component.html',
    styleUrls: ['./console.component.css']
})
export class ConsoleComponent implements OnInit, AfterViewInit {
    totalMenus: any[]; // 记录接口返回来的所有菜单
    topMenus: any[]; // 记录整理后的菜单树
    leftMenus: any[]; // 记录当前的左侧菜单
    modules: any[];
    nowModule: any;
    nowMenuCode: string;
    nowMenuName: string;
    menuSelectedCode: string;
    userName;  // 存放当前显示的用户名
    userPK; // 存放当前登陆用户的userPk

    constructor(public loginService: LoginService, private router: Router, private route: ActivatedRoute, private apiservice: ApiService) {
    }

    ngOnInit() {
        this.userPK = window.localStorage.getItem('userPK');
        this.loadTopMenus();
        this.getAllUserList();
    }

    ngAfterViewInit() { // 监听路由变化，实时更改左侧菜单的内容及状态，在点击浏览器的前进和后退按钮时有用
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                const url = event.url;
                const ds = url.includes('ds');
                const map = url.includes('metamanage/map');
                const query = url.includes('metamanage/query');
                const collect = url.includes('metamanage/collect');
                const job = url.includes('di/jobmanage'); // 任务管理
                const task = url.includes('di/taskmanage'); // 作业管理
                const schdmonitor = url.includes('di/schdmonitor');
                const checkresult = url.includes('dqmanage/checkresult');
                const checkdef = url.includes('dqmanage/checkdef');
                const changehistory = url.includes('dqmanage/changehistory');
                const orderreport = url.includes('dqmanage/orderreport');
                if (map || query || collect) {
                    this.leftMenus = this.topMenus[0].children;
                }

                if (checkresult || checkdef || changehistory || orderreport) {
                    this.leftMenus = this.topMenus[1].children;
                }

                if (job || task || schdmonitor) {
                    this.leftMenus = this.topMenus[2].children;
                }

                if (ds) { // 当路由中包含ds时，说明是数据源配置的路由
                    const obj = { index: 3 };
                    this.selMenu(obj);
                } else if (map || job || checkresult) {
                    this.menuSelectedCode = this.leftMenus[0].menuCode;
                } else if (query || task || checkdef) {
                    this.menuSelectedCode = this.leftMenus[1].menuCode;
                } else if (collect || schdmonitor || changehistory) {
                    this.menuSelectedCode = this.leftMenus[2].menuCode;
                } else if (orderreport) {
                    this.menuSelectedCode = this.leftMenus[3].menuCode;
                }
            }
        });
    }

    // 获取所有用户列表，并获得用户显示名
    getAllUserList() {
        this.apiservice.getAllUserList().then(response => {
            if (response.code === 200) {
                const res = response.data;
                const len = res.length;
                for (let i = 0; i < len; i++) {
                    if (res[i].pk === this.userPK) {
                        this.userName = res[i].userCaption;
                        break;
                    }
                }
            }
        });
    }

    // 接口获取菜单数组，并整理为菜单树
    loadTopMenus(): void {
        const nowRoleCode = window.localStorage.getItem('currentRoleCode');
        this.loginService.getMenus('dw', nowRoleCode).then((data) => {
            const totalMenus = JSON.parse(data.menus);
            let menus = [];
            this.nowModule = window.localStorage.getItem('currentRoleName'); // JSON.parse(data.currentModule);
            const modules = JSON.parse(data.modules);
            const module = [];
            const userRole = window.localStorage.getItem('userRole');
            if (!userRole) {
                return;
            }
            this.modules = module;
            this.totalMenus = totalMenus;
            menus = this.getChildMenu(null);
            menus.forEach(x => {
                const childMenu = this.getChildMenu(x.menuPk);
                childMenu.forEach(y => {
                    const childMenu2 = this.getChildMenu(y.menuPk);
                    if (childMenu2.length > 0) {
                        y.children = childMenu2;
                    }
                });
                x.children = childMenu;
            });
            this.topMenus = menus;
            const nowUrl = this.router.url;
            if (nowUrl === '/dwb') { // 刚进入时的操作，默认选中头部菜单的第一个菜单，并选中第一个子菜单
                const url = this.topMenus[0].url;
                this.apiservice.checkLicense(url).then((res) => { // 第一个菜单进行验证
                    if (res.code === 200) {
                        this.leftMenus = this.topMenus[0].children;
                        this.nowMenuCode = this.topMenus[0].menuCode;
                        this.nowMenuName = this.topMenus[0].menuName;
                        const left = this.leftMenus[0];
                        this.menuSelectedCode = left.children ? left.children[0].menuCode : left.menuCode;
                        this.showDetail();
                    } else {
                        Util.showMessage(res.msg, 'warning');
                        return false;
                    }
                });
            } else {
                const now = this.menuSelectedCode = totalMenus.filter(function (x) {
                    return x.url === nowUrl || x.url.includes(nowUrl);
                })[0];
                const nowPMenu = menus.filter(function (value) {
                    return value.menuPk === now.parentPk;
                })[0];
                if (nowPMenu) {
                    this.leftMenus = nowPMenu.children;
                    this.nowMenuName = nowPMenu.menuName;
                    this.nowMenuCode = nowPMenu.menuCode;
                    this.menuSelectedCode = now.menuCode;
                }
                this.router.navigate([nowUrl]);
            }
        });
    }

    // 点击顶部菜单刷新左侧菜单
    selMenu(obj: any): void {
        if (obj.index === -1) { // license校验没有通过，则为-1
            this.leftMenus = [];
            this.nowMenuName = '';
        }
        if (obj.index !== -1) {
            this.leftMenus = this.topMenus[obj.index].children;
            this.nowMenuName = this.topMenus[obj.index].menuName;
        }
        if (this.leftMenus.length > 0) {
            this.menuSelectedCode = this.leftMenus[0].children ?
                this.leftMenus[0].children[0].menuCode : this.leftMenus[0].menuCode;
            this.showDetail();
        }

    }

    // 点击左侧菜单刷新右侧显示内容
    showDetail() {
        if (this.leftMenus[0].children) {
            this.router.navigate([this.leftMenus[0].children[0].url]);
        } else {
            this.router.navigate([this.leftMenus[0].url]);
        }
    }

    // 根据菜单pk获取子菜单
    getChildMenu(nowPpk: any): any {
        const totalMenus = this.totalMenus;
        const childMenu = totalMenus.filter(function (x) {
            return x.parentPk === nowPpk;
        });
        childMenu.sort(function (x, y) {
            if (x.menuOrder < y.menuOrder) {
                return -1;
            }
            if (x.menuOrder > y.menuOrder) {
                return 1;
            }
            return 0;
        });
        return childMenu;
    }
}
