import type { Meta, StoryObj } from "@storybook/react";
import { Logo } from "../src/Logo";

const meta: Meta<typeof Logo> = {
  title: "Business/Logo",
  component: Logo,
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Logo>;

export const Default: Story = {
  args: {},
};

export const Small: Story = {
  args: {
    size: "sm",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
  },
};

export const IconOnly: Story = {
  args: {
    iconOnly: true,
  },
};

export const CustomText: Story = {
  args: {
    text: "resourcex",
    iconLetter: "R",
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Logo size="sm" />
      <Logo size="md" />
      <Logo size="lg" />
    </div>
  ),
};
