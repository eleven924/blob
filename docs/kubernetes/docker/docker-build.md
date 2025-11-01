---
title: "Docker 多架构镜像构建"
tags: ["Docker"]
date: 2025-11-01
---

## 基本步骤

### 创建构建器
```bash
docker buildx create \
  --name mybuilder \
  --driver docker-container \
  --driver-opt image=swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/moby/buildkit:buildx-stable-1 \
  --platform linux/amd64,linux/arm64 \
  --use
```
### 构建镜像
单个架构镜像可以通过`load`保存到本地  
```bash
  docker buildx build \
  --platform linux/arm64 \
  -t ubuntu:20.04-dockerClient \
  --load \
  .
```
同时构建多种架构镜像需要直接推送到镜像仓库  
```bash
  docker buildx build \
  --platform linux/arm64,linux/amd64 \
  -t ubuntu:20.04-dockerClient \
  --load \
  .
```
## 在 amd64 架构下运行 arm64 镜像

安装 QEMU 工具（Ubuntu/Debian 示例）  
```bash
sudo apt-get install -y qemu-user-static
```
注册模拟器到 Docker（让 Docker 能识别并模拟 ARM 指令）  
```bash
docker run --rm --privileged multiarch/qemu-user-static --reset -p yes
```
清理QEMU模拟的注册信息
```bash
docker run --rm --privileged multiarch/qemu-user-static --reset -p no
# 查看目录下是否有 qemu-aarch64 相关文件
ls /proc/sys/fs/binfmt_misc/
```

## ubuntu 镜像安装 git+dockerCli 例子
```Dockerfile
FROM swr.cn-north-4.myhuaweicloud.com/ddn-k8s/docker.io/ubuntu:20.04-linuxarm64

RUN sed -i -E "s/[a-zA-Z0-9]+.ubuntu.com/mirrors.aliyun.com/g" /etc/apt/sources.list
RUN apt-get clean && apt-get update && apt-get install -y apt-transport-https ca-certificates
RUN DEBIAN_FRONTEND=noninteractive apt install -y tzdata
RUN apt-get install -y \
  curl \
  git \
  netcat-openbsd \
  wget \
  build-essential \
  libfontconfig \
  libsasl2-dev \
  libfreetype6-dev \
  libpcre3-dev \
  pkg-config \
  cmake \
  python3 \
  python-is-python3 \
  librrd-dev \
  sudo

# timezone modification
RUN ln -sf /usr/share/zoneinfo/Asia/Shanghai /etc/localtime

# install docker client
#RUN curl -fsSL https://get.docker.com | sed 's|download.docker.com|mirrors.aliyun.com/docker-ce|g' | sh
# 使用国内源安装docker
RUN apt-get update && \
    apt-get install -y lsb-release software-properties-common 


RUN curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | apt-key add - && \
    add-apt-repository "deb https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" && \
    apt-get update && \
    apt-get install -y docker-ce docker-ce-cli containerd.io && \
    rm -rf /var/lib/apt/lists/*
```