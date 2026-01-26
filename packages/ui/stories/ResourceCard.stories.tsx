import type { Meta, StoryObj } from "@storybook/react";
import { ResourceCard } from "../src/ResourceCard";

const meta: Meta<typeof ResourceCard> = {
  title: "Business/ResourceCard",
  component: ResourceCard,
  tags: ["autodocs"],
  argTypes: {
    type: {
      control: "select",
      options: ["prompt", "tool", "agent", "config", "text", "json"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ResourceCard>;

export const Prompt: Story = {
  args: {
    name: "assistant-prompt",
    type: "prompt",
    author: "deepractice.ai/sean",
    version: "1.2.0",
    description: "AI assistant prompt for conversational interactions with context awareness",
    downloads: 2400,
  },
};

export const Tool: Story = {
  args: {
    name: "code-reviewer",
    type: "tool",
    author: "deepractice.ai/tools",
    version: "2.0.1",
    description: "Automated code review tool with AI-powered suggestions",
    downloads: 5100,
  },
};

export const Agent: Story = {
  args: {
    name: "translator-agent",
    type: "agent",
    author: "deepartist.tv/lang",
    version: "1.0.0",
    description: "Multi-language translation agent with context preservation",
    downloads: 890,
  },
};

export const Config: Story = {
  args: {
    name: "api-client",
    type: "config",
    author: "deepartist.tv/config",
    version: "3.1.0",
    description: "API client configuration with retry and timeout settings",
    downloads: 3200,
  },
};

export const Clickable: Story = {
  args: {
    name: "assistant-prompt",
    type: "prompt",
    author: "deepractice.ai/sean",
    version: "1.2.0",
    description: "Click me to see hover effect",
    downloads: 1500,
    onClick: () => alert("Clicked!"),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-5 max-w-4xl">
      <ResourceCard
        name="assistant-prompt"
        type="prompt"
        author="deepractice.ai/sean"
        version="1.2.0"
        description="AI assistant prompt for conversational interactions"
        downloads={2400}
      />
      <ResourceCard
        name="code-reviewer"
        type="tool"
        author="deepractice.ai/tools"
        version="2.0.1"
        description="Automated code review with AI-powered suggestions"
        downloads={5100}
      />
      <ResourceCard
        name="translator-agent"
        type="agent"
        author="deepartist.tv/lang"
        version="1.0.0"
        description="Multi-language translation agent"
        downloads={890}
      />
    </div>
  ),
};

export const Localized: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-5 max-w-2xl">
      <ResourceCard
        name="assistant-prompt"
        type="prompt"
        typeLabel="提示词"
        downloadsSuffix="次下载"
        author="deepractice.ai/sean"
        version="1.2.0"
        description="用于对话交互的 AI 助手提示词"
        downloads={2400}
      />
      <ResourceCard
        name="code-reviewer"
        type="tool"
        typeLabel="工具"
        downloadsSuffix="次下载"
        author="deepractice.ai/tools"
        version="2.0.1"
        description="AI 驱动的自动代码审查工具"
        downloads={5100}
      />
    </div>
  ),
};
