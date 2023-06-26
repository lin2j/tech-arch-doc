---
title: Jenkins 安装及自动部署
---



# 安装以及启停管理

## Jenkins War包下载

到[官方镜像网站](http://mirrors.jenkins-ci.org/)下载选择适合自己系统的 war 包。Jenkins 项目产生两个发行线, 长期支持版本 (LTS) 和每周更新版本，这里选择的是最新的 [2.289.1](http://mirrors.jenkins-ci.org/war-stable/2.289.1/) 的 LTS 版本。Jenkins 以 WAR 文件、原生包/安装程序和 Docker 镜像分发，这里仅使用 war 包进行安装。

## Tomcat 8.5 下载

这里选择的是 [8.5](https://mirror-hk.koddos.net/apache/tomcat/tomcat-8/v8.5.68/bin/apache-tomcat-8.5.68.tar.gz) 版本的 tomcat。下载后解压到 `/usr/local/` 下，文件夹改名为 `tomcat-8.5` 。将下载好的 war 包，放到 `/usr/local/tomcat-8.5/webapps/` 目录下。启动 tomcat 后访问 `ip:8080/jenkins` 端口就可以看到 `Jenkins` 的页面。

## Jenins 安装

### 1. 选择 Jenins 的安装目录

`Jenkins` 默认的安装目录在 `/root/.jenkins` 下，如果不想安装在这里，可以通过修改环境变量 `JENKINS_HOME` 来修改。在 `/etc/profile` 文件中追加以下三行内容，然后执行 `source /etc/profile` 。

```bash
JENKINS_HOME=/data/jenkins
export JENKINS_HOME
export PATH=$PATH:$JENKINS_HOME/bin
```

添加后，启动 `Tomcat` 服务 `sh /usr/loca/tomca-8.5/bin/startup.sh` 。访问 `ip:8080/jenkins` ，看到如下界面就算正常，接下来只需要到到文件 `/data/jenkins/secrets/initialAdminPassword` 找到密码即可。`/data/jenkins` 是上面设置的 `JENKINS_HOME` 可以看到配置是生效的。

![jenkins初始界面](https://www.lin2j.tech/blog-image/jenkins/jenkins%E5%88%9D%E5%A7%8B%E7%95%8C%E9%9D%A2.png)

### 2. 安装插件和新建用户

输入密码后，如果网络正常，那么大概率可以正常安装插件。如果不能安装插件，那么就先跳过安装插件，等下再来处理。

![Jenkins离线](https://www.lin2j.tech/blog-image/jenkins/Jenkins%E7%A6%BB%E7%BA%BF.png)

跳过安装插件后，会来到用户创建界面，可以先建一个用户，输入账号密码即可。

![Jenkins-第一个用户](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E7%AC%AC%E4%B8%80%E4%B8%AA%E7%94%A8%E6%88%B7.jpg)

用户创建后会自动登录，接下来就是安装插件。

可能由于有些网站是国外的，默认的插件安装中心特别慢。或者由于证书问题，根本无法访问插件安装中心。

![Jenkins-SSLException](https://www.lin2j.tech/blog-image/jenkins/Jenkins-SSLException.jpg)

这里提供一个解决办法以及相关文件。

#### 修改插件安装中心

1. 找到 `$JENKINS_HOME/hudson.model.UpdateCenter.xml` 文件，将其中的 url 标签该为 `http://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json`

   修改后的内容为。然后重启 `Tomcat` 服务。

   ```xml
   <?xml version='1.1' encoding='UTF-8'?>
   <sites>
     <site>
       <id>default</id>
       <url>http://mirrors.tuna.tsinghua.edu.cn/jenkins/updates/update-center.json</url>
     </site>
   </sites>
   ```

   重启之后，会发现可以正常搜索插件了。

   ![jenkins-插件中心-1](https://www.lin2j.tech/blog-image/jenkins/jenkins-%E6%8F%92%E4%BB%B6%E4%B8%AD%E5%BF%83-1.jpg)

   但是安装插件会报错，报的是找不到证书的异常，那是因为 Java 发送 HTTPS 请求时，没有证书导致的，所以只需要将 HTTPS 改为 HTTP 就行了。

   ![Jenkins-SSLException-1](https://www.lin2j.tech/blog-image/jenkins/Jenkins-SSLException-1.jpg)

   具体是修改 `/data/jenkins/updates/default.json` 文件中的内容，将所有 `https://mirrors.tuna.tsinghua.edu.cn` 修改为 `http://mirrors.tuna.tsinghua.edu.cn`。另外还有一个，将 `connectionCheckUrl` 由 `http://www.google.com/` 修改为 `http://www.baidu.com`。

   这里提供一个修改过的文件，可以直接下载使用。

   [default.json](https://www.lin2j.tech/blog-image/jenkins/default.json)

   替换之后，重启 `Tomcat` 服务，然后重新试着安装，就可以了。

   ![jenkins-插件中心-2](https://www.lin2j.tech/blog-image/jenkins/jenkins-%E6%8F%92%E4%BB%B6%E4%B8%AD%E5%BF%83-2.png)

   到这里就算安装完成了，接下来根据需要安装插件即可。

### 3. 修改 Jenins 的占用端口

这里使用的是 `Tomcat` ，默认占用的端口 8080。如果不想使用这个端口，可以通过修改 `Tomcat` 的配置文件 `/usr/local/tomcat-8.5/conf/server.xml` 改变端口。找到 

```xml
    <Connector port="8080" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
```

修改为 9696，或者其他你想要的端口。

```xml
    <Connector port="9696" protocol="HTTP/1.1"
               connectionTimeout="20000"
               redirectPort="8443" />
```

重启 `Tomcat`，再访问 `ip:9696` 端口，正常访问就算正常。

### 4. Jenkins System Service 

新建一个文件 `/lib/systemd/system/jenkins.service` ，然后添加以下内容

```bash
[Unit]
Description=jenkins
After=network.target

[Service]
Type=forking
ExecStart=/usr/local/tomcat-8.5/bin/startup.sh
ExecReload=
ExecStop=/usr/local/tomcat-8.5/bin/shutdown.sh
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

执行命令 `systemctl daemon-reload` 使文件生效。

执行 `systemctl enable jenkins` 启动开机自动启动 `Jenkins` 服务。

接下来就可以使用 `systemctl start jenkins` 启动 `Jenkins` 服务，使用 `systemctl stop jenkins` 停止 `Jenkins` 服务。

# Jenkins 自动部署（基于Gitlab）

## 前置条件

### 相关插件

1. [Maven Integration](https://plugins.jenkins.io/maven-plugin) ：在部署spring boot 项目的时候, 我们需要创建maven项目, 在安装了这个插件之后, 在创建项目的时候, 如果没有这个插件, 在创建项目的时候就没有 `构建一个maven项目`的选项。

   ![Jenkins-plugin-maven](https://www.lin2j.tech/blog-image/jenkins/Jenkins-plugin-maven.jpg)

2. [Git Parameter](https://plugins.jenkins.io/git-parameter) ： 在后续的自动化部署中, 我们需要通过参数, 设置不同的分支, 对不同的分支进行打包, 需要这个插件的支持。

3. [Gitlab Hook](https://plugins.jenkins.io/gitlab-hook)：gitlab webhook 回调插件，设置好jenkins的回调url后就可以让jenkins进行自动构建。

4. [GitLab Plugin](https://plugins.jenkins.io/gitlab-plugin) ：远程构建的步骤里需要它，安装了之后，才会有红框里的那一个选项。

   ![Jenkins-Gitlab-Plugin](https://www.lin2j.tech/blog-image/jenkins/Jenkins-Gitlab-Plugin.png)

### 支持环境

1. JDK 1.8 ：在服务器构建 SpringBoot 项目的时候，需要用到 jdk 的一些工具。
2. Maven：在服务器构建项目的时候，需要使用 mvn 命令下载相关依赖。
3. Git：需要通过 git clone 来下载项目的代码文件。

需要在 `Manage Jenkins` --> `Global Tool Configuration` 里面配置相关工具的位置。

![Jenkins-环境支持](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E7%8E%AF%E5%A2%83%E6%94%AF%E6%8C%81.jpg)

### 添加 Gitlab 凭据

![Jenkins-添加凭据](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E6%B7%BB%E5%8A%A0%E5%87%AD%E6%8D%AE.jpg)

![jenkins-添加凭据0](https://www.lin2j.tech/blog-image/jenkins/jenkins-%E6%B7%BB%E5%8A%A0%E5%87%AD%E6%8D%AE0.png)

## Gitlab 示例

### 项目结构

新建一个 [jenkins-demo](https://github.com/lin2j/jenkins-demo) 的 SpringBoot 项目，然后上传到 Gitlab 上做版本控制（github 也上传了，需要可以自取）。这个项目使用 `maven-assembly-plugin` 来打包，`bin/run.sh` 目录下有一个启停脚本 `run.sh` 可以方便控制程序。

![Jenkins-github-demo](https://www.lin2j.tech/blog-image/jenkins/Jenkins-github-demo.jpg)

### 新建任务

新建一个 maven 项目

![Jenkins-新建任务](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E6%96%B0%E5%BB%BA%E4%BB%BB%E5%8A%A1.jpg)

### 源码管理

填写远程仓库信息

![Jenkins-新建任务-源码管理](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E6%96%B0%E5%BB%BA%E4%BB%BB%E5%8A%A1-%E6%BA%90%E7%A0%81%E7%AE%A1%E7%90%86.png)

### 构建触发器

这个 url 是给gitlab 的 webhook 准备的，webhook 通过这个 url 进行回调。如果直接使用这个 url 报了 403 的错误，那么可以将url 改为这个样子

```
http://USERNAME:PASSWORD@172.25.20.69:8080/jenkins/project/jenkins-demo
```

其中`USERNAME` 是Jenkins 的登录账号，`PASSWORD` 是密码。

![Jenkins-构建任务-构建触发器](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E6%9E%84%E5%BB%BA%E4%BB%BB%E5%8A%A1-%E6%9E%84%E5%BB%BA%E8%A7%A6%E5%8F%91%E5%99%A8.png)

![Jenkins-新建任务-源码管理-2](https://www.lin2j.tech/blog-image/jenkins/Jenkins-%E6%96%B0%E5%BB%BA%E4%BB%BB%E5%8A%A1-%E6%BA%90%E7%A0%81%E7%AE%A1%E7%90%86-2.png)

### 在Gitlab中添加 Webhook

将构建触发器阶段生成的 url 和 token 填写到 gitlab 中，然后进行测试，返回200则算成功。

![Jenkins-gitlab-webhook](https://www.lin2j.tech/blog-image/jenkins/Jenkins-gitlab-webhook.png)

![Jenkins-gitlab-webhook-test](https://www.lin2j.tech/blog-image/jenkins/Jenkins-gitlab-webhook-test.png)

![Jenkins-gitlab-webhook-test-200](https://www.lin2j.tech/blog-image/jenkins/Jenkins-gitlab-webhook-test-200.png)

### 配置 Post-build

在 `Add post-build step` 中选择 `Exceute shell` 选项，然后添加 shell 脚本。这里提供一下我的脚本。基本上对于我的项目结构，只需要修改 `MODULE` 和 `DEPLOY_DIR` 变量即可。

![Jenkins-Post-build](https://www.lin2j.tech/blog-image/jenkins/Jenkins-Post-build.png)

![Jenkins-Post-build-1](https://www.lin2j.tech/blog-image/jenkins/Jenkins-Post-build-1.png)

```bash
# 模块的名字
MODULE=jenkins-demo
# 部署的目录
DEPLOY_DIR=/opt
if [ ! -d  $DEPLOY_DIR ]; then
   mkdir -p $DEPLOY_DIR
   tar -zxvf $WORKSPACE/target/$MODULE.tar.gz -C $DEPLOY_DIR
else
   rm -f $DEPLOY_DIR/$MODULE*.jar
   cp $WORKSPACE/target/$MODULE*.jar $DEPLOY_DIR/$MODULE
fi

if [ ! -f  /lib/systemd/system/$MODULE.service ]; then
	sFile=/lib/systemd/system/$MODULE.service
	sContent=$sContent"[Unit]"
	sContent=$sContent"\nDescription=$MODULE"
	sContent=$sContent"\nAfter=network.target"
    sContent=$sContent"\n "
    sContent=$sContent"\n[Service]"
    sContent=$sContent"\nType=forking"
    sContent=$sContent"\nExecStart=$DEPLOY_DIR/$MODULE/bin/run.sh start"
    sContent=$sContent"\nExecReload= "
    sContent=$sContent"\nExecStop=$DEPLOY_DIR/$MODULE/bin/run.sh stop"
    sContent=$sContent"\nPrivateTmp=true"
    sContent=$sContent"\n "
    sContent=$sContent"\n[Install]"
    sContent=$sContent"\nWantedBy=multi-user.target"
    echo -e $sContent > $sFile

	systemctl daemon-reload
	systemctl enable $MODULE
fi

systemctl restart $MODULE
```

# 结语

以上就是 Jenkins 的安装部署以及自动化部署的思路，希望能够给你提供帮助。