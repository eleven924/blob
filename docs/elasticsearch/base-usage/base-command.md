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
### 批量创建文档

批量创建文档可以使用 `_bulk` API，该 API 可以同时创建多个文档。

```bash
curl -X POST "localhost:9200/_bulk" -H 'Content-Type: application/json' -d '
{"index": {"_index": "my_index", "_id": "1"}}
{"title":"Core Java Volume I - Fundamentals","author":"Cay S. Horstmann","release_date":"2018-08-27","amazon_rating":4.8,"best_seller":true,"prices":{"usd":19.95,"gbp":17.95,"eur":18.95}}
{"index": {"_index": "my_index", "_id": "2"}}
{"title":"Core Java Volume II - Advanced Features","author":"Cay S. Horstmann","release_date":"2019-08-27","amazon_rating":4.7,"best_seller":true,"prices":{"usd":20.95,"gbp":18.95,"eur":19.95}}
{"index": {"_index": "my_index", "_id": "3"}}
{"title":"Core Java Volume III - The New Features","author":"Cay S. Horstmann","release_date":"2020-08-27","amazon_rating":4.6,"best_seller":true,"prices":{"usd":21.95,"gbp":19.95,"eur":20.95}}
'
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
## 全文搜索
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
`match` 是单字段查询。 这个查询是查询title字段匹配 `"Core"` 或者 `"Java"` 的文档。如果需要同时匹配这两个单词可以使用 `"operator": "and"` 如下 

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

`multi_match` 是多字段查询。 这个查询是查询title字段或者author字段匹配 `"Core"` 或者 `"Java"` 的文档。

```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "multi_match": {
      "query": "Core Java",
      "fields": ["title", "author"]
    }
  }
}'
```
可以通过如下方式提升字段的权重， 这样查询结果果命中`title`字段的话会比命中`author`字段的`_score`高。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "multi_match": {
      "query": "Core Java",
      "fields": ["title^2", "author"]
    }
  }
}'
```

### 搜索短语
按照给定的顺序精确地搜索一组单词
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    # match_phrase查询获取精确匹配的短语（一组有序的单词）
    "match_phrase": {  
     #在每本书的synopsis字段中搜索的短语
      "synopsis": "must-have book for every Java programmer"  
    }
  }
}'
```
#### 处理单词缺失
`match_phrase`查询期望一个完整的短语：一个没有缺失任何单词的短语。然而，用户可能不会总是输入精确的短语。为了处理这种情况， `Elasticsearch` 的解决方案是在 `match_phrase` 查询上设置一个 `slop` 参数——表示在搜索时短语可以缺失的单词数量的正整数。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
GET books/_search
{
  "query": {
    "match_phrase": {
      "synopsis": {
      "query": "must-have book every Java programmer",
      "slop": 2
      }
    }
  }
}'
```
#### 处理单词顺序
通过使用带有 `uzziness` 设置的 `match` 查询来处理拼写错误。如果 `fuzziness` 设置为 1，则可以容忍**一处拼写错误（一个字母位置错误、遗漏或多余）**。例如，如果一个用户搜索“Komputer”，默认情况下查询不应该返回任何结果，因为“Komputer”拼写错误。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "match": {
      "synopsis": {
        "query": "Komputer",
        "fuzziness": 1
      }
    }
  }
}'
```

## 词项查询
Elasticsearch拥有一种专门的查询类型——词项级查询，用于支持查询结构化数据。数值、日期、范围、IP地址等属于结构化文本类型。Elasticsearch对待结构化数据和非结构化数据的方式有所不同：非结构化（全文）数据会被分析，而结构化字段则按原样存储。

### term 查询
`term` 查询用于精确匹配一个词项。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "term": {
      "author": "Cay S. Horstmann"
    }
  }
}'
# 或者
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "term": {
      "author": {
        "value": "Cay S. Horstmann"
      } 
    }
  }
}'
```

### terms 查询
`terms` 查询用于精确匹配多个词项。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "terms": {
      "author": ["Cay S. Horstmann", "Gary Cornell"]
    }
  }
}'
```
### range 查询
`range` 查询用于获取匹配某个范围的结果，例如获取从凌晨1:00到下午1:00之间的航班，或者找到年龄在14岁到19岁之间的青少年。    
`range` 查询是搜索范围数据的强大工具，可以应用于日期、数值和其他属性.
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "range": {
      "amazon_rating": {
        "gte": 4.5,
        "lte": 4.7
      }
    }
  }
}'
```
### exists 查询
`exists` 查询用于获取存在某个字段的结果，例如获取所有包含 `amazon_rating` 字段的文档。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "exists": {
      "field": "amazon_rating"
    }
  }
}'
```

### prefix 查询
`prefix` 查询用于获取匹配某个前缀的结果，例如获取所有以 `Core` 开头的标题。
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
{
  "query": {
    "prefix": {
      "title": "Core"
    }
  }
}'
```
### ids 查询
`ids` 查询用于获取匹配某个id的结果，例如获取所有id为 `1` 和 `2` 的文档。
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
## 复合查询

复合查询包括以下几种：  
- 布尔(bool)查询；  
- 常数分数(constant_score)查询；  
- 函数分数(function_score)查询；  
- 提升(boosting)查询；  
- 分离最大化(dis_max)查询。  

### bool 查询

`bool` 查询用于根据布尔条件组合其他查询，从而创建复杂的查询逻辑。 `bool` 查询可以使用 `must` 、 `must_not` 、 `should` 和 `filter` 这4种子句来构建搜索。
```http
GET books/_search
{
  "query": {
    "bool": {  ←---  一个bool查询是由多个
条件布尔子句组合而成的
      "must": [{ }],  ←---  查询条件必须匹配文档
      "must_not": [{ }],  ←---  查询条件必须不匹配（不影响分数）
      "should": [{ }],  ←---  查询应该匹配，
      "filter": [{ }]  ←---  查询必须匹配（不影响分数）
    }
  }
}
```

`must` 接受的是一个列表，代表列表中的条件必须同时匹配。示例：
```bash
curl -X GET "localhost:9200/my_index/_search" -H 'Content-Type: application/json' -d '
GET books/_search
{
  "query": {
    "bool": {
     # 带有两个叶子查询的must子句
      "must": [{  
          "match": {  
            # match查询查找Joshua撰写的书
            "author": "Joshua Bloch"
          }
        },
        {
          "match_phrase": {  
            # 第二个查询在字段中搜索一个短语
            "synopsis": "best Java programming books"
          }
        }]
      }
  }
}
```
`should`子句的操作类似于OR运算符。也就是说，如果搜索词与should查询匹配，相关性分数就会提高。如果搜索词不匹配，查询不会失败，但这个子句会被忽略。should子句更多是用于提高相关性分数，而不是影响结果本身。

## 聚合查询
聚合查询是一种用于对搜索结果进行分组和统计的查询方式。聚合分为3类：
- 指标聚合(metric aggregation)——如sum、min、max和avg之类的简单聚合。它们提供了一组文档数据的聚合值。  
- 桶聚合(bucket aggregation)——按天数、年龄组等间隔进行分类，将数据收集到“桶”中的聚合。这些数据有助于构建直方图、饼图和其他可视化图表。  
- 管道聚合(pipeline aggregation)——对其他聚合的输出结果进行处理的聚合。  

### 指标聚合

### 桶聚合