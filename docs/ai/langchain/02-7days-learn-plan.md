---
title: "7天 LangChain 实战学习计划表"
date: 2025-12-09
tags: ["LangChain"]

---
# 7天 LangChain（JAVA） 实战学习计划表

::: warning
⚠️ 文档由 AI 生成，尚未经过人工校对。请谨慎参考，如有疑问建议进一步验证。
:::

## 核心目标

从「环境搭建」到「完整RAG场景落地」，聚焦 **企业级实用功能**（RAG、结构化输出、生态集成），避免冗余理论，每天产出可运行代码/项目。

### 前置准备

1. 工具：IDE（IntelliJ IDEA/VS Code）、Maven/Gradle（Java）、Git

2. 密钥：OpenAI API Key（或 Azure OpenAI、通义千问 API，需对应调整依赖）

3. 资料：LangChain4j 文档（https://langchain4j.dev/）

---

## 每日学习计划（按「基础→核心→实战→优化」递进）

### Day 1：环境搭建 + 核心概念落地

#### 目标

- 跑通 LangChain4j 双环境的大模型调用

- 用 10 行代码理解 LangChain 核心组件（PromptTemplate、LLM、Chain）

#### 实操任务

##### 2. LangChain4j 环境搭建（1小时）

新建 Spring Boot 项目（Java 8+），添加 Maven 依赖：

```xml

<dependencies>
    <!--openai调用-->
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-open-ai</artifactId>
            <version>1.0.0-beta3</version>
        </dependency>
    <!--智谱ai调用-->
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j-community-zhipu-ai</artifactId>
            <version>1.0.0-beta3</version>
        </dependency>
    <!-- LangChain4j 核心 -->
        <dependency>
            <groupId>dev.langchain4j</groupId>
            <artifactId>langchain4j</artifactId>
            <version>1.0.0-beta3</version>
        </dependency>
    <!-- Spring Boot 自动配置 -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter</artifactId>
    </dependency>
    <!-- Lombok 简化代码（可选，用于@Data注解） -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```
##### 3. 核心组件实战（2小时）

大模型调用 

```java
package com.example.langchainpricate;

import dev.langchain4j.model.openai.OpenAiChatModel;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class langChainPricateApplication implements CommandLineRunner {

    // 官方示例：https://docs.langchain4j.info/get-started
    // 这里使用的是官方测试的api，可以参考官方示例使用其他api
    OpenAiChatModel model = OpenAiChatModel.builder()
            .baseUrl("http://langchain4j.dev/demo/openai/v1")
            .apiKey("demo")
            .modelName("gpt-4o-mini")
            .build();

    public static void main(String[] args) {
        SpringApplication.run(langChainPricateApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        // 1. 定义 Prompt 模板（动态参数用 String.format）
        String prompt = String.format(
                "你是%s，回答尽量简单，50字以内。问题：%s",
                "Java后端开发助手",
                "Spring Boot 自动配置原理是什么？"
        );
        // 2. 调用模型并输出
        String response = model.chat(prompt);
        System.out.println("响应：" + response);
    }

}
```

--- 

### Day 2：核心功能 - Prompt 工程 + 输出结构化

#### 目标

- 掌握 Prompt 优化技巧（系统指令、参数约束）

- 实现大模型输出结构化数据（JSON/Java 实体类），适配业务开发

#### 实操任务

##### 1. Prompt 工程实战（1.5小时）

优化方向：明确角色、限定格式、补充上下文

LangChain4j 版：用 `PromptTemplate` 类优化（支持模板文件）

