# 测试指南

## 通过 Docker Compose 运行单元测试

### 方法一：使用 npm 脚本（推荐）

```bash
# 1. 启动依赖服务（Oracle 和 Jenkins）
npm run test:setup

# 2. 运行简单测试（验证环境）
npm run test:docker:simple

# 3. 运行所有单元测试
npm run test:docker

# 4. 运行测试并生成覆盖率报告
npm run test:docker:coverage
```

### 方法二：使用 Docker Compose 命令

```bash
# 1. 启动依赖服务
docker-compose up -d oracle jenkins

# 2. 等待服务启动（约30秒）
sleep 30

# 3. 运行测试
docker-compose run --rm test npm test

# 4. 运行测试并生成覆盖率报告
docker-compose run --rm test npm run test:coverage
```

### 方法三：使用脚本文件

**Linux/Mac:**
```bash
chmod +x scripts/test.sh
./scripts/test.sh
```

**Windows:**
```cmd
scripts\test.bat
```

## 测试环境说明

- **测试容器**: 使用 `Dockerfile.test` 构建，包含所有开发依赖
- **数据库**: Oracle 数据库用于集成测试
- **Jenkins**: Jenkins 服务用于模拟 Jenkins API 调用
- **网络**: 所有服务在同一网络中，可以相互通信
- **覆盖率报告**: 保存在 `./coverage` 目录中

## 测试文件结构

```
src/__tests__/
├── api.test.ts          # API 路由测试
└── jenkinsService.test.ts # Jenkins 服务测试
```

## 环境变量

测试环境使用以下环境变量：

- `NODE_ENV=test`
- `API_KEY=test-api-key`
- `LOG_LEVEL=error`
- 数据库和 Jenkins 连接配置

## 清理

```bash
# 停止所有服务
docker-compose down

# 清理数据卷（可选）
docker-compose down -v
``` 