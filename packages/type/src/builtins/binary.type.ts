/**
 * Binary resource type source.
 * This file will be bundled by build.ts.
 */

export default {
  name: "binary",
  aliases: ["bin", "blob", "raw"],
  description: "Binary content",

  async resolve(ctx: any) {
    return ctx.files["content"];
  },
};