```java
package com.example.langchainpricate;

import dev.langchain4j.community.model.zhipu.ZhipuAiChatModel;
import dev.langchain4j.model.input.Prompt;
import dev.langchain4j.model.input.PromptTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.time.Duration;
import java.util.Map;

/**
 * 使用PromptTemplate来调用模型
 */
@SpringBootApplication
public class langChainPricateApplication implements CommandLineRunner {

    /**
     * 在application.yml中配置api-key和model-name
     */
    @Value("${langchain4j.api-key}")
    private String apiKey;

    @Value("${langchain4j.model-name}")
    private String modelName;

    public static void main(String[] args) {
        SpringApplication.run(langChainPricateApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {
        ZhipuAiChatModel chatModel = ZhipuAiChatModel
                .builder()
                .apiKey(apiKey)
                .model(modelName)
                .callTimeout(Duration.ofSeconds(60))
                .connectTimeout(Duration.ofSeconds(60))
                .writeTimeout(Duration.ofSeconds(60))
                .readTimeout(Duration.ofSeconds(60))
                .maxToken(10000)
                .build();

        // 创建模板, 注意是双括号设置模板参数
        PromptTemplate template = PromptTemplate.from("你是资深 Java 工程师，遵循 RESTful 规范，生成接口代码：\n" +
                "1. 使用 Spring Boot 注解（@RestController、@GetMapping 等）\n" +
                "2. 方法参数需加校验注解（@NotNull、@Size）\n" +
                "3. 返回统一响应体 Result<T>（包含 code、msg、data）\n" +
                "生成{{interface_type}}接口，{{business_requirement}}");

        // 应用模板生成Prompt
        Prompt apply = template.apply(Map.of(
                "interface_type", "用户查询",
                "business_requirement", "根据用户ID查询用户信息（包含id、name、age、email）"
        ));
        

        String res = chatModel.chat(apply.text());

        System.out.println("===>chat:");
        System.out.println(apply.text());
        System.out.println("===>res:");
        System.out.println(res);
    }

}

// 进阶：从资源文件加载模板（推荐，便于维护）
// PromptTemplate templateFromFile = PromptTemplate.fromResource("templates/java_interface_template.txt");
// String filePrompt = templateFromFile.apply(Map.of("interface_type", "用户查询"));
```

##### 2. 结构化输出实战（2.5小时）

需求：让大模型输出用户信息 JSON，Java 解析为实体类

LangChain4j 版（用 JsonOutputParser + Java 实体）：

```java

import dev.langchain4j.output.parser.JsonOutputParser;
import dev.langchain4j.prompt.PromptTemplate;
import java.util.Map;

// 1. 定义 Java 实体类
@lombok.Data
public class UserInfo {
    private Integer id;
    private String name;
    private Integer age;
    private String email;
}

// 2. 实战代码
public void structuredOutputDemo() {
    // 解析器
    JsonOutputParser<UserInfo> parser = JsonOutputParser.jsonOutputParser(UserInfo.class);
    // Prompt 模板（包含格式说明）
    PromptTemplate promptTemplate = PromptTemplate.from(
        "按以下格式输出JSON：{format_instructions}\n提取用户信息：ID是1001，姓名张三，邮箱zhangsan@xxx.com"
    );
    String prompt = promptTemplate.apply(Map.of(
        "format_instructions", parser.getFormatInstructions()
    ));
    // 调用模型 + 解析
    String response = chatLanguageModel.generate(prompt);
    UserInfo userInfo = parser.parse(response);
    System.out.println(userInfo.getName()); // 结构化数据
}
```

##### 3. 总结

结构化输出是业务开发的关键，核心是「Prompt 约束格式 + 解析器转换」。

---

### Day 3：核心功能 - RAG 基础（文档加载 + 文本拆分）

#### 目标

- 掌握 RAG 核心流程（加载→拆分→向量存储→检索→生成）

- 实现本地文档（TXT/PDF）加载与拆分，为后续向量存储做准备

#### 实操任务

##### 1. RAG 原理快速理解（30分钟）

- 核心逻辑：让大模型基于「私有文档」回答，而非仅靠训练数据

- 流程拆解：文档加载 → 文本拆分 → 向量生成 → 向量存储 → 检索相关片段 → 拼接 Prompt → 大模型生成

##### 2. 文档加载实战（1.5小时）

支持格式：TXT、PDF（需额外依赖）

Python 版（加载 PDF）：

```bash

# 安装 PDF 依赖
pip install pypdf langchain-community
```

```python

from langchain_community.document_loaders import PyPDFLoader

# 加载本地 PDF（支持多页）
loader = PyPDFLoader("企业知识库.pdf")
documents = loader.load()  # 返回 List[Document]，每个元素是一页内容
print(f"加载页数：{len(documents)}")
print(f"第一页内容：{documents[0].page_content[:200]}")
```

