import type { Meta, StoryObj } from "@storybook/react";
import { SearchBox } from "../src/SearchBox";

const meta: Meta<typeof SearchBox> = {
  title: "Business/SearchBox",
  component: SearchBox,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof SearchBox>;

export const Default: Story = {
  args: {
    placeholder: "Search resources...",
  },
};

export const WithShortcut: Story = {
  args: {
    placeholder: "Search resources...",
    shortcut: "⌘K",
  },
};

export const FullWidth: Story = {
  args: {
    placeholder: "Search prompts, tools, agents...",
    shortcut: "⌘K",
    className: "w-full max-w-xl",
  },
};
