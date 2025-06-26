[通过 Go 语言学习测试驱动开发](https://studygolang.gitbook.io/learn-go-with-tests) 新增知识点笔记

## 测试类型

- 程序需要在一个名为 `xxx_test.go` 的文件中编写


### 单元测试
测试函数的命名必须以单词 `Test` 开始

示例
```go
package main

import "testing"

func TestHello(t *testing.T) {
    got := Hello("Chris")
    want := "Hello, Chris"

    if got != want {
        t.Errorf("got '%q' want '%q'", got, want)
    }
}
```

### 基准测试
测试函数的命名必须以单词 `Benchmark` 开始
第一次出现[位置](https://studygolang.gitbook.io/learn-go-with-tests/go-ji-chu/iteration)
示例
```go
func BenchmarkRepeat(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Repeat("a")
    }
}
```
用 `go test -bench=.` 来运行基准测试。 (如果在 Windows Powershell 环境下使用 `go test -bench="."`)

### 示例测试
测试函数的命名必须以单词 `Example` 开始

第一次出现[位置](https://studygolang.gitbook.io/learn-go-with-tests/go-ji-chu/integers)
示例
```go
func ExampleAdd() {
    sum := Add(1, 5)
    fmt.Println(sum)
    // Output: 6      
}
```
如果删除注释 「//Output: 6」，示例函数将不会执行。虽然函数会被编译，但是它不会执行。

通过添加这段代码，示例将出现在 `godoc` 的文档中，这将使你的代码更容易理解。

为了验证这一点，运行 `godoc -http=:6060` 并访问 `http://localhost:6060/pkg/`。在这里你能看到 `$GOPATH` 下所有包的列表，假如你是在 `$GOPATH/src/github.com/{your_id}` 下编写的这些代码，你就能在文档中找到它。

使用`go test`命令运行，并且可以通过`go test -run=Example`来指定运行特定的示例。

## t.Errorf()和t.Fail()
- 我们调用 `t` 的 `Errorf` 方法打印一条消息并使测试失败。`f` 表示格式化，它允许我们构建一个字符串，并将值插入占位符值 `%q` 中。当你的测试失败时，它能够让你清楚是什么错误导致的。
- 想让测试失败时可以执行 `t.Fail()` 之类的操作。

## 子测试
示例
```go
func TestHello(t *testing.T) {

    t.Run("saying hello to people", func(t *testing.T) {
        got := Hello("Chris")
        want := "Hello, Chris"

        if got != want {
            t.Errorf("got '%q' want '%q'", got, want)
        }
    })

    t.Run("say hello world when an empty string is supplied", func(t *testing.T) {
        got := Hello("")
        want := "Hello, World"

        if got != want {
            t.Errorf("got '%q' want '%q'", got, want)
        }
    })

}
```
对一个「事情」进行分组测试，然后再对不同场景进行子测试非常有效。
这种方法的好处是，你可以建立在其他测试中也能够使用的共享代码。

## 辅助函数 t.Helper()
```go
func TestHello(t *testing.T) {

    assertCorrectMessage := func(t *testing.T, got, want string) {
        t.Helper()
        if got != want {
            t.Errorf("got '%q' want '%q'", got, want)
        }
    }

    t.Run("saying hello to people", func(t *testing.T) {
        got := Hello("Chris")
        want := "Hello, Chris"
        assertCorrectMessage(t, got, want)
    })

    t.Run("empty string defaults to 'world'", func(t *testing.T) {
        got := Hello("")
        want := "Hello, World"
        assertCorrectMessage(t, got, want)
    })

}
```
`t.Helper()` 需要告诉测试套件这个方法是辅助函数（helper）。通过这样做，当测试失败时所报告的行号将在函数调用中而不是在辅助函数内部。这将帮助其他开发人员更容易地跟踪问题。如果你仍然不理解，请注释掉它，使测试失败并观察测试输出。

## HTTPTEST 
[位置](https://studygolang.gitbook.io/learn-go-with-tests/gou-jian-ying-yong-cheng-xu/http-server)


## 额外知识点

map的初始化
- `make(map[string]interface{})`
- `map[string]interface{}`
结构体格式化打印 `%#v`