/**
 * Text resource type source.
 * This file will be bundled by build.ts.
 */

export default {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",

  async resolve(ctx: any) {
    const content = ctx.files["content"];
    return new TextDecoder().decode(content);
  },
};
