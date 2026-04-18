# Resend Client - 邮箱客户端

一个基于 Wails 构建的现代化邮箱客户端，使用 Resend API 发送邮件。

## 功能特性

- 📧 **邮件发送**: 支持 HTML 和纯文本邮件
- 📝 **发送历史**: 自动记录所有发送的邮件
- 🔐 **安全存储**: API Key 使用 AES-256 加密存储在本地
- 🎨 **现代化界面**: 简洁美观的深色主题界面
- 💾 **本地数据**: 所有数据存储在本地，保护隐私

## 开始使用

### 前置要求

- Go 1.18+
- Node.js 16+
- pnpm
- Wails CLI (`go install github.com/wailsapp/wails/v2/cmd/wails@latest`)

### 安装依赖

```bash
# 安装前端依赖
cd frontend
pnpm install
cd ..
```

### 开发模式

```bash
wails dev
```

### 构建应用

```bash
wails build
```

## 配置 Resend

1. 访问 [resend.com](https://resend.com) 注册账号
2. 在控制台创建 API Key
3. 验证你的发件域名
4. 在应用的「设置」页面配置 API Key

## 使用说明

### 发送邮件

1. 在「撰写邮件」页面填写邮件信息
2. 发件人地址必须是你在 Resend 验证过的域名
3. 收件人可以填写多个，用逗号分隔
4. 可以同时填写 HTML 和纯文本内容
5. 点击「发送邮件」按钮

### 查看历史

- 在「发送历史」页面查看所有已发送的邮件
- 显示发件人、收件人、主题、发送时间等信息
- 可以清除所有历史记录

### 数据存储

- 配置文件存储在: `~/.resend-client/config.enc`
- 所有数据使用 AES-256-GCM 加密
- 最多保存最近 100 条发送记录

## 技术栈

- **后端**: Go + Wails
- **前端**: React + TypeScript + Vite
- **UI**: 自定义 CSS (深色主题)
- **图标**: Lucide React
- **加密**: AES-256-GCM

## 许可证

MIT