LangChain4j 版（加载 TXT/PDF）：

```xml

<!-- 引入 PDF 加载依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-document-loader-pdf</artifactId>
    <version>0.34.0</version>
</dependency>
<!-- 引入文件系统加载依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-document-loader-filesystem</artifactId>
    <version>0.34.0</version>
</dependency>
```

```java

import dev.langchain4j.document.Document;
import dev.langchain4j.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.document.loader.pdf.PdfDocumentLoader;
import java.util.List;

// 加载 PDF
List<Document> documents = PdfDocumentLoader.load("企业知识库.pdf");
// 加载 TXT
List<Document> txtDocs = FileSystemDocumentLoader.load("本地文档.txt");
```

##### 3. 文本拆分实战（2小时）

为什么拆分？大模型有上下文窗口限制（如 gpt-3.5-turbo 是 4k tokens），长文本需拆分后存储

Python 版（用 CharacterTextSplitter）：

```python

from langchain_text_splitters import CharacterTextSplitter

# 配置拆分参数（chunk_size：每个片段长度，chunk_overlap：片段重叠度）
text_splitter = CharacterTextSplitter(
    chunk_size=300,  # 每个片段 300 字符
    chunk_overlap=30,  # 相邻片段重叠 30 字符（保证上下文连贯）
    separator="\n"  # 按换行符拆分
)
# 拆分文档
split_docs = text_splitter.split_documents(documents)
print(f"拆分后片段数：{len(split_docs)}")
print(f"第一个片段：{split_docs[0].page_content}")
```

LangChain4j 版（用 RecursiveCharacterTextSplitter）：

```java

import dev.langchain4j.data.document.splitter.DocumentSplitters;

// 拆分文档
List<Document> splitDocs = DocumentSplitters.recursive(300, 30).splitAll(documents);
```

##### 4. 总结

文本拆分的关键参数（chunk_size、overlap）需根据文档类型调整，重叠度避免上下文丢失。

---

### Day 4：核心功能 - RAG 进阶（向量存储 + 检索问答）

#### 目标

- 实现向量生成与存储（用轻量向量库 Chroma）

- 搭建完整 RAG 链路：提问 → 检索相关文档片段 → 大模型生成基于文档的回答

#### 实操任务

##### 1. 向量存储实战（2小时）

原理：将文本片段转为向量（Embeddings），存储到向量库，后续通过「向量相似度」检索相关片段

Python 版（OpenAI Embeddings + Chroma）：

```bash

# 安装向量库依赖
pip install chromadb langchain-openai
```

```python

from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma

# 1. 初始化 Embeddings（将文本转为向量）
embeddings = OpenAIEmbeddings()
# 2. 构建向量库（将拆分后的文档片段存入 Chroma）
vector_db = Chroma.from_documents(
    documents=split_docs,  # 拆分后的文档片段
    embedding=embeddings,  # 向量生成器
    persist_directory="./chroma_db"  # 向量库存储路径（本地文件）
)
vector_db.persist()  # 持久化到本地
```

LangChain4j 版（OpenAiEmbeddings + Chroma）：

```xml

<!-- 引入 Chroma 向量库依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-vector-store-chroma</artifactId>
    <version>0.34.0</version>
</dependency>
<!-- 引入 Embeddings 核心依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embedding</artifactId>
    <version>0.34.0</version>
</dependency>
```

```java

import dev.langchain4j.embedding.openai.OpenAiEmbeddings;
import dev.langchain4j.vectorstore.ChromaVectorStore;

// 1. 初始化 Embeddings
OpenAiEmbeddings embeddings = OpenAiEmbeddings.builder()
        .apiKey("你的密钥")
        .modelName("text-embedding-3-small")
        .build();
// 2. 构建 Chroma 向量库
ChromaVectorStore vectorStore = ChromaVectorStore.builder()
        .embeddingModel(embeddings)
        .persistDirectory("./chroma_db_java")
        .build();
// 3. 存入文档片段
vectorStore.add(splitDocs);
```

##### 2. RAG 完整链路实战（2小时）

需求：提问“企业知识库中提到的 Java 代码规范有哪些？”，大模型基于向量库检索的片段回答

Python 版（构建 RetrievalQA Chain）：

