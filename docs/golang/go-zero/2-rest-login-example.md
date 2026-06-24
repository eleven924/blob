---
title: "go zero rest login demo"
tags: ["go-zero"]
date: 2026-06-25
---

# 为 http 服务添加登录认证接口

目标：为 http 服务添加登录认证接口。并且指定接口需要认证通过后才能访问。

## 前置条件

已安装： [go](https://go-zero.dev/zh-cn/getting-started/installation/golang/), [goctl](https://go-zero.dev/zh-cn/getting-started/installation/goctl/), [protoc](https://go-zero.dev/zh-cn/getting-started/installation/protoc/)，etcd

已存在一个api项目，可以参考 [[1-api-rpc-example]] 创建。


## 