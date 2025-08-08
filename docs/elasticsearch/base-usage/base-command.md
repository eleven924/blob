---
title: "elasticsearch 基础命令"
tags: ["elasticsearch"]
date: 2025-08-07
---
# elasticsearch 基础命令

## 索引

**什么是索引？**    
简单可以理解为数据库中的表，但是在 `elasticsearch` 中，索引是一个逻辑上的概念，它可以包含多个文档。  

### 创建索引

```bash
curl -X PUT "localhost:9200/my_index"
```

### 删除索引

```bash
curl -X DELETE "localhost:9200/my_index"
```

### 查看索引

```bash
curl -X GET "localhost:9200/_cat/indices?v"

# 返回数据如下：
# health status index uuid                   pri rep docs.count docs.deleted store.size pri.store.size
# yellow open   books sHO--GoXRiCDMo6f2g-B8Q   1   1          3            0     14.4kb         14.4kb
```

## 文档

**什么是文档？**  
简单可以理解为数据库中的行，但是在 `elasticsearch` 中，文档是一个逻辑上的概念，它可以包含多个字段。    
Elasticsearch以文档为单元存储数据，它期望文档以 `JSON` 格式呈现。由于需要将图书数据存储在 `elasticsearch` 中，因此我们必须将实体建模为基于 `JSON` 的文档。  
### 创建文档

```bash
curl -X POST "localhost:9200/my_index/_doc/1" -H 'Content-Type: application/json' -d '
{
  "title":"Core Java Volume I - Fundamentals",
  "author":"Cay S. Horstmann",  "release_date":"2018-08-27", 
  "amazon_rating":4.8,
  "best_seller":true,
  "prices": {
    "usd":19.95,
    "gbp":17.95,
    "eur":18.95
  }
}'
```
### 删除文档
```bash
curl -X DELETE "localhost:9200/my_index/_doc/1"
```


## 查询

### 查询所有文档
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "match_all": {}
  }
}'
```
上边的命令可以简写
```bash
curl -X GET "localhost:9200/my_index/_search"
```
### 查询指定文档
```bash
curl -X GET "localhost:9200/my_index/_doc/1"
# 以一种易读的形式返回数据
curl -X GET "localhost:9200/my_index/_doc/1?pretty"
```

### 查询多个id
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "ids": {
      "values": [1,2]
    }
  }
}'
```
### 统计文档数量
```bash
curl -X GET "localhost:9200/my_index/_count"
```

### 查询指定字段
#### match查询
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "match": {
      "title": "Core Java"
    }
  }
}'
```
`match` 是单字段查询。 这个查询是查询title字段匹配 `"Core"` 或者 `"Java"` 的文档。如果需要匹配完整的字符串可以使用 `"operator": "and"` 如下 

```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "match": {
      "title": {
        "query": "Core Java",
        "operator": "and"
      }
    }
  }
}'
```
多个match之间可以用 `bool` 查询来连接.下发会有介绍
#### multi_match查询


## 全文搜索
