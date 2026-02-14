import { z } from "zod";
import { Block, CodeBlock } from "codehike/blocks";
import { RawCode } from "codehike/code";
import { toCodeGroup } from "./code";
import { WalkClient } from "./walk.client";
import { WithNotes } from "./notes";

const Schema = Block.extend({
  code: z.array(CodeBlock),
  flags: z.string().optional(),
  filename: z.string().optional(),
});

type ParsedProps = z.infer<typeof Schema>;
const DIFF_ANNOTATION_PATTERN = /!diff(?:\b|[\[(])/;

export async function Walk(props: unknown) {
  const { code, flags, filename, ...rest } = props as ParsedProps;
  const codeblocks = code;
  const forceDiffGutter = codeblocks.some((codeblock: RawCode) =>
    DIFF_ANNOTATION_PATTERN.test(codeblock.value),
  );
  const flagsWithAnimation = flags?.includes("a") ? flags : `${flags ?? ""}a`;

  const group = await toCodeGroup({
    codeblocks,
    flags: flagsWithAnimation,
    forceDiffGutter,
    filename,
  });

  return (
    <WithNotes {...rest}>
      <WalkClient group={group} />
    </WithNotes>
  );
}
