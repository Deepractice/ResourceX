import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumb } from "../src/Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "Business/Breadcrumb",
  component: Breadcrumb,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const Default: Story = {
  args: {
    items: [
      { label: "Browse" },
      { label: "Prompts" },
      { label: "assistant-prompt", current: true },
    ],
  },
};

export const TwoLevels: Story = {
  args: {
    items: [{ label: "Home" }, { label: "Resources", current: true }],
  },
};

export const WithCallback: Story = {
  args: {
    items: [
      { label: "Browse", href: "/" },
      { label: "Prompts", href: "/prompts" },
      { label: "assistant-prompt", current: true },
    ],
    onItemClick: (item) => alert(`Clicked: ${item.label}`),
  },
};

export const CustomSeparator: Story = {
  args: {
    items: [
      { label: "Browse" },
      { label: "Prompts" },
      { label: "assistant-prompt", current: true },
    ],
    separator: ">",
  },
};

export const Localized: Story = {
  args: {
    items: [{ label: "浏览" }, { label: "提示词" }, { label: "assistant-prompt", current: true }],
  },
};
