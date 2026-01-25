/**
 * JSON resource type source.
 * This file will be bundled by build.ts.
 */

export default {
  name: "json",
  aliases: ["config", "manifest"],
  description: "JSON content",

  async resolve(ctx: any) {
    const content = ctx.files["content"];
    return JSON.parse(new TextDecoder().decode(content));
  },
};