```python

from langchain.chains import RetrievalQA

# 1. 从向量库构建检索器（返回相似度最高的 3 个片段）
retriever = vector_db.as_retriever(search_kwargs={"k": 3})
# 2. 构建 RAG Chain（LLM + 检索器）
rag_chain = RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",  # 将所有检索到的片段拼接进 Prompt
    retriever=retriever,
    return_source_documents=True  # 返回检索到的原始片段（方便调试）
)
# 3. 执行提问
result = rag_chain.invoke({"query": "企业知识库中提到的 Java 代码规范有哪些？"})
# 输出结果
print("回答：", result["result"])
print("\n检索到的相关片段：")
for doc in result["source_documents"]:
    print(f"- {doc.page_content[:100]}...")
```

LangChain4j 版（构建 RetrievalAugmentor）：

```java

import dev.langchain4j.retrieval.RetrievalAugmentor;
import dev.langchain4j.retrieval.RetrievalResult;

// 1. 构建检索增强器
RetrievalAugmentor augmentor = RetrievalAugmentor.builder()
        .vectorStore(vectorStore)
        .maxResults(3)  // 最多返回 3 个相关片段
        .build();
// 2. 检索相关片段
String query = "企业知识库中提到的 Java 代码规范有哪些？";
RetrievalResult retrievalResult = augmentor.augment(query);
// 3. 拼接 Prompt + 调用大模型
String prompt = String.format(
    "基于以下文档片段回答问题，不要编造信息：\n%s\n问题：%s",
    retrievalResult.content(),
    query
);
String response = chatLanguageModel.generate(prompt);
System.out.println("回答：" + response);
```

##### 3. 总结

RAG 回答的准确性取决于「检索到的片段质量」，后续可优化检索策略（如调整 k 值、用更优的文本拆分方式）。

---

### Day 5：生态集成 - 对接数据库 + 缓存优化

#### 目标

- 实现 RAG 对接 MySQL（存储文档元数据）

- 加入缓存优化（避免重复调用大模型/向量库）

#### 实操任务

##### 1. 对接 MySQL 存储文档元数据（2小时）

需求：将文档的文件名、页数、上传时间等元数据存入 MySQL，方便管理

Python 版（用 SQLAlchemy 操作 MySQL）：

```bash

pip install sqlalchemy pymysql
```

```python

from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# 1. 定义数据库模型
Base = declarative_base()
class DocumentMeta(Base):
    __tablename__ = "document_meta"
    id = Column(Integer, primary_key=True, autoincrement=True)
    filename = Column(String(255), nullable=False)
    page_count = Column(Integer)
    upload_time = Column(DateTime, default=datetime.now)
    vector_db_id = Column(String(255))  # 关联向量库中的文档ID

# 2. 连接 MySQL
engine = create_engine("mysql+pymysql://root:密码@localhost:3306/langchain_db")
Base.metadata.create_all(engine)  # 创建表
Session = sessionmaker(bind=engine)
session = Session()

# 3. 插入元数据
meta = DocumentMeta(
    filename="企业知识库.pdf",
    page_count=len(documents),
    vector_db_id="pdf_20240520"
)
session.add(meta)
session.commit()
```

LangChain4j 版（用 Spring Data JPA 操作 MySQL）：

- 配置 `application.yml` 数据库连接

- 定义 `DocumentMeta` 实体类和 `DocumentMetaRepository` 接口，直接调用 `save()` 方法存储

##### 2. 缓存优化实战（2小时）

优化场景：相同问题重复提问时，直接返回缓存结果，避免重复检索和大模型调用

Python 版（用 `cachetools` 实现内存缓存）：

```bash

pip install cachetools
```

```python

from cachetools import TTLCache

# 初始化缓存（最大缓存 100 条，过期时间 30 分钟）
cache = TTLCache(maxsize=100, ttl=1800)

def rag_with_cache(query):
    # 先查缓存
    if query in cache:
        print("从缓存获取结果...")
        return cache[query]
    # 缓存未命中，执行 RAG
    result = rag_chain.invoke({"query": query})
    # 存入缓存
    cache[query] = result["result"]
    return result["result"]

# 测试：第一次走 RAG，第二次走缓存
print(rag_with_cache("企业知识库中提到的 Java 代码规范有哪些？"))
print(rag_with_cache("企业知识库中提到的 Java 代码规范有哪些？"))
```

