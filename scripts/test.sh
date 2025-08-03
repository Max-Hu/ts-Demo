#!/bin/bash

# 运行单元测试
echo "🚀 启动测试环境..."
docker-compose up -d oracle jenkins

echo "⏳ 等待服务启动..."
sleep 30

echo "🧪 运行单元测试..."
docker-compose run --rm test npm test

echo "📊 生成测试覆盖率报告..."
docker-compose run --rm test npm run test:coverage

echo "✅ 测试完成！"
echo "📁 测试覆盖率报告保存在 ./coverage 目录中" 