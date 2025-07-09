---
title: "kubebuilder使用问题汇总"
tags: ["kubebuilder"]
date: 2025-07-06
---
# kubebuilder使用问题汇总

## make 命令相关

1 执行 make install 时报错 `metadata.annotations: Too long: must have at most 262144 bytes`
解决办法: 打开Makefile，在 `manifests` 命令处，修改 `crd` 为 `crd:maxDescLen=0`
```
manifests: controller-gen ## Generate WebhookConfiguration, ClusterRole and CustomResourceDefinition objects.
    $(CONTROLLER_GEN) rbac:roleName=manager-role crd=maxDescLen=0 webhook paths="./..." output:crd:artifacts:config=config/crd/bases
```

## Operator 运行相关

1 部署后 容器日志报错 `cannot list resource "services" in API group "" at the cluster scope`
注意代码中 kubebuilder 的rbac 关于 service 的拼写是否有问题, 因为这部分是自己添加的, 很可能出现问题
当然而除了手残当意外, 大部分是缺少了 kubebuilder 关于 rbac 资源的配置

## k8s Kind 多版本使用相关
1 额外使用kubectl create api 命令创建一个 api/v2 版本,在v2中基于v1版本调整 type 后, 部署到k8s ,指定v1版本获取资源可以,但是直接获取失败,如下
```bash
root@ahost:~# kubectl get  applications.v1.apps.elevenz.cn -A
NAMESPACE   NAME       AGE
default     my-nginx   17h
root@ahost:~# kubectl get  applications.v1.apps.elevenz.cn -A
NAMESPACE   NAME       AGE
default     my-nginx   17h
root@ahost:~# kubectl get  applications -A
Error from server: conversion webhook for apps.elevenz.cn/v1, Kind=Application failed: Post "https://myoperatortest-webhook-service.myoperatortest-system.svc:443/convert?timeout=30s": no endpoints available for service "myoperatortest-webhook-service"
```
原因: 缺少对版本间转换函数的实现, 实现controller-runtime中的 **Convertible 和 Hub**
定义如下:
```go
package conversion

import "k8s.io/apimachinery/pkg/runtime"

// Convertible defines capability of a type to convertible i.e. it can be converted to/from a hub type.
type Convertible interface {
    runtime.Object
    ConvertTo(dst Hub) error
    ConvertFrom(src Hub) error
}

// Hub marks that a given type is the hub type for conversion. This means that
// all conversions will first convert to the hub type, then convert from the hub
// type to the destination type. All types besides the hub type should implement
// Convertible.

type Hub interface {
    runtime.Object
    Hub()
}
```
具体实现过程参考[官方文档](https://book.kubebuilder.io/multiversion-tutorial/conversion)对这部描述

## 为什么我的controller监听不到子资源事件变化

当我controller已经设置manager的controller
```go
// SetupWithManager sets up the controller with the Manager.
func (r *ApplicationReconciler) SetupWithManager(mgr ctrl.Manager) error {
	setupLog := ctrl.Log.WithName("setup")
	return ctrl.NewControllerManagedBy(mgr).
		For(&v1.Application{}).
		Owns(&appsv1.Deployment{},).
		Owns(&corev1.Service{}).
		Complete(r)
```
但是删除子资源并不能触发controller的Reconcile

最后定位到在controller的Reconcile中创建Deploy子资源和Service子资源时, 使用的时 controller-runtime的 `SetOwnerReference` 而不是 `SetControllerReference` 方法, 修改后即可正常处理了

