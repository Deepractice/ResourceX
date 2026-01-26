import type { Meta, StoryObj } from "@storybook/react";
import { FileList } from "../src/FileList";

const meta: Meta<typeof FileList> = {
  title: "Business/FileList",
  component: FileList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof FileList>;

export const Default: Story = {
  args: {
    files: [
      { name: "content", size: "2.4 KB" },
      { name: "schema.json", size: "512 B" },
      { name: "resource.json", size: "156 B" },
    ],
  },
};

export const WithTitle: Story = {
  args: {
    title: "Files",
    files: [
      { name: "content", size: "2.4 KB" },
      { name: "schema.json", size: "512 B" },
      { name: "resource.json", size: "156 B" },
    ],
  },
};

export const Clickable: Story = {
  args: {
    title: "Files",
    files: [
      { name: "content", size: "2.4 KB" },
      { name: "schema.json", size: "512 B" },
      { name: "resource.json", size: "156 B" },
    ],
    onFileClick: (file) => alert(`Clicked: ${file.name}`),
  },
};

export const SingleFile: Story = {
  args: {
    title: "Files",
    files: [{ name: "content", size: "1.2 KB" }],
  },
};

export const Localized: Story = {
  args: {
    title: "文件列表",
    files: [
      { name: "content", size: "2.4 KB" },
      { name: "schema.json", size: "512 B" },
      { name: "resource.json", size: "156 B" },
    ],
  },
};
