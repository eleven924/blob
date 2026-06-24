---
title: "go zero demo"
tags: ["go-zero"]
date: 2026-06-22
---

# api 和 rpc 微服务 demo

目标：创建 go-zero 的两个微服务 apiPra 和 rpcPra ，apiPra 对外提供http接口，调用rpcPra的方法实现具体逻辑。


## 前置条件

已安装： [go](https://go-zero.dev/zh-cn/getting-started/installation/golang/), [goctl](https://go-zero.dev/zh-cn/getting-started/installation/goctl/), [protoc](https://go-zero.dev/zh-cn/getting-started/installation/protoc/)，etcd


## apiPra 服务的创建

1. 创建 apiPra 目录，并进入
2. 创建 apiPra.api 
```go
syntax = "v1"

type (
	whoReq {
		remote bool `form:"remote,optional"`
	}
	whoResp {
		ResType string `json:"type"`
		Message string `json:"message"`
	}
)

service pra-api {
	@handler GetPraMessageHandler
	get /praMessage (whoReq) returns (whoResp)
}


```
3. 生成api服务
```bash
goctl api go -api apiPra.api -dir .
go mod init apiPra
go mod tidy
```

4. 补齐logic下的getpramessagelogic.go的文件
```go
func (l *GetPraMessageLogic) GetPraMessage(req *types.WhoReq) (resp *types.WhoResp, err error) {
	// todo: add your logic here and delete this line
    // 补充以下内容
	return &types.WhoResp{ResType: "local", Message: "I'm api service"}, nil
}
```

5. go run . 运行调试, 由于请求参数remote设置了optional，所以默认可以不填，此时为false
```bash
curl http://localhost:8888/praMessage
```

## apiRpc 服务的创建

1. 创建 rpcPra 目录，并进入
2. 创建 rpcPra.proto
```proto
syntax = "proto3";

package rpcPra;
option go_package = "./rpcPra";

service rpcPra {
    rpc GetPraMessage(GetPraMessageRequest) returns (GetPraMessageResponse);
}

// 空请求体，用来占位
message GetPraMessageRequest {}

message GetPraMessageResponse {
    string type = 1;
    string message = 2;
}
```
3. 生成rpc服务
```bash
goctl rpc protoc rpcPra.proto --go_out=./praMessage --go-grpc_out=./praMessage --zrpc_out=.
go mod init rpcPra
go mod tidy
```

4. 补充logic下的文件getpramessagelogic.go逻辑
```go
func (l *GetPraMessageLogic) GetPraMessage(in *rpcPra.GetPraMessageRequest) (*rpcPra.GetPraMessageResponse, error) {
	// todo: add your logic here and delete this line

	return &rpcPra.GetPraMessageResponse{
		Type:    "rpc",
		Message: "I'm rpc service",
	}, nil
}
```
5. go run . 运行看看是否有报错. 注意需要启动etcd服务


## apiPra 调用 rpcPra 服务

生成 API 网关使用的 RPC 客户端桩代码

```bash
# 使用 rpcPra.proto 在 apiPra 中生成对应的客户端桩代码
goctl rpc protoc rpcPra.proto  --go_out=./../apiPra/praMessage --go-grpc_out=./../apiPra/praMessage --zrpc_out=./../apiPra/client
 
go mod tidy
```

修改apiPra启动配置文件 etc/pra-api.yaml,增加以下RpcPra相关内容
```yaml
Name: pra-api
Host: 0.0.0.0
Port: 8888
RpcPraClientConf:
  Etcd:
    Hosts:
      - 127.0.0.1:2379
    Key: rpcpra.rpc
  Timeout: 2000 
  KeepaliveTime: 20000
```
在 internal/config/config.go 中增加RpcPraClient, 目的是解析配置文件中的配置
```go
type Config struct {
	rest.RestConf
	RpcPraClientConf zrpc.RpcClientConf
}
```
将 RpcPraClient 添加到ServiceContext中
```go
type ServiceContext struct {
	Config       config.Config
	RpcPraClient rpcpraclient.RpcPra
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config:       c,
		RpcPraClient: rpcpraclient.NewRpcPra(zrpc.MustNewClient(c.RpcPraClientConf)),
	}
}
```
修改logic对应接口的逻辑，使其可以根据接口请求条件分别返会api响应或者调用rpc获取响应
```go
func (l *GetPraMessageLogic) GetPraMessage(req *types.WhoReq) (resp *types.WhoResp, err error) {
	// todo: add your logic here and delete this line

	if req.Remote != nil && *req.Remote == true {

		res, err := l.svcCtx.RpcPraClient.GetPraMessage(context.Background(), &rpcpraclient.GetPraMessageRequest{})

		if err != nil {
			return nil, err
		}

		return &types.WhoResp{
			ResType: res.Type,
			Message: res.Message,
		}, nil
	}
	return &types.WhoResp{ResType: "local", Message: "I'm api service"}, nil
}
```

测试
```bash
curl http://localhost:8888/praMessage?remote=true

## 响应结果如下： 
# {"type":"rpc","message":"I'm rpc service"}

curl http://localhost:8888/praMessage
## 响应结果如下：
# {"type":"local","message":"I'm api service"}
```




## 额外说明

- 当我们修改了 *.api 或者 *.proto 文件后需要重新使用 `goctl api go ...` 或者 `goctl rpc protoc ...` 命令再次生成文件
- 如果api层如果不想重新使用`goctl rpc protoc ...`，可以直接导入rpc层的包。但是不建议这样处理。
- 如果api和rpc层已经成功建立了连接，此时etcd服务宕机，不影响api层向rpc层的转发，api层的客户端会缓存宕机前的rpc列表。等待etcd恢复后会自动更新。