LangChain4j 版（用 Spring Cache + Redis）：

- 引入 `spring-boot-starter-cache` 和 `spring-boot-starter-data-redis` 依赖

- 配置 Redis 连接信息（application.yml）

- 在启动类添加 `@EnableCaching` 注解开启缓存功能

- 在 RAG 方法上添加 `@Cacheable(value = "ragCache", key = "#query")` 注解，自动缓存结果

##### 3. 总结

企业级应用需兼顾「数据管理」和「性能优化」，数据库存储元数据、缓存减少重复开销是必备手段。

---

### Day 6：实战项目 - 企业知识库问答机器人（MVP）

#### 目标

- 整合前 5 天所学，落地完整 MVP 项目

- 功能：上传 PDF/TXT → 自动加载拆分 → 向量存储 → 提问回答 → 缓存优化

#### 实操任务（4-5小时）

##### 1. 项目架构设计（30分钟）

选择技术栈：

- Python 版：FastAPI（提供接口）+ LangChain + Chroma + MySQL + 缓存

- LangChain4j 版：Spring Boot（提供接口）+ LangChain4j + Chroma + MySQL + Redis

核心接口：

- 文档上传接口：接收文件，存储到本地，同步元数据到 MySQL

- 文档处理接口：加载上传的文件，拆分后存入向量库

- 问答接口：接收提问，走 RAG+缓存，返回回答

##### 2. 核心代码实现（3小时）

以 LangChain4j + Spring Boot 为例：

文档上传接口（用 `MultipartFile` 接收文件），需先定义统一响应体 `Result` 类：

```java

import lombok.Data;

// 统一响应体类
@Data
public class Result<T> {
    private Integer code;  // 响应码：200成功，500失败，其他自定义
    private String msg;    // 响应信息
    private T data;        // 响应数据

    // 成功响应（带数据）
    public static <T> Result<T> success(T data) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg("操作成功");
        result.setData(data);
        return result;
    }

    // 成功响应（无数据）
    public static <T> Result<T> success(String msg) {
        Result<T> result = new Result<>();
        result.setCode(200);
        result.setMsg(msg);
        return result;
    }

    // 失败响应
    public static <T> Result<T> fail(String msg) {
        Result<T> result = new Result<>();
        result.setCode(500);
        result.setMsg(msg);
        return result;
    }
}
```

```java

import dev.langchain4j.document.Document;
import dev.langchain4j.document.loader.FileSystemDocumentLoader;
import dev.langchain4j.document.loader.pdf.PdfDocumentLoader;
import dev.langchain4j.data.document.splitter.DocumentSplitters;
import dev.langchain4j.vectorstore.ChromaVectorStore;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@RestController
public class DocumentController {

    private final ChromaVectorStore vectorStore;
    private final DocumentMetaRepository documentMetaRepository;

    // 构造函数注入依赖
    public DocumentController(ChromaVectorStore vectorStore, DocumentMetaRepository documentMetaRepository) {
        this.vectorStore = vectorStore;
        this.documentMetaRepository = documentMetaRepository;
    }

    @PostMapping("/upload")
    public Result<String> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            // 1. 校验文件
            if (file.isEmpty()) {
                return Result.fail("上传文件不能为空");
            }
            String filename = file.getOriginalFilename();
            if (!filename.endsWith(".pdf") && !filename.endsWith(".txt")) {
                return Result.fail("仅支持PDF和TXT格式文件");
            }

            // 2. 确保上传目录存在
            String uploadDir = "./uploads/";
            Files.createDirectories(Paths.get(uploadDir));
            String filePath = uploadDir + filename;

            // 3. 保存文件到本地
            Files.write(Paths.get(filePath), file.getBytes());

            // 4. 解析文档（PDF/TXT）
            List<Document> documents;
            if (filename.endsWith(".pdf")) {
                documents = PdfDocumentLoader.load(filePath);
            } else {
                documents = FileSystemDocumentLoader.load(filePath);
            }

            // 5. 拆分文档
            List<Document> splitDocs = DocumentSplitters.recursive(300, 30).splitAll(documents);

            // 6. 存入向量库，并生成唯一标识关联
            String vectorDbId = "doc_" + UUID.randomUUID().toString().replace("-", "");
            // 为每个文档片段添加元数据，便于后续追溯
            for (Document doc : splitDocs) {
                doc.metadata().put("vectorDbId", vectorDbId);
                doc.metadata().put("filename", filename);
            }
            vectorStore.add(splitDocs);

            // 7. 存入 MySQL 元数据
            DocumentMeta meta = new DocumentMeta();
            meta.setFilename(filename);
            meta.setPageCount(documents.size());
            meta.setVectorDbId(vectorDbId);
            documentMetaRepository.save(meta);

            return Result.success("文件上传处理成功，文档ID：" + vectorDbId);
        } catch (Exception e) {
            e.printStackTrace();
            return Result.fail("文件处理失败：" + e.getMessage());
        }
    }
}
```

