# ResourceX Fixtures

测试和学习 `rx` CLI 的资源目录。

## 使用方法

```bash
# 确保 ~/bin 在 PATH 中
export PATH="$HOME/bin:$PATH"

# 进入 fixtures 目录
cd bdd/fixtures

# 添加资源
rx add ./hello-prompt

# 查看
rx list

# 执行
rx resolve hello-prompt.text@1.0.0

# 删除
rx remove hello-prompt.text@1.0.0
```

## 示例资源

| 资源           | 类型 | 描述       |
| -------------- | ---- | ---------- |
| `hello-prompt` | text | 问候提示词 |

> 初期只支持 text 类型，后续逐步扩展。
