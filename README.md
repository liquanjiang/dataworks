# dataworks-webapp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 6.0.8

##开发环境搭建
1. 在官网http://nodejs.cn/download/下载安装包
2. 安装node 6.9.x以上的版本
3. 在控制台窗口中运行命令 node -v 和 npm -v， 验证安装的是 node 6.9.x 和 npm 3.x.x 以上的版本
4. 在命令行运行 npm install -g @angular/cli，安装Angular CLI
5. npm 升级为最新版本方法 ： 在终端（mac）或cmd(Windows)内输入命令 npm install -g npm ， npm -v 最新版本6.4.0

## Angular 升级步骤
> 1\. 确认 Node 版本高于 8.9.x，否则更新 Node 至 8.9.x 以上。

```
node -v // 检查node版本

// 如果node版本低于8.9，更新node版本
npm install -g n
n v8.11.3

```

> 2\. 更新全局 Angular cli 版本。

```
npm install -g @angular/cli@latest
```

> 3\. 删除项目目录中 `node_modules` 文件夹。
> 4\. 使用 `npm install` 重新安装项目依赖。

```
npm install // 安装依赖

// 如果安装依赖出错，请重新删除 node_modules 文件夹，执行下列操作

npm config set registry https://registry.npmjs.org // 更换镜像源为npm官方源
npm install
```

> 5\. 使用 `npm start` 启动项目。 



## Development server

Run `npm run start` for a dev server. Navigate to `http://localhost:9091/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.
## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).
Before running the tests make sure you are serving the app via `ng serve`.

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
