---
title: "Lease 分布式锁"
tags: ["k8s"]
date: 2025-07-09
---
# Lease 分布式锁

## 说明
只是为了简单理解`lease`的使用方式，实际调用可以直接选择`client-go`中的`leader-election`

## 准备环境
- k8s 集群 v1.14+
- go 1.20+
- 提前设置好 KUBECONFIG 环境变量

## 创建lease资源
```shell
cat > leasePractice.yaml <<EOF 
apiVersion: coordination.k8s.io/v1
kind: Lease
metadata:
  name: my-lease
  namespace: default
spec:
  holderIdentity: ""
  leaseDurationSeconds: 60  # 设置为 60 秒
  renewTime: null
  leaseTransitions: 0
EOF

kubectl apply -f  leasePractice.yaml
```

## 运行环境
用来练习就跑在shell窗口
```shell
export POD_NAME=test1
go run leasePractice.go

## 可以在另一个shell窗口在启动一个备用进程,观察是否会阻塞
export POD_NAME=test2
go run leasePractice.go
```

## DemoCode
```go
package main

import (
	"context"
	"fmt"
	"os"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/kubernetes/typed/coordination/v1"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/client-go/util/retry"
)

// 需要提前定义 lease 资源
// 运行前需要设置环境变量POD_NAME, 更新 lease 锁时会用到
// 使用声明KUBECONFIG变量的配置

func main() {
	// 加载 Kubernetes 配置
	config, err := clientcmd.BuildConfigFromFlags("", os.Getenv("KUBECONFIG"))
	if err != nil {
		panic(err.Error())
	}
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		panic(err.Error())
	}

	leaseClient := clientset.CoordinationV1().Leases("default")
	leaseName := "my-lease"
	podName := os.Getenv("POD_NAME") // 获取 Pod 名称

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel() // 确保在退出时取消上下文

	if err := acquireLease(leaseClient, leaseName, podName, ctx, cancel); err != nil {
		fmt.Println("Failed to acquire lease:", err)
	}

	// 业务逻辑执行
	// ...
	i := 1
	for {
		if i > 20 {
			break
		}

		fmt.Println("模拟业务运行", i)
		time.Sleep(5 * time.Second)
		i++
	}
	// 释放锁
	releaseLock(leaseClient, leaseName, podName, cancel)
}

func acquireLease(leaseClient v1.LeaseInterface, leaseName string, podName string, ctx context.Context, cancel context.CancelFunc) error {
	for {
		fmt.Println("尝试获取锁")
		err := retry.OnError(retry.DefaultRetry, func(err error) bool {
			return true
		}, func() error {
			lease, err := leaseClient.Get(context.TODO(), leaseName, metav1.GetOptions{})
			if err != nil {
				return err
			}
			// 检查是否过期
			if lease.Spec.RenewTime != nil && lease.Spec.LeaseDurationSeconds != nil && time.Since(lease.Spec.RenewTime.Time) > time.Duration(*lease.Spec.LeaseDurationSeconds)*time.Second {
				fmt.Println("Lock has expired, attempting to acquire...")
				*lease.Spec.HolderIdentity = ""
				lease.Spec.RenewTime = &metav1.MicroTime{Time: time.Now()}
				if lease.Spec.LeaseTransitions == nil {
					lease.Spec.LeaseTransitions = new(int32)
				}
				*lease.Spec.LeaseTransitions = *lease.Spec.LeaseTransitions + int32(1)
				_, err = leaseClient.Update(context.TODO(), lease, metav1.UpdateOptions{})
				if err != nil {
					return err
				}
			}

			// 检查并获取锁
			if lease.Spec.HolderIdentity == nil || *lease.Spec.HolderIdentity == podName || *lease.Spec.HolderIdentity == "" {
				lease.Spec.HolderIdentity = new(string)
				*lease.Spec.HolderIdentity = podName
				lease.Spec.RenewTime = &metav1.MicroTime{Time: time.Now()}
				_, err = leaseClient.Update(context.TODO(), lease, metav1.UpdateOptions{})
				if err != nil {
					return err
				}
				fmt.Println("Lock acquired")
				go renewLease(leaseClient, leaseName, podName, ctx) // 启动心跳更新
				return nil
			}

			return fmt.Errorf("lock is held by %s", lease.Spec.HolderIdentity)
		})

		if err == nil {
			break // 成功获取锁
		}

		time.Sleep(5 * time.Second) // 等待后重试
	}
	return nil
}

// 定期刷新 Lease,防止过期被解锁定
func renewLease(leaseClient v1.LeaseInterface, leaseName, podName string, ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second) // 每 30 秒进行更新
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			lease, err := leaseClient.Get(context.TODO(), leaseName, metav1.GetOptions{})
			if err != nil {
				fmt.Println("Error getting Lease:", err)
				return
			}

			// 更新 Lease
			if *lease.Spec.HolderIdentity == podName {
				lease.Spec.RenewTime = &metav1.MicroTime{Time: time.Now()}
				_, err = leaseClient.Update(context.TODO(), lease, metav1.UpdateOptions{})
				if err != nil {
					fmt.Println("Error renewing lease:", err)
				} else {
					fmt.Println("Lease renewed")
				}
			} else {
				fmt.Println("This instance does not hold the lock anymore")
				return
			}
		case <-ctx.Done():
			fmt.Println("Stopping lease renewal")
			return
		}
	}
}

func releaseLock(leaseClient v1.LeaseInterface, leaseName, podName string, cancel context.CancelFunc) {
	lease, err := leaseClient.Get(context.TODO(), leaseName, metav1.GetOptions{})
	if err != nil {
		fmt.Println("Error getting Lease:", err)
		return
	}

	if *lease.Spec.HolderIdentity == podName {
		lease.Spec.HolderIdentity = nil
		_, err = leaseClient.Update(context.TODO(), lease, metav1.UpdateOptions{})
		if err != nil {
			fmt.Println("Error releasing lock:", err)
		} else {
			fmt.Println("Lock released")
		}
	} else {
		fmt.Println("This instance does not hold the lock")
	}

	// 取消上下文以停止心跳更新
	cancel()
}

```