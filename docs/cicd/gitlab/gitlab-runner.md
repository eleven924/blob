---
title: "gitlab runner安装"
tags: ["gitlab"]
date: 2025-07-05
---
## gitlab runner 简介
GitLab Runner 是 GitLab CI 的执行器，用于执行构建、测试和其他任务。它可以在不同的平台上运行，并且可以与 GitLab 进行通信以获取作业并将其传递给执行器进行处理。

## 前置条件

- 服务器已安装gitlab; 当前使用版本v16.9.1  
- 服务器已安装docker; 因为gitlab runner 可以通过docker运行和执行任务
  
## 安装 gitlab runner

需要安装和gitlab 服务端同版本的 runner  
```bash
docker run -d --name gitlab-runner --restart always   -v /srv/gitlab-runner/config:/etc/gitlab-runner   -v /var/run/docker.sock:/var/run/docker.sock    dockerpull.org/gitlab/gitlab-runner:v16.9.1
```

## 注册 gitlab runner

在 `gitlab` 对应项目的中的 `Settings` 中找到 `CI/CD` 中的 `Runners` 配置, 新建一个runner, 配置好后点击创建 `runner` 会生成一个注册命令, 其中会有使用的token

在服务器中进入到刚刚启动的容器中,执行注册命令
```bash
root@305ab3f352ff:/# gitlab-runner  register 
Runtime platform                                    arch=amd64 os=linux pid=55 revision=782c6ecb version=16.9.1
Running in system-mode.                            
                                                   
Enter the GitLab instance URL (for example, https://gitlab.com/):
[http://10.57.131.174:32080]: http://10.57.131.174:32080
Enter the registration token:
glrt-i_42bADAF6xd8q2GxQ1F
Verifying runner... is valid                        runner=i_42bADAF
Enter a name for the runner. This is stored only in the local config.toml file:
[305ab3f352ff]: test-runner
Enter an executor: parallels, docker-windows, docker+machine, docker-autoscaler, instance, kubernetes, custom, shell, ssh, virtualbox, docker:
docker
Enter the default Docker image (for example, ruby:2.7):
ecr-my-docker.io/my-zadig/multi-arch-lib/golang:1.23.0-alpine
Runner registered successfully. Feel free to start it, but if it's running already the config should be automatically reloaded!
 
Configuration (with the authentication token) was saved in "/etc/gitlab-runner/config.toml" 
```

注册成功后页面就会出现一个配置好的runner

