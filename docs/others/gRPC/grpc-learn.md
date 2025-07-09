---
title: "gRPC 初步了解"
date: 2025-07-06
tags: ["gRPC"]
---
# gRPC 初步了解

> [Introduction to gRPC | gRPC](https://grpc.io/docs/what-is-grpc/introduction/)
>
> [gRPC 官方文档中文版\_V1.0 (oschina.net)](http://doc.oschina.net/grpc?t=58009)

## 什么是 gRPC?

gRPC 一开始由 google 开发，是一款语言中立、平台中立、开源的远程过程调用(RPC)系统。在 gRPC 里客户端应用可以像调用本地对象一样直接调用另一台不同的机器上服务端应用的方法，使得能够更容易地创建分布式应用和服务。与许多 RPC 系统类似，gRPC 也是基于以下理念：定义一个服务，指定其能够被远程调用的方法（包含参数和返回类型）。在服务端实现这个接口，并运行一个 gRPC 服务器来处理客户端调用。在客户端拥有一个存根能够像服务端一样的方法。

![](assert/landing-2.svg)

- gRPC 默认使用 [protocol buffers](https://developers.google.com/protocol-buffers/) 作为接口定义语言，来描述服务接口和有效载荷消息结构。建议在 gRPC 里使用 proto3，因为这样可以使用 gRPC 支持全部范围的的语言，并且能避免 proto2 客户端与 proto3 服务端交互时出现的兼容性问题。
- gRPC 客户端和服务端可以在多种环境中运行和交互,可以很容易地用 Java 创建一个 gRPC 服务端，用 Go、Python、Ruby 来创建客户端。


## 简单使用

> [Quick start | Go | gRPC](https://grpc.io/docs/languages/go/quickstart/)

### 安装 protobuf

- 下载地址: [Release Protocol Buffers v22.3 · protocolbuffers/protobuf · GitHub](https://github.com/protocolbuffers/protobuf/releases/tag/v22.3)
- 下载解压,并在环境变量 path 中进行配置
- 打开 cmd 窗口,执行 protoc 进行验证

### 安装 go 下的 grpc 依赖

- 先创建一个 go 项目 `go mod init grpc_study`
- 在当前项目下在 grpc 核心依赖包:`go get google.golang.org/grpc`
- 安装 go 语言的 protobuf 的代码生成工具 `go install google.golang.org/protobuf/cmd/protoc-gen-go` 和 `go install google.golang.org/grpc/cmd/protoc-gen-go-grpc` 执行成功后,GOPATH 路径下会出现两个命令`protoc-gen-go.exe 和 protoc-gen-go-grpc.exe`

### 当前 modle 目录结构

```
├─client
└─server
    └─proto
```

当前有一个客户端和一个服务端目录

### proto 文件介绍

#### 1 message 介绍

`message`：`protobuf`中定义一个消息类型是通过关键字`message`字段指定的。
消息就是需要传输的数据格式的定义。
message 关键字类似于 C++中的 class，Java 中的 class，go 中的 struct
例如：

```protobuf
message User {
  string username = 1;
  int32 age = 2;
}
```

在消息中承载的数据分别对应于每一个字段。
其中每个字段都有一个名字和一种类型 。

#### 2 字段规则

- `required`:消息体中必填字段，不设置会导致编解码异常。（例如位置 1）
- `optional`: 消息体中可选字段。（例如位置 2）
- `repeated`: 消息体中可重复字段，重复的值的顺序会被保留（例如位置 3）在 go 中重复的会被定义为切片。

```protobuf
message User {
  string username = 1;
  int32 age = 2;
  optional string password = 3;
  repeated string address = 4;
}
```

#### 3 字段映射

| **.proto Type** | **Notes**                                                                     | **C++ Type** | **Python Type** | **Go Type** |
| --------------- | ----------------------------------------------------------------------------- | ------------ | --------------- | ----------- |
| double          |                                                                               | double       | float           | float64     |
| float           |                                                                               | float        | float           | float32     |
| int32           | 使用变长编码，对于负值的效率很低，如果你的域有 可能有负值，请使用 sint64 替代 | int32        | int             | int32       |
| uint32          | 使用变长编码                                                                  | uint32       | int/long        | uint32      |
| uint64          | 使用变长编码                                                                  | uint64       | int/long        | uint64      |
| sint32          | 使用变长编码，这些编码在负值时比 int32 高效的多                               | int32        | int             | int32       |
| sint64          | 使用变长编码，有符号的整型值。编码时比通常的 int64 高效。                     | int64        | int/long        | int64       |
| fixed32         | 总是 4 个字节，如果数值总是比总是比 228 大的话，这 个类型会比 uint32 高效。   | uint32       | int             | uint32      |
| fixed64         | 总是 8 个字节，如果数值总是比总是比 256 大的话，这 个类型会比 uint64 高效。   | uint64       | int/long        | uint64      |
| sfixed32        | 总是 4 个字节                                                                 | int32        | int             | int32       |
| sfixed32        | 总是 4 个字节                                                                 | int32        | int             | int32       |
| sfixed64        | 总是 8 个字节                                                                 | int64        | int/long        | int64       |
| bool            |                                                                               | bool         | bool            | bool        |
| string          | 一个字符串必须是 UTF-8 编码或者 7-bit ASCII 编码的文 本。                     | string       | str/unicode     | string      |
| bytes           | 可能包含任意顺序的字节数据。                                                  | string       | str             | []byte      |

#### 4 默认值

protobuf3 删除了 protobuf2 中用来设置默认值的 default 关键字，取而代之的是 protobuf3 为各类型定义的默认值，也就是约定的默认值，如下表所示：

| 类型      | 默认值                                                                                        |
| :-------- | :-------------------------------------------------------------------------------------------- |
| bool      | false                                                                                         |
| 整型      | 0                                                                                             |
| string    | 空字符串                                                                                      |
| 枚举 enum | 第一个枚举元素的值，因为 Protobuf3 强制要求第一个枚举元素的值必须是 0，所以枚举的默认值就是 0 |
| message   | 不是 null，而是 DEFAULT_INSTANCE                                                              |

#### 5 标识号

`标识号`：在消息体的定义中，每个字段都必须要有一个唯一的标识号，标识号是[0,2^29-1]范围内的一个整数。

```protobuf
message Person {

  string name = 1;  // (位置1)
  int32 id = 2;
  optional string email = 3;
  repeated string phones = 4; // (位置4)
}
```

以 Person 为例，name=1，id=2, email=3, phones=4 中的 1-4 就是标识号。

#### 6 定义多个消息类型

一个 proto 文件中可以定义多个消息类型

```go
message UserRequest {
  string username = 1;
  int32 age = 2;
  optional string password = 3;
  repeated string address = 4;
}

message UserResponse {
  string username = 1;
  int32 age = 2;
  optional string password = 3;
  repeated string address = 4;
}
```

#### 7 嵌套消息

可以在其他消息类型中定义、使用消息类型，在下面的例子中，Person 消息就定义在 PersonInfo 消息内，如 ：

```protobuf
message PersonInfo {
    message Person {
        string name = 1;
        int32 height = 2;
        repeated int32 weight = 3;
    }
	repeated Person info = 1;
}
```

如果你想在它的父消息类型的外部重用这个消息类型，你需要以 PersonInfo.Person 的形式使用它，如：

```protobuf
message PersonMessage {
	PersonInfo.Person info = 1;
}
```

当然，你也可以将消息嵌套任意多层，如 :

```protobuf
message Grandpa { // Level 0
    message Father { // Level 1
        message son { // Level 2
            string name = 1;
            int32 age = 2;
    	}
	}
    message Uncle { // Level 1
        message Son { // Level 2
            string name = 1;
            int32 age = 2;
        }
    }
}
```

#### 8 定义服务(Service)

如果想要将消息类型用在 RPC 系统中，可以在.proto 文件中定义一个 RPC 服务接口，protocol buffer 编译器将会根据所选择的不同语言生成服务接口代码及存根。

```protobuf
service SearchService {
	//rpc 服务的函数名 （传入参数）返回（返回参数）
	rpc Search (SearchRequest) returns (SearchResponse);
}
```

上述代表表示，定义了一个 RPC 服务，该方法接收 SearchRequest 返回 SearchResponse

### 定义 proto 文件

[proto3 语言指南](https://developers.google.com/protocol-buffers/docs/proto3)

```go
// 标明当前使用的语法 proto3
syntax = "proto3";

// 标明最后生成的代码在那个目录的哪个包中,中间用;分隔,
option go_package = ".;gen_server";

// 用service定义了一个服务,服务中有一个方法,用来接收客户端的参数,然后返回服务端的响应
// 可以看到定义一个SayHello的service,服务中有一个rpc方法,名字也叫SayHello,接受一个HelloReq,返回一个HelloRes
service SayHello{
  rpc SayHello(HelloReq) returns(HelloRes){};
}

// message 关键字,可以理解为go语言的结构体,面对对象语言中的对象
// 需要注意的是,等号后边并不是真的复制, 而是定义这个变量在结构体中的位置
message HelloReq{
    string messageType=1;
    int64 messageLen=2;
}
message HelloRes{
    string resMessage = 1;
}
```

编写完上面的内容后,就可以到 proto 目录下执行命令 来生成代码

```bash
protoc --go_out=. hello.proto  #生成了server\proto\hello.pb.go文件
protoc --go-grpc_out=. hello.proto #生成了server\proto\hello_grpc.pb.go文件
# 当然也可以一起生成 protoc --go_out=. --gp-rpc_out=. hello.proto
```

### 编写服务端(server/main.go)

- 创建 gRPC Server 对象,
- 将创建的 server 注册到 gRPC Server 的内部注册中心
- 创建 Listen,监听 TCP 端口
- 启动,开始监听,直到停止

```go
package main
import (
    "context"
    "fmt"
    pb "grpc_study/server/proto"
    "net"
    "google.golang.org/grpc"

)

// 理解为继承UnimplementedSayHelloServer类,UnimplementedSayHelloServer结构体实现了SayHello接口
type server struct {
   pb.UnimplementedSayHelloServer
}

// 重写SayHello方法
func (serv *server) SayHello(ctx context.Context, req *pb.HelloReq) (*pb.HelloRes, error) {
    return &pb.HelloRes{ResMessage: "Message send by SayHello server :Hello " + req.MessageName}, nil
}

func main() {
    listen, _ := net.Listen("tcp", ":9090")
    gRPCServer := grpc.NewServer()
    pb.RegisterSayHelloServer(gRPCServer, &server{})
    err2 := gRPCServer.Serve(listen)
    if err2 != nil {
        fmt.Printf("failed to serve:%v", err2)
        return
    }
}
```

### 编写客户端(client/main.go)

- 连接服务端
- 创建 server 的客户端对象
- 发送 rpc 请求,等待同步响应,获取结果
- 输出响应结果
  先将 server 下的 proto 拷贝一份给 client

```go
package main

import (
	"context"
	"fmt"
	"log"

	pb "grpc_study/server/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func main() {
	//  连接到server,此处没有用到加密和验证,所以禁用了安全传输
	cc, err := grpc.Dial("127.0.0.1:9090", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		log.Fatalf("connetc server failed : %v", err)
	}

	defer cc.Close()

	// 创建新的客户端连接,此方法是自动生成的
	client := pb.NewSayHelloClient(cc)

	hr, err2 := client.SayHello(context.Background(), &pb.HelloReq{MessageName: "XiaoMing", MessageLen: 1})

	if err2 != nil {
		log.Fatalf("exec rpc func failed %v", err2)
	}

	fmt.Println(hr.GetResMessage())

}
```

### 运行

先运行服务端,在运行客户端,客户端会返回信息 `Message send by SayHello server :Hello XiaoMing`

## 认证与安全传输

### SSL/TLS 认证

#### 安装 openssl

已经编译好的安装包:https://slproweb.com/products/Win32OpenSSL.html, 当然也可以选择源码编译安装;安装完毕后配置到 path

#### 生成对应的密钥文件

在 server 和 client 的同级目录可以建立一个 key 文件夹,专门来存放生成的密钥文件

- 生成证书

```bash
# 生成私钥文件
openssl genrsa -out server.key 2048
# 生成证书文件,全部回车, 可以不填写具体信息
openssl req -new -x509 -key server.key -out server.crt -days 36500
# 生成csr文件
openssl req -new -key server.key -out server.csr
```

- 修改 openssl.cfg 文件(linux 是 cnf)

```bash
# 复制openssl安装目录的bin下的openssl.cfg文件到key目录下
# 找到[ CA_default ], 将其中的# copy_extensions = copy 注释打开
# 找到[ req ],将其中的# req_extensions = v3_req 的注释打开
# 找到[ v3_req ],添加 subjectAltName = @alt_names
# 添加新的标签 [ alt_names ]和标签字段:  DNS.1 = *grpcstudy.com
```

`*grpcstudy.com` 要求只能从指定的域名进行访问, 如果设置为\*,则通过所有请求

- 生成服务端/客户端用到的证书和私钥

```bash
openssl genpkey -algorithm RSA -out test.key

# 通过私钥生成证书请求文件
openssl req -new -nodes -key test.key -out test.csr  -subj "/C=cn/OU=myorg/O=mycomp/CN=myname" -config ./openssl.cfg -extensions v3_req
# test.csr 是上面生成的证书请求文件,server.crt/server.key是CA证书文件和key,用来对test.csr进行签名认证,这两个文件在第一部分生成

# 生成SAN证书文件,pem
openssl x509 -req -days 3650 -in test.csr -out test.pem -CA server.crt -CAkey server.key -CAcreateserial  -extfile ./openssl.cfg -extensions v3_req
```

#### 单向认证

##### 单向认证流程

![](assert/1586953-20210625171059706-1447106002-16509094111532.png)

##### 服务端使用证书

server 的 main 方法只修改了两行代码

```go
func main() {
	// 从文件中获取证书,注意这里是NewServerTLSFromFile,之后在注意对比客户端的方法
	tc, _ := credentials.NewServerTLSFromFile("E:/myspace/gotest/grpc_study/key/test.pem", "E:/myspace/gotest/grpc_study/key/test.key")

	listen, _ := net.Listen("tcp", ":9090")
	// 创建server的时候添加证书配置
	gRPCServer := grpc.NewServer(grpc.Creds(tc))
	pb.RegisterSayHelloServer(gRPCServer, &server{})
	err2 := gRPCServer.Serve(listen)
	if err2 != nil {
		fmt.Printf("failed to serve:%v", err2)
		return
	}
}
```

##### 客户端使用证书

client 的 main 方法只修改了开头的两行代码

```go
func main() {
	// 获取证书
	creds, _ := credentials.NewClientTLSFromFile("E:/myspace/gotest/grpc_study/key/test.pem", "*grpcstudy.com")

	//  这里填写获取到的证书
	cc, err := grpc.Dial("127.0.0.1:9090", grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("connetc server failed : %v", err)
	}

	defer cc.Close()

	// 创建新的客户端连接,此方法是自动生成的
	client := pb.NewSayHelloClient(cc)

	hr, err2 := client.SayHello(context.Background(), &pb.HelloReq{MessageName: "XiaoMing", MessageLen: 1})

	if err2 != nil {
		log.Fatalf("exec rpc func failed %v", err2)
	}

	fmt.Println(hr.GetResMessage())

}
```

可以尝试启动 server 的 main 方法,然后在启动 client 的 main 方法了

#### 双向认证

##### 双向认证流程

![](assert/1586953-20210625211235069-195172761-16509094417774.png)

##### 生成供客户端使用的密钥文件

整体的生成过程和服务端的 test.pem 等文件一致

```bash
openssl genpkey -algorithm RSA -out testClient.key

openssl req -new -nodes -key testClient.key -out testClient.csr  -subj "/C=cn/OU=myorg/O=mycomp/CN=myname" -config ./openssl.cfg -extensions v3_req

openssl x509 -req -days 3650 -in testClient.csr -out testClient.pem -CA server.crt -CAkey server.key -CAcreateserial  -extfile ./openssl.cfg -extensions v3_req
```

##### 编写服务端代码

```go
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	pb "grpc_study/server/proto"
	"io/ioutil"
	"log"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

// 理解为继承UnimplementedSayHelloServer类,UnimplementedSayHelloServer结构体实现了SayHello接口
type server struct {
	pb.UnimplementedSayHelloServer
}

// 重写SayHello方法
func (serv *server) SayHello(ctx context.Context, req *pb.HelloReq) (*pb.HelloRes, error) {
	return &pb.HelloRes{ResMessage: "Message send by SayHello server :Hello " + req.MessageName}, nil
}

func main() {

	cert, err := tls.LoadX509KeyPair("E:/myspace/gotest/grpc_study/key/test.pem", "E:/myspace/gotest/grpc_study/key/test.key")
	if err != nil {
		log.Fatal("服务端证书读取错误", err)
	}

	cp := x509.NewCertPool()
	ca, err2 := ioutil.ReadFile("E:/myspace/gotest/grpc_study/key/server.crt")
	if err2 != nil {
		log.Fatal("ca证书读取错误", err2)
	}
	// 尝试解析传入的pem编码的证书,如果解析成功将会将其加到cp 中,以便之后使用
	cp.AppendCertsFromPEM(ca)
	// 构建基于 TLS 的 TransportCredentials 选项
	cerds := credentials.NewTLS(&tls.Config{
		// 设置证书链，允许包含一个或多个
		Certificates: []tls.Certificate{cert},
		// 要求必须校验客户端的证书。可以根据实际情况选用以下参数
		ClientAuth: tls.RequireAndVerifyClientCert,
		// 设置根证书的集合，校验方式使用 ClientAuth 中设定的模式
		ClientCAs: cp,
	})

	listen, _ := net.Listen("tcp", ":9090")
	gRPCServer := grpc.NewServer(grpc.Creds(cerds))
	pb.RegisterSayHelloServer(gRPCServer, &server{})
	err3 := gRPCServer.Serve(listen)
	if err3 != nil {
		fmt.Printf("failed to serve:%v", err2)
		return
	}
}
```

##### 编写客户端代码

```go
package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"io/ioutil"
	"log"

	pb "grpc_study/server/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
)

func main() {
	cert, err := tls.LoadX509KeyPair("E:/myspace/gotest/grpc_study/key/testClient.pem", "E:/myspace/gotest/grpc_study/key/testClient.key")
	if err != nil {
		log.Fatal("客户端证书加载错误", err)

	}
	cp := x509.NewCertPool()
	ca, _ := ioutil.ReadFile("E:/myspace/gotest/grpc_study/key/server.crt")
	// 尝试解析所传入的 PEM 编码的证书。如果解析成功会将其加到 CertPool 中，便于后面的使用
	cp.AppendCertsFromPEM(ca)
	// 构建基于 TLS 的 TransportCredentials 选项
	creds := credentials.NewTLS(&tls.Config{
		// 设置证书链，允许包含一个或多个
		Certificates: []tls.Certificate{cert},
		// 要求必须校验客户端的证书。可以根据实际情况选用以下参数
		ServerName: "*grpcstudy.com",
		RootCAs:    cp,
	})

	//  连接到server,此处没有用到加密和验证,所以禁用了安全传输
	cc, err := grpc.Dial("127.0.0.1:9090", grpc.WithTransportCredentials(creds))
	if err != nil {
		log.Fatalf("connetc server failed : %v", err)
	}

	defer cc.Close()

	// 创建新的客户端连接,此方法是自动生成的
	client := pb.NewSayHelloClient(cc)

	hr, err2 := client.SayHello(context.Background(), &pb.HelloReq{MessageName: "XiaoMing", MessageLen: 1})

	if err2 != nil {
		log.Fatalf("exec rpc func failed %v", err2)
	}

	fmt.Println(hr.GetResMessage())

}
```

### Token 认证

gRPC 提供了一个接口(cerdentials 包下),接口中有两个方法,需要**客户端**进行实现
第一个方法: 获取元数据信息,也就是客户端提供的 key,value;ctx 用于控制超市和取消,uri 是具体请求入口的 url
第二个方法: 是否需要基于 TLS 认证进行安全传输,如果返回值是 true,则需要加上 TLS,否则不需要

```go
// PerRPCCredentials defines the common interface for the credentials which need to
// attach security information to every RPC (e.g., oauth2).
type PerRPCCredentials interface {
	// GetRequestMetadata gets the current request metadata, refreshing tokens
	// if required. This should be called by the transport layer on each
	// request, and the data should be populated in headers or other
	// context. If a status code is returned, it will be used as the status for
	// the RPC (restricted to an allowable set of codes as defined by gRFC
	// A54). uri is the URI of the entry point for the request.  When supported
	// by the underlying implementation, ctx can be used for timeout and
	// cancellation. Additionally, RequestInfo data will be available via ctx
	// to this call.  TODO(zhaoq): Define the set of the qualified keys instead
	// of leaving it as an arbitrary string.
	GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error)
	// RequireTransportSecurity indicates whether the credentials requires
	// transport security.
	RequireTransportSecurity() bool
}
```

gRPC 将各种认证方式浓缩到一个凭证(cerdentials)上,可以单独使用一种凭证, 也可以多种凭证组合, gRPC 提供了统一的 api 验证机制,以供方便使用

#### 服务端实现接口

```go
package main

import (
	"context"
	"fmt"
	"log"

	pb "grpc_study/server/proto"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

// 创建结构体实现接口 PerRPCCredentials
type ClientTokenAuth struct {
}

func (c ClientTokenAuth) GetRequestMetadata(ctx context.Context, uri ...string) (map[string]string, error) {
	return map[string]string{
		"user":  "xiaoming",
		"token": "123321123",
	}, nil
}

func (c ClientTokenAuth) RequireTransportSecurity() bool {
	return false
}

func main() {
	// 创建列表接受证书配置,WithTransportCredentials接收一个没有配置TLS的证书
	var opts []grpc.DialOption
	opts = append(opts, grpc.WithTransportCredentials(insecure.NewCredentials()))
	opts = append(opts, grpc.WithPerRPCCredentials(new(ClientTokenAuth)))

	//  这里填写获取到的证书
	cc, err := grpc.Dial("127.0.0.1:9090", opts...)
	if err != nil {
		log.Fatalf("connetc server failed : %v", err)
	}

	defer cc.Close()

	// 创建新的客户端连接,此方法是自动生成的
	client := pb.NewSayHelloClient(cc)

	hr, err2 := client.SayHello(context.Background(), &pb.HelloReq{MessageName: "XiaoMing", MessageLen: 1})

	if err2 != nil {
		log.Fatalf("exec rpc func failed %v", err2)
	}

	fmt.Println(hr.GetResMessage())

}
```

#### 服务端进行验证

```go
package main

import (
	"context"
	"errors"
	"fmt"
	pb "grpc_study/server/proto"
	"net"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/metadata"
)

// 理解为继承UnimplementedSayHelloServer类,UnimplementedSayHelloServer结构体实现了SayHello接口
type server struct {
	pb.UnimplementedSayHelloServer
}

// 重写SayHello方法
func (serv *server) SayHello(ctx context.Context, req *pb.HelloReq) (*pb.HelloRes, error) {
	md, ok := metadata.FromIncomingContext(ctx)
	if !ok {
		return nil, errors.New("未传输Token")
	}

	var user string
	var token string

	if s, ok := md["user"]; ok {
		user = s[0]
	}

	if s, ok := md["token"]; ok {
		token = s[0]
	}
	if user != "xiaoming" || token != "123321123" {
		return nil, errors.New("Token 不正确")
	}

	return &pb.HelloRes{ResMessage: "Message send by SayHello server :Hello " + req.MessageName}, nil
}

func main() {
	listen, _ := net.Listen("tcp", ":9090")
	// 创建server的时候添加证书配置
	gRPCServer := grpc.NewServer(grpc.Creds(insecure.NewCredentials()))
	pb.RegisterSayHelloServer(gRPCServer, &server{})
	err2 := gRPCServer.Serve(listen)
	if err2 != nil {
		fmt.Printf("failed to serve:%v", err2)
		return
	}
}
```

## gRPC 流处理

```
// 普通 RPC
rpc SimplePing(PingRequest) returns (PingReply);
// 客户端流式 RPC
rpc ClientStreamPing(stream PingRequest) returns (PingReply);
// 服务器端流式 RPC
rpc ServerStreamPing(PingRequest) returns (stream PingReply);
// 双向流式 RPC
rpc BothStreamPing(stream PingRequest) returns (stream PingReply);
```

### 双向流处理

创建 streamPractice 目录,目录下创建 server 和 client 目录,分别在目录下创建 proto 目录,并完成 proto 文件,结构整体上和非流式客户端保持一致

- 完成 proto 文件

```go
// 标明当前使用的语法 proto3
syntax = "proto3";

// 标明最后生成的代码在那个目录的哪个包中,中间用;分隔,
option go_package = ".;gen_stream_server";


// 用service定义了一个服务,服务中有一个方法,用来接收客户端的参数,然后返回服务端的响应
// 可以看到定义一个SayHello的service,服务中有一个rpc方法,名字也叫SayHello,接受一个HelloReq,返回一个HelloRes
// ********************定义了一个双向流式客户端******************************
service SayHello{
  rpc SayHello(stream HelloStreamReq) returns(stream HelloStreamRes){};
}

// message 关键字,可以理解为go语言的结构体,面对对象语言中的对象
// 需要注意的是,等号后边并不是真的复制, 而是定义这个变量在结构体中的位置
message HelloStreamReq{
  string messageName=1;
  int64 messageLen=2;
}

message HelloStreamRes{
  string resMessage = 1;
}
```

- 自动生成代码

```
protoc --go_out=. streamHello.proto
protoc --go-grpc_out=. streamHello.proto
```

- 编写服务端代码
  不是通过函数入口接收 req , 返回 res 的方式进行的处理
  函数入口接收的是一个 spb.SayHello_SayHelloServer 结构体,该结构以实现了 ServerStream 接口,并实现了 send 和 recv 方法
  通过这两个方法实现服务端和客户端流式的信息传输

```go
package main

import (
	"fmt"
	"google.golang.org/grpc"
	spb "grpc_study/stream/server/proto"
	"net"
	"time"
)

type streamServer struct {
	spb.UnimplementedSayHelloServer
}

func (streamS *streamServer) SayHello(server spb.SayHello_SayHelloServer) error {
	recv, err := server.Recv()
	if err != nil {
		return fmt.Errorf("服务端流接受失败:", err)
	}
	fmt.Println("服务端接受的消息", recv.MessageName)
	time.Sleep(time.Second)
	s := &spb.HelloStreamRes{ResMessage: "recv " + recv.MessageName}
	err1 := server.Send(s)
	if err1 != nil {
		return fmt.Errorf("服务端流发送失败:", err)
	}
	return nil
}

func main() {
	listen, err := net.Listen("tcp", ":10001")
	if err != nil {
		panic(fmt.Errorf("监听端口失败", err))
	}
	server := grpc.NewServer()
	spb.RegisterSayHelloServer(server, &streamServer{})
	err = server.Serve(listen)
	if err != nil {
		panic(fmt.Errorf("服务端启动失败", err))
	}
}

```

- 编写客户端代码

```go
package main

import (
	"context"
	"fmt"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	spb "grpc_study/stream/server/proto"
)

func main() {
	dial, err := grpc.Dial("127.0.0.1:10001", grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		panic(err)
	}
	defer dial.Close()

	client := spb.NewSayHelloClient(dial)
	hello, err1 := client.SayHello(context.Background())
	if err1 != nil {
		panic(err1)
	}
	err = hello.Send(&spb.HelloStreamReq{
		MessageName: "zhc",
		MessageLen:  0,
	})
	if err != nil {
		panic(err)
	}

	recv, err := hello.Recv()
	if err != nil {
		panic(err)
	}
	fmt.Println("接受服务端的resp:", recv.ResMessage)
	err = hello.CloseSend()
	if err != nil {
		panic(err)
	}

}

```
