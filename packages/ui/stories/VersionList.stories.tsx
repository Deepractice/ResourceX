import type { Meta, StoryObj } from "@storybook/react";
import { VersionList } from "../src/VersionList";

const meta: Meta<typeof VersionList> = {
  title: "Business/VersionList",
  component: VersionList,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof VersionList>;

export const Default: Story = {
  args: {
    versions: [
      { version: "1.2.0", date: "1 hour ago", tag: "latest" },
      { version: "1.1.0", date: "3 days ago" },
      { version: "1.0.0", date: "2 weeks ago" },
    ],
  },
};

export const WithTitle: Story = {
  args: {
    title: "Versions",
    versions: [
      { version: "1.2.0", date: "1 hour ago", tag: "latest" },
      { version: "1.1.0", date: "3 days ago" },
      { version: "1.0.0", date: "2 weeks ago" },
    ],
  },
};

export const Clickable: Story = {
  args: {
    title: "Versions",
    versions: [
      { version: "1.2.0", date: "1 hour ago", tag: "latest" },
      { version: "1.1.0", date: "3 days ago" },
      { version: "1.0.0", date: "2 weeks ago" },
    ],
    onVersionClick: (v) => alert(`Clicked: v${v.version}`),
  },
};

export const ManyVersions: Story = {
  args: {
    title: "Versions",
    versions: [
      { version: "2.0.0", date: "1 hour ago", tag: "latest" },
      { version: "1.5.0", date: "1 week ago" },
      { version: "1.4.0", date: "2 weeks ago" },
      { version: "1.3.0", date: "1 month ago" },
      { version: "1.2.0", date: "2 months ago" },
      { version: "1.1.0", date: "3 months ago" },
      { version: "1.0.0", date: "6 months ago" },
    ],
  },
};

export const WithBetaTag: Story = {
  args: {
    title: "Versions",
    versions: [
      { version: "2.0.0-beta.1", date: "1 hour ago", tag: "beta" },
      { version: "1.2.0", date: "1 week ago", tag: "latest" },
      { version: "1.1.0", date: "3 days ago" },
    ],
  },
};

export const Localized: Story = {
  args: {
    title: "版本历史",
    versions: [
      { version: "1.2.0", date: "1 小时前", tag: "latest" },
      { version: "1.1.0", date: "3 天前" },
      { version: "1.0.0", date: "2 周前" },
    ],
    latestLabel: "最新",
  },
};