```java

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Paths;

@RestController
public class DocumentController {

    private final ChromaVectorStore vectorStore;
    private final DocumentMetaRepository documentMetaRepository;

    // 构造函数注入依赖
    public DocumentController(ChromaVectorStore vectorStore, DocumentMetaRepository documentMetaRepository) {
        this.vectorStore = vectorStore;
        this.documentMetaRepository = documentMetaRepository;
    }

    @PostMapping("/upload")
    public Result<String> uploadFile(@RequestParam("file") MultipartFile file) throws Exception {
        // 1. 保存文件到本地
        String filePath = "./uploads/" + file.getOriginalFilename();
        Files.write(Paths.get(filePath), file.getBytes());
        // 2. 解析文档（PDF/TXT）
        List<Document> documents = file.getOriginalFilename().endsWith(".pdf")
                ? PdfDocumentLoader.load(filePath)
                : FileSystemDocumentLoader.load(filePath);
        // 3. 拆分文档
        List<Document> splitDocs = DocumentSplitters.recursive(300, 30).splitAll(documents);
        // 4. 存入向量库
        vectorStore.add(splitDocs);
        // 5. 存入 MySQL 元数据
        DocumentMeta meta = new DocumentMeta();
        meta.setFilename(file.getOriginalFilename());
        meta.setPageCount(documents.size());
        documentMetaRepository.save(meta);
        return Result.success("文件上传处理成功");
    }
}
```

问答接口（带缓存）：

```java

import org.springframework.cache.annotation.Cacheable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class QaController {

    private final ChatLanguageModel chatLanguageModel;
    private final RetrievalAugmentor augmentor;

    public QaController(ChatLanguageModel chatLanguageModel, RetrievalAugmentor augmentor) {
        this.chatLanguageModel = chatLanguageModel;
        this.augmentor = augmentor;
    }

    @GetMapping("/qa")
    @Cacheable(value = "ragCache", key = "#query")
    public Result<String> qa(@RequestParam String query) {
        // 1. 检索相关片段
        RetrievalResult retrievalResult = augmentor.augment(query);
        // 2. 拼接 Prompt
        String prompt = String.format(
            "基于以下文档片段回答问题，不要编造信息，回答简洁：\n%s\n问题：%s",
            retrievalResult.content(),
            query
        );
        // 3. 调用大模型
        String response = chatLanguageModel.generate(prompt);
        return Result.success(response);
    }
}
```

##### 3. 测试验证（1小时）

用 Postman 测试接口：

1. 上传 `企业知识库.pdf`，验证 MySQL 中是否新增元数据，Chroma 向量库是否生成

2. 调用 `/qa` 接口提问，验证回答是否基于文档，重复提问是否走缓存

修复问题：如 PDF 加载失败（检查依赖）、回答不准确（调整拆分参数/k值）

##### 4. 总结

MVP 项目的核心是「流程跑通」，无需过度设计，后续可扩展功能（如文档删除、权限控制）。

---

### Day 7：优化与进阶 - 性能调优 + 开源模型适配

#### 目标

- 优化 RAG 回答准确性和性能

- 适配开源大模型（如 Llama 3），降低 API 成本

#### 实操任务

##### 1. RAG 优化实战（2小时）

