import type { Meta, StoryObj } from "@storybook/react";
import { CodeBlock } from "../src/CodeBlock";

const meta: Meta<typeof CodeBlock> = {
  title: "Business/CodeBlock",
  component: CodeBlock,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CodeBlock>;

export const Default: Story = {
  args: {
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0",
  },
};

export const WithTitle: Story = {
  args: {
    title: "Installation",
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0",
  },
};

export const NoCopy: Story = {
  args: {
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0",
    showCopy: false,
  },
};

export const LongCode: Story = {
  args: {
    title: "Install multiple packages",
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0 deepractice.ai/tools/code-reviewer@2.0.1 deepartist.tv/lang/translator-agent@1.0.0",
  },
};

export const WithCallback: Story = {
  args: {
    title: "Installation",
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0",
    onCopy: (code) => console.log("Copied:", code),
  },
};

export const Localized: Story = {
  args: {
    title: "安装",
    code: "rxr add deepractice.ai/sean/assistant-prompt@1.2.0",
    copyLabel: "复制",
    copiedLabel: "已复制!",
  },
};
