---
title: "kubebuilder初步使用"
tags: ["kubebuilder"]
date: 2025-07-06
---

> [快速入门 - The Kubebuilder Book (cloudnative.to)](https://cloudnative.to/kubebuilder/quick-start.html#创建一个项目)

## 1. 在linux环境中安装Go

```shell
tar zxf go1.20.2.linux-amd64.tar.gz -C /usr/local/

cat >> /etc/profile <<EOF
export GOROOT=/usr/local/go
export GOPATH=/usr/local/goSpace
export PATH=$PATH:$GOROOT/bin
EOF

source /etc/profile
mkdir $GOPATH
```

## 2. 下载安装kubebuilder

[下载地址：Releases · kubernetes-sigs/kubebuilder (github.com)](https://github.com/kubernetes-sigs/kubebuilder/releases)

```bash
[root@k8s1 ~]# chmod 755 kubebuilder_linux_amd64 && mv kubebuilder_linux_amd64  /usr/local/ 
[root@k8s1 ~]# ln -s /usr/local/kubebuilder_linux_amd64  /bin/kubebuilder
[root@k8s1 ~]# kubebuilder version
Version: main.version{KubeBuilderVersion:"3.9.0", KubernetesVendor:"1.26.0", GitCommit:"26f605e889b2215120f73ea42b081efac99f5162", BuildDate:"2023-01-16T17:21:30Z", GoOs:"linux", GoArch:"amd64"}
```

## 3. 创建一个项目

创建一个目录，然后在里面运行 `kubebuilder init` 命令，初始化一个新项目

```bash
[root@k8s1 go]# mkdir -p $GOPATH/src/example
[root@k8s1 go]# cd $GOPATH/src/example
[root@k8s1 example]# kubebuilder init --domain my.domain
```

执行init时会出现链接被拒报错如下：

```shell
go: sigs.k8s.io/controller-runtime@v0.14.1: Get "https://proxy.golang.org/sigs.k8s.io/controller-runtime/@v/v0.14.1.mod": dial tcp 142.251.43.17:443: connect: connection refused
Error: failed to initialize project: unable to scaffold with "base.go.kubebuilder.io/v3": exit status 1
```

需要设置GOPROXY，`go env -w GOPROXY=https://goproxy.cn` 然后在删除目录下文件，重新init

## 4. 创建一个api

运行下面的命令，创建一个新的 API（组/版本）为 “webapp/v1”，并在上面创建新的 Kind(CRD) “Guestbook”。

```bash
kubebuilder create api --group webapp --version v1 --kind Guestbook
```

> 如果你在 Create Resource [y/n] 和 Create Controller [y/n] 中按`y`，那么这将创建文件 `api/v1/guestbook_types.go` ，该文件中定义相关 API ，而针对于这一类型 (CRD) 的对账业务逻辑生成在 `controller/guestbook_controller.go` 文件中。

## 5. 测试

### 5.1 安装CRD到集群

执行 make install 将 CRD 安装到集群

```bash
[root@k8s1 example]# make install
/usr/local/goSpace/src/example/bin/controller-gen rbac:roleName=manager-role crd webhook paths="./..." output:crd:artifacts:config=config/crd/bases
test -s /usr/local/goSpace/src/example/bin/kustomize || { curl -Ss "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash -s -- 3.8.7 /usr/local/goSpace/src/example/bin; }

{Version:kustomize/v3.8.7 GitCommit:ad092cc7a91c07fdf63a2e4b7f13fa588a39af4f BuildDate:2020-11-11T23:14:14Z GoOs:linux GoArch:amd64}
kustomize installed to /usr/local/goSpace/src/example/bin/kustomize
/usr/local/goSpace/src/example/bin/kustomize build config/crd | kubectl apply -f -
customresourcedefinition.apiextensions.k8s.io/guestbooks.webapp.my.domain created
```

### 5.2 运行 controller

执行 make run  运行控制器

此命令只在当前终端前台运行，后续会部署到docker中

## 6. 安装CR实例

```bash
[root@k8s1 example]# kubectl apply -f config/samples/webapp_v1_guestbook.yaml 
guestbook.webapp.my.domain/guestbook-sample created
```

说明： 可能会遇到如下报错，先将文件中的spec注释(目前先不关注文件中的内容)，在重新apply

```bash
The Guestbook "guestbook-sample" is invalid: spec: Invalid value: "null": spec in body must be of type object: "null"
```

查看新的资源创建成功

```bash
[root@k8s1 example]# kubectl get Guestbook
NAME               AGE
guestbook-sample   117s
```

## 7. 构建controller镜像并推送

### 7.1 构建并推送你的镜像到 `IMG` 指定的位置。

```bash
# 语法： make docker-build docker-push IMG=<some-registry>/<project-name>:tag
make docker-build docker-push IMG=127.0.0.1:5000/guestbook-sample:v1_test

#-------------查看仓库内容------------
[root@k8s1 example]# docker images
REPOSITORY                                                        TAG                 IMAGE ID            CREATED             SIZE
127.0.0.1:5000/guestbook-sample                                   v1_test             22b37eef3169        10 minutes ago      50.6MB
```

**<font color=red>执行make build 时遇到的问题</font>**

- 构建镜像下载go依赖时报错，内容如下

```bash
Step 7/16 : RUN go mod download
 ---> Running in 5b165a3a14fd

go: github.com/beorn7/perks@v1.0.1: Get "https://proxy.golang.org/github.com/beorn7/perks/@v/v1.0.1.mod": dial tcp 142.251.43.17:443: connect: connection refused
```

分析为docker容器中go没有go 的代理，在Docker中添加如下配置后，重新执行命令

```bash
RUN go env -w GOPROXY=https://goproxy.io,direct
RUN go env -w GO111MODULE=on
```

 - docke pull 从谷歌镜像仓库拉取distroless/static时一直超时，报错如下：

```bash
Step 14/18 : FROM registry.cn-hangzhou.aliyuncs.com/distroless/static:nonroot
pull access denied for registry.cn-hangzhou.aliyuncs.com/distroless/static, repository does not exist or may require 'docker login'
make: *** [docker-build] 错误 1
```

由于暂时没有找到国内的对应的镜像仓库，就用了busybox来替代, 修改Dockerfile中的如下内容后，重新执行

```bash
#FROM gcr.io/distroless/static:nonroot
FROM busybox:latest
```

### 7.2 根据 `IMG` 指定的镜像将控制器部署到集群中。

```bash
# 语法： make deploy IMG=<some-registry>/<project-name>:tag
make deploy IMG=127.0.0.1:5000/guestbook-sample:v1_test
```

**<font color=red>执行 make deploy 时遇到的问题</font>**

- controller 对应的 pod 没有启动，通过describe 查看 event 描述，gcr.io镜像和 本地仓库镜像拉取失败  `kubectl edit deploy example-controller-manager -n example-system` ，编辑 deploy文件将 gcr.io/ 删除，从docker默认仓库拉取； 将 127.0.0.1 替换为 实际IP，并在docker 的 /etc/docker/daemon.json中增加配置

  ```bash
  {
    "registry-mirrors": ["https://ecu3g632.mirror.aliyuncs.com"],
    "insecure-registries": ["192.168.80.151:5000"],
    "live-restore": true
  }
  
  systemctl daemon-reload
  systemctl restart docker
  ```

## 8. 卸载CRD和Controller

```bash
# 从集群中卸载CRD
make uninstall

# 从集群中卸载控制器（执行make deploy部署后的卸载方式）
make undeploy
```