优化方向 1：文本拆分（用 `RecursiveCharacterTextSplitter` 替代基础拆分，支持按标点/段落拆分）

```python

from langchain_text_splitters import RecursiveCharacterTextSplitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=500,
    chunk_overlap=50,
    separators=["\n\n", "\n", ". ", " ", ""]  # 优先级拆分
)
```

优化方向 2：检索策略（用 `similarity_score_threshold` 过滤低相似度片段）

```python

retriever = vector_db.as_retriever(
    search_kwargs={"k": 3, "score_threshold": 0.7}  # 相似度阈值 0.7
)
```

优化方向 3：Prompt 优化（明确“仅用文档片段回答，无相关信息则回复‘无相关答案’”）

##### 2. 开源模型适配（2小时）

需求：用本地部署的 Llama 3 替代 OpenAI，降低 API 调用成本

前置：用 Ollama 快速部署 Llama 3（https://ollama.com/），执行 `ollama run llama3` 启动本地模型

Python 版（对接本地 Llama 3）：

```bash

pip install langchain-community
```

```python

from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings

# 1. 初始化本地 LLM（Llama 3）
local_llm = ChatOllama(model="llama3", temperature=0.7)
# 2. 初始化本地 Embeddings
local_embeddings = OllamaEmbeddings(model="llama3")
# 3. 替换之前的 OpenAI 组件，重新构建 RAG Chain
vector_db = Chroma.from_documents(split_docs, local_embeddings, persist_directory="./chroma_db_local")
rag_chain = RetrievalQA.from_chain_type(llm=local_llm, retriever=vector_db.as_retriever())
```

LangChain4j 版（对接本地 Llama 3）：

```xml

<!-- 引入 Ollama 集成依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-ollama</artifactId>
    <version>0.34.0</version>
</dependency>
<!-- 若需使用本地模型的 Embeddings，确保引入核心 Embedding 依赖 -->
<dependency>
    <groupId>dev.langchain4j</groupId>
    <artifactId>langchain4j-embedding</artifactId>
    <version>0.34.0</version>
</dependency>
```

```java

import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.embedding.ollama.OllamaEmbeddings;

// 初始化本地 LLM
OllamaChatModel localLlm = OllamaChatModel.builder()
        .modelName("llama3")
        .baseUrl("http://localhost:11434")  // Ollama 默认端口
        .build();
// 初始化本地 Embeddings
OllamaEmbeddings localEmbeddings = OllamaEmbeddings.builder()
        .modelName("llama3")
        .baseUrl("http://localhost:11434")
        .build();
```

##### 3. 项目部署准备（1小时）

打包：Python 用 `pyinstaller` 打包成可执行文件，Java 用 Maven 打包成 Jar 包

容器化：编写 Dockerfile，将项目、向量库、依赖打包成 Docker 镜像

```dockerfile

# Java 项目 Dockerfile 示例
FROM openjdk:11-jre-slim
COPY target/langchain4j-demo-0.0.1-SNAPSHOT.jar app.jar
COPY chroma_db_java /chroma_db_java
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app.jar"]
```

##### 4. 总结与后续规划

回顾 7 天所学：环境搭建 → 核心功能 → 生态集成 → 项目落地 → 优化进阶

后续进阶方向：

1. 向量库升级：用 Milvus/Elasticsearch 替代 Chroma，支持大规模数据

2. Agent 功能：添加工具（如数据库查询、计算器），让机器人自主决策

3. 前端可视化：用 Vue/React 实现文件上传、问答界面

4. 监控告警：集成 Prometheus + Grafana，监控大模型调用耗时、缓存命中率

---

## 关键资源汇总

1. 官方示例：LangChain 官网 `examples` 目录（https://github.com/langchain-ai/langchain/tree/master/examples）

2. LangChain4j 示例：https://github.com/langchain4j/langchain4j/tree/main/examples

3. 向量库文档：Chroma（https://docs.trychroma.com/）、Milvus（https://milvus.io/docs/）

4. 开源模型：Ollama（快速部署 Llama 3/Phi-3）、Hugging Face（模型下载）

按此计划学习，7 天后可具备 LangChain 企业级实战能力，能独立落地 RAG 类项目，并理解核心优化思路！
> （注：文档部分内容可能由 AI 生成）