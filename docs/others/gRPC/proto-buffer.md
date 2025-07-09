---
title: "proto-buffer"
date: 2025-07-06
tags: ["gRPC"]
---
# proto-buffer
## 1 简介

Protocol buffers 非常适合任何需要以语言中立、平台中立、可扩展的方式序列化结构化、类记录、类型化数据的情况。它们最常用于定义通信协议（与 gRPC 一起）和数据存储。

使用协议缓冲区的一些优点包括：

- 紧凑的数据存储
- 快速解析
- 可用于多种编程语言
- 通过自动生成的类优化功能

工作流程如下:
![](assert/Pasted%20image%2020231031143550.png)

## 2 message 介绍

简单例子, 定义了一个 message:

```proto
// 指定使用proto3的语法,如果不指定,将使用proto2的语法
syntax = "proto3";

// SearchRequest 指定了3个字段, 每行都包含一个字段类型和字段名称
message SearchRequest {
  string query = 1;
  int32 page_number = 2;
  int32 results_per_page = 3;
}
```

> 注意: 使用 `// 和 /* ... */` 对 proto 文件进行注释

### 2.1 字段编号

必须要为上边定义的 SearchRequest 中的每个字段分配一个字段编号(1 到 536,870,911),并且有以下限制:

- 给定的编号必须是再整个 SearchRequest 中是唯一的
- 19,000 to 19,999 是保留字段编号,如果使用,会在编译时报错

注意:

- 如果 SearchRequest 一旦被使用,就不能再进行修改, 修改后会认为原字段被删除,后增加了一个同名的字段
- 应该将最常用的字段设置为 1-15,这样节省空间

### 2.2 字段标签(label)

- optional: 一个有 optional 标签的字段有两种状态, 1. 该字段被显示的设置,将会对其进行序列化, 2. 该字段没有被设置,将会返回一个默认值,并且不会被序列化
- repeated: 标识该字段可以重复 0 至多次,顺序也将被保留
- map: 标识该字段是一个键值对类型的字段
- 如果没有明确指定, 将被设置为 "implicit field presence" , 一个良好的 message 最好有不超过一个此类字段

### 2.3 删除字段

当 message 中一个字段不再被需要,可以将其从文件定义中删除, 需要保留该字段的字段编号, 同时也应该保留字段名称

### 2.4 保留字段

重用以删除的字段的编号可以会造成一系列问题, 因此需要 将 字段名称和字段编号添加到 reserved 列表中,如下:

```proto
message Foo {
  reserved 2, 15, 9 to 11;
  reserved "foo", "bar";
}
```

注意, 不能将字段名和字段字段编号记录到同一个 reserved 中

### 2.5 定义多个消息类型

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

### 2.6 嵌套消息

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

如果想在它的父消息类型的外部重用这个消息类型，你需要以 PersonInfo.Person 的形式使用它，如：

```protobuf
message PersonMessage {
	PersonInfo.Person info = 1;
}
```

当然，也可以将消息嵌套任意多层，如 :

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

## 3 字段标量值类型关系

