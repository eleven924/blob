---
title: "ingress-nginx 的安装与使用"
tags: ["k8s"]
date: 2025-07-06
---
# ingress-nginx 的安装与使用

## 准备两个pod和对应的service

### 创建一个http服务

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: mydemo
  name: mydemo-ingress-test
  namespace: default
spec:
  containers:
  - image: httpd
    imagePullPolicy: Always
    name: httpd
    ports:
    - containerPort: 80
      protocol: TCP
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: node03.com
  preemptionPolicy: PreemptLowerPriority
  priority: 0
  restartPolicy: Always
```

创建对应的服务

```sh
kubectl expose pod mydemo-ingress-test --port=80
```

### 创建一个nginx服务

```yaml
apiVersion: v1
kind: Pod
metadata:
  labels:
    app: nginx
  name: nginx-ingress-test
  namespace: default
spec:
  containers:
  - image: nginx
    imagePullPolicy: Always
    name: nginx
  dnsPolicy: ClusterFirst
  enableServiceLinks: true
  nodeName: node04.com
  preemptionPolicy: PreemptLowerPriority
  priority: 0
  restartPolicy: Always
```

创建对应的服务

```bash
kubectl expose pod nginx-ingress-test --port=80
```

## 1. 部署nginx-ingresses

> nginx-ingresses 安装指南: <https://kubernetes.github.io/ingress-nginx/deploy/>

```bash
helm upgrade --install ingress-nginx ingress-nginx \
  --repo https://kubernetes.github.io/ingress-nginx \
  --namespace ingress-nginx --create-namespace
# 会创建对应的ingressclass
```

## 2. 创建一个ingress

上面的命令会返回一个ingress示例，简单修改，让其访问一个存在的服务

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: test-ingress
  namespace: default
spec:
  ingressClassName: nginx
  rules:
  - host: demo.locdev.me
    http:
      paths:
      - backend:
          service:
            name: mydemo-ingress-test
            port:
              number: 80
        path: /
        pathType: Prefix
  - host: nginx.locdev.me
    http:
      paths:
      - backend:
          service:
            name: nginx-ingress-test
            port:
              number: 80
        path: /
        pathType: Prefix
```

安装的时候如果有报错如下并进行处理：

```bash
[root@node03 ingresses-test]# kubectl apply -f simple-ingress.yaml
Error from server (InternalError): error when creating "simple-ingress.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": failed to call webhook: Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/networking/v1/ingresses?timeout=10s": context deadline exceeded
[root@node03 ingresses-test]# kubectl get -A ValidatingWebhookConfiguration ingress-nginx-admission
NAME                      WEBHOOKS   AGE
ingress-nginx-admission   1          15m
[root@node03 ingresses-test]# kubectl delete -A ValidatingWebhookConfiguration ingress-nginx-admission
```

## 3. 将service/ingress-nginx-controller的端口转到前台

```bash
kubectl port-forward --namespace=ingress-nginx service/ingress-nginx-controller 8080:80
```

*   之后在当前主机可以通过`curl http://demo.locdev.me:8080/` 来访问mydemo服务。但是如果通过其他域名则会访问失败

```bash
[root@node03 ~]# curl http://demo.locdev.me:8080/
<html><body><h1>It works!</h1></body></html>
[root@node03 ~]# curl http://nginx.locdev.me:8080/
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

## 4. 通过service将controller绑定到主机端口

ingress-nginx-controller 安装后，会自带一个服务，并将服务映射到了本机端口。如下：

```bash
NAME                                         TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)                      AGE
service/ingress-nginx-controller             LoadBalancer   10.108.47.69    <pending>     80:31863/TCP,443:31535/TCP   18h
```

需要本地配置域名解析：`192.168.56.106 nginx.locdev.me nginx.locdev.me`

这样就可以通过域名加端口的方式访问不同的服务

```bash
# curl http://demo.locdev.me:31863/
<html><body><h1>It works!</h1></body></html>
                                                                                                                                
# curl http://nginx.locdev.me:31863/
<!DOCTYPE html>
<html>
<head>
<title>Welcome to nginx!</title>
<style>
html { color-scheme: light dark; }
body { width: 35em; margin: 0 auto;
font-family: Tahoma, Verdana, Arial, sans-serif; }
</style>
</head>
<body>
<h1>Welcome to nginx!</h1>
<p>If you see this page, the nginx web server is successfully installed and
working. Further configuration is required.</p>

<p>For online documentation and support please refer to
<a href="http://nginx.org/">nginx.org</a>.<br/>
Commercial support is available at
<a href="http://nginx.com/">nginx.com</a>.</p>

<p><em>Thank you for using nginx.</em></p>
</body>
</html>
```

