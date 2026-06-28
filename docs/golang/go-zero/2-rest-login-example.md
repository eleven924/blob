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


## user.api 接口定义文件

定义了3个接口
- /user/login：通过设置

```golang
syntax = "v1"

type (
	LoginReq {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	LoginResp {
		AccessToken  string `json:"accessToken"`
		RefreshToken string `json:"refreshToken"`
		ExpiresAt    int64  `json:"expiresIn"`
	}
	RefreshReq {
		RefreshToken string `json:"refreshToken"`
	}
	UserInfoResp {
		Id       int64  `json:"id"`
		Username string `json:"username"`
		Role     string `json:"role"`
	}
)

service  pra-api {
	@handler Login
	post /user/login (LoginReq) returns (LoginResp)
	@handler RefreshToken
	post /user/refresh (RefreshReq) returns (LoginResp)
}


// 这里注意不能直接在handler方法上使用jwt注解了，https://github.com/zeromicro/go-zero/issues/5532
@server(
	jwt: JwtAuth
)
service  pra-api {

	@handler UserInfo
	get /user/info returns (UserInfoResp)
}
```

然后在`apiPra.api`中增加导入语句，导入 `import "user.api"`, 这样就可以生成为同一个入口`main`函数中了

生成api服务
```bash
goctl api go -api apiPra.api -dir .
go mod init apiPra
go mod tidy
```

## 定义配置

`internal/config/config.go` 中增加JwtAuth相关配置
```go
type Config struct {
	rest.RestConf
	RpcPraClient zrpc.RpcClientConf
	JwtAuth      struct {
		AccessSecret string
		AccessExpire int64
	}
	RefreshSecret string
	RefreshExpire int64
}

```
`etc/pra-api.yaml` 中配置对应的JwtAuth内容
```yaml
JwtAuth:
  AccessSecret: "7f2d9c5e8b0a4136c90f2e7d5b183064a2c8e0d5f7b19462c0a8e3d5b7f19264"
  AccessExpire: 600
RefreshSecret: "7f2d9c5e8b0a4136c90f2e7d5b183064a2c8e0d5f7b19462c0a8e3d5b7f19263"
RefreshExpire: 86400
```

## 完成接口

### 登录接口

`internal/logic/loginlogic.go` 
``` bash 

func (l *LoginLogic) Login(req *types.LoginReq) (resp *types.LoginResp, err error) {
	if req.Username != "admin" {
		return nil, errors.New("账户名称错误")
	}
	if req.Password != "123456" {
		return nil, errors.New("密码错误")
	}

	resp = new(types.LoginResp)
	now := time.Now()
	accessToken, err := generateAccessToken(l.svcCtx.Config.JwtAuth.AccessSecret, l.svcCtx.Config.JwtAuth.AccessExpire, now)
	if err != nil {
		return nil, errors.Join(errors.New("generateAccessToken error"), err)
	}
	refreshToken, err := generateRefreshToken(l.svcCtx.Config.RefreshSecret, l.svcCtx.Config.RefreshExpire, now)
	if err != nil {
		return nil, errors.Join(errors.New("generateRefreshToken error"), err)
	}
	resp.AccessToken = accessToken
	resp.RefreshToken = refreshToken
	resp.ExpiresAt = now.Add(time.Duration(l.svcCtx.Config.JwtAuth.AccessExpire) * time.Second).Unix()
	return
}

func generateAccessToken(secret string, accessExpire int64, now time.Time) (string, error) {
	claims := jwt.MapClaims{
		"userId": 0,
		"exp":    now.Add(time.Duration(accessExpire) * time.Second).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}

func generateRefreshToken(secret string, accessExpire int64, now time.Time) (string, error) {
	claims := jwt.MapClaims{
		"userId": 0,
		"exp":    now.Add(time.Duration(accessExpire) * time.Second).Unix(),
	}
	return jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString([]byte(secret))
}
```
### 刷新接口
```go
func (l *RefreshTokenLogic) RefreshToken(req *types.RefreshReq) (resp *types.LoginResp, err error) {
	// todo: add your logic here and delete this line
	token, err := jwt.ParseWithClaims(req.RefreshToken, jwt.MapClaims{}, func(t *jwt.Token) (any, error) {
		return []byte(l.svcCtx.Config.RefreshSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, errors.New("Refresh Token 已失效或非法")
	}

	claims := token.Claims.(jwt.MapClaims)
	userId := int64(claims["userId"].(float64))

	if userId != 0 {
		return nil, errors.New("用户已失效或非法")
	}

	resp = new(types.LoginResp)
	now := time.Now()
	accessToken, err := generateAccessToken(l.svcCtx.Config.JwtAuth.AccessSecret, l.svcCtx.Config.JwtAuth.AccessExpire, now)
	if err != nil {
		return nil, errors.Join(errors.New("generateAccessToken error"), err)
	}
	refreshToken, err := generateRefreshToken(l.svcCtx.Config.RefreshSecret, l.svcCtx.Config.RefreshExpire, now)
	if err != nil {
		return nil, errors.Join(errors.New("generateRefreshToken error"), err)
	}
	resp.AccessToken = accessToken
	resp.RefreshToken = refreshToken
	resp.ExpiresAt = now.Add(time.Duration(l.svcCtx.Config.JwtAuth.AccessExpire) * time.Second).Unix()
	return
}
```
### 需要认证的接口示例
`internal/logic/userinfologic.go` 
```go
func (l *UserInfoLogic) UserInfo() (resp *types.UserInfoResp, err error) {
	// todo: add your logic here and delete this line

	return &types.UserInfoResp{
		Username: "admin",
		Id:       0,
	}, nil
}
```

## 流程说明

go-zero 会默认启用 jwt 中间件，会将 api 定义文件中设置的 `jwt: JwtAuth` 对应的config配置来做校验，我们只需要处理登录成功返回Token，并且完成Token刷新接口就可以了。
可以看到 goctl 生成的代码已经使用 jwt 插件，并且使用了 `JwtAuth.AccessSecret` 作为密钥。
```go
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/user/info",
				Handler: UserInfoHandler(serverCtx),
			},
		},
		rest.WithJwt(serverCtx.Config.JwtAuth.AccessSecret),
	)
```

