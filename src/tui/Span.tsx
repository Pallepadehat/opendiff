import type { JSX } from "solid-js";

type SpanProps = {
  fg?: string;
  bg?: string;
  children?: JSX.Element | string | number | (JSX.Element | string | number)[];
  [key: string]: any;
};

export function Span(props: SpanProps) {
  return <span {...(props as any)} />;
}