一个 标量 message 字段可以有以下类型,下面列出了 Java/Python/Go 对应的字段类型,其他语言可以到[官网](https://protobuf.dev/programming-guides/proto3/#scalar)查看

| **.proto Type** | **Notes**                                                                     | **Java Type** | **Python Type** | **Go Type** |
| --------------- | ----------------------------------------------------------------------------- | ------------- | --------------- | ----------- |
| double          |                                                                               | double        | float           | float64     |
| float           |                                                                               | float         | float           | float32     |
| int32           | 使用变长编码，对于负值的效率很低，如果你的域有 可能有负值，请使用 sint64 替代 | int           | int             | int32       |
| int64           | 使用变长编码，对于负值的效率很低，如果你的域有 可能有负值，请使用 sint64 替代 | long          | int/long        | int64       |
| uint32          | 使用变长编码                                                                  | int           | int/long        | uint32      |
| uint64          | 使用变长编码                                                                  | long          | int/long        | uint64      |
| sint32          | 使用变长编码，这些编码在负值时比 int32 高效的多                               | int           | int             | int32       |
| sint64          | 使用变长编码，有符号的整型值。编码时比通常的 int64 高效。                     | long          | int/long        | int64       |
| fixed32         | 总是 4 个字节，如果数值总是比总是比 228 大的话，这 个类型会比 uint32 高效。   | int           | int             | uint32      |
| fixed64         | 总是 8 个字节，如果数值总是比总是比 256 大的话，这 个类型会比 uint64 高效。   | long          | int/long        | uint64      |
| sfixed32        | 总是 4 个字节                                                                 | int           | int             | int32       |
| sfixed64        | 总是 8 个字节                                                                 | long          | int/long        | int64       |
| bool            |                                                                               | boolean       | bool            | bool        |
| string          | 一个字符串必须是 UTF-8 编码或者 7-bit ASCII 编码的文 本。                     | string        | str/unicode     | string      |
| bytes           | 可能包含任意顺序的字节数据。                                                  | ByteString    | str             | []byte      |

## 4 默认值

在解析 message 时,如果没有包含某个字段,该字段会被设置为特定的值

- For strings, the default value is the empty string.
- For bytes, the default value is empty bytes.
- For bools, the default value is false.
- For numeric types, the default value is zero.
- For enums, the default value is the first defined enum value, which must be 0.
- For message fields, the field is not set. Its exact value is language-dependent. See the generated code guide for details.

repeated 字段的默认值默认为空,通常是各个语言的空列表

## 5 枚举

来看一个枚举类型的定义和使用

```proto
enum Corpus {
  CORPUS_UNSPECIFIED = 0;
  CORPUS_UNIVERSAL = 1;
  CORPUS_WEB = 2;
  CORPUS_IMAGES = 3;
  CORPUS_LOCAL = 4;
  CORPUS_NEWS = 5;
  CORPUS_PRODUCTS = 6;
  CORPUS_VIDEO = 7;
}

message SearchRequest {
  string query = 1;
  int32 page_number = 2;
  int32 results_per_page = 3;
  Corpus corpus = 4;
}
```

可以看到枚举类型的 Corpus 第一个常量设置为 0,这是必须的,因为:

- 需要将 0 值对应的常量设置为默认值
- 为了和 proto2 语义兼容

可以为不同枚举常量设置相同的值,来设置别名, 并且需要设置`option allow_alias = true;`

```proto
enum EnumAllowingAlias {
  option allow_alias = true;
  EAA_UNSPECIFIED = 0;
  EAA_STARTED = 1;
  EAA_RUNNING = 1;
  EAA_FINISHED = 2;
}

enum EnumNotAllowingAlias {
  ENAA_UNSPECIFIED = 0;
  ENAA_STARTED = 1;
  // ENAA_RUNNING = 1;  // Uncommenting this line will cause a warning message.
  ENAA_FINISHED = 2;
}
```

### 5.1 保留值

为了保证删除的值不被重用,需要对其进行保留, 可以使用 max 来指定最大值,示例如下

```proto
enum Foo {
  reserved 2, 15, 9 to 11, 40 to max;
  reserved "FOO", "BAR";
}
```

## 6 使用其他的 message 作为一个 message 的字段类型

### 在同一 proto 文件中

示例:

```proto
message SearchResponse {
  repeated Result results = 1;
}

message Result {
  string url = 1;
  string title = 2;
  repeated string snippets = 3;
}
```

### 在不同文件中

在文件顶部加入导入信息

```proto
import "myproject/other_protos.proto";
```

### 间接导入

可以通过使用 `import public` 来进行传递,示例

```
// new.proto
// All definitions are moved here
```

```
// old.proto
// This is the proto that all clients are importing.
```

```
import public "new.proto";
import "other.proto";
// client.proto
import "old.proto";
// You use definitions from old.proto and new.proto, but not other.proto
```

注意: public import functionality is not available in Java.

## 7 更新一个 message 类型

- 永远不要更新一个已经存在的字段的编号,(此操作相当于删除后新增加了一个同名的字段)
- 新增字段不会影响旧客户端代码的使用
- 删除一个字段,需要为字段增加“OBSOLETE\_”前缀,或者添加到 reserved 列表中,防止被重用
- int32, uint32, int64, uint64, bool 互相兼容, 类型可以相互转换
- sint32, sint64 互相兼容,但与其他整数不兼容
- string and bytes 在 UTF-8 下兼容
- fixed32 is compatible with sfixed32, and fixed64 with sfixed64.
- 对于 string, bytes, and message 的字段,optional 和 repeated 兼容

## 8 Any

使用 any,需要导入`import google/protobuf/any.proto`
可以嵌套使用 message 而不必在 proto 中对其进行定义,以及作为该消息的全局唯一标识符并解析为该消息类型的 URL。

```
import "google/protobuf/any.proto";

message ErrorStatus {
  string message = 1;
  repeated google.protobuf.Any details = 2;
}
```

## 9 Oneof

如果一个 message 中有多个字段,但是每次只需要使用一个字段,就可以使用 oneof 特性
示例:

```
message SampleMessage {
  oneof test_oneof {
    string name = 4;
    SubMessage sub_message = 9;
  }
}
```

可以使用除 map 和 repeated 外的任何类型
如果设置了 oneof 中多个字段的值,只会保留最后一个设置的字段的值

## 10 Maps

语法: `map<key_type, value_type> map_field = N;`
key_type 可以是任何整数或者字符串类型,
value_type 可以是除了 map 外的任何类型
示例:

```proto
map<string, Project> projects = 3;
```

- 不能被 repeated 标识
- 是无序的

## 11 package

可以添加一个配置 package 来方式 message 之间的名称冲突

```
package foo.bar;
message Open { ... }
You can then use the package specifier when defining fields of your message type:

message Foo {
  ...
  foo.bar.Open open = 1;
  ...
}
```

指定此项配置对不同语言的影响:
In Java and Kotlin, the package is used as the Java package, unless you explicitly provide an option java_package in your .proto file.
In Python, the package directive is ignored, since Python modules are organized according to their location in the file system.
In Go, the package is used as the Go package name, unless you explicitly provide an option go_package in your .proto file.

## 12 定义 Services

如果想在 RPC(远程过程调用)系统中使用你的消息类型，你可以在.proto 文件中定义 RPC 服务接口，protocol buffer 编译器将用你选择的语言生成服务接口代码和存根。例如: 想定义一个 RPC 服务，它的方法接受你的 SearchRequest 并返回一个 SearchResponse，可以在.proto 文件中定义如下:

```
service SearchService {
  rpc Search(SearchRequest) returns (SearchResponse);
}
```

## 13 Options
常用配置项说明:
- java_package (file option): 希望用于生成的Java/Kotlin类的包。如果没有显式java_package选项在。Proto文件，则默认使用Proto包(使用. Proto文件中的"package"关键字指定)。然而，原型包通常不能生成好的Java包，因为原型包不希望以反向域名开始。如果不生成Java或Kotlin代码，则此选项不起作用。`option java_package = "com.example.foo";`
- java_outer_classname (file option): 想要生成的包装器Java类的类名(以及文件名)。如果没有显式指定java_outer_classname。类名将通过将. Proto文件名转换为驼峰大小写来构造(因此foo_bar。proto变成FooBar.java)。如果java_multiple_files选项被禁用，那么所有其他类/枚举/等。为.proto文件生成的将在这个外部包装器Java类中以嵌套类/枚举等形式生成。如果不生成Java代码，则此选项不起作用。`option java_outer_classname = "Ponycopter";`
- java_multiple_files (file option): 如果为false，则只会为这个.proto文件生成一个.Java文件，以及所有的Java类/枚举等。为顶层消息、服务和枚举生成的将被嵌套在一个外部类中(参见java_outer_classname)。如果为true，将为每个Java类/枚举等生成单独的. Java文件。为顶级消息、服务和枚举生成，并且为该.proto文件生成的包装器Java类将不包含任何嵌套类/枚举等。这是一个布尔选项，默认为false。如果不生成Java代码，则此选项不起作用。`option java_multiple_files = true;`
