import { Children, isValidElement, type ReactNode } from "react";
import type { Components } from "react-markdown";

import CourseAdmonition from "./CourseAdmonition";
import CourseAnimatedBlock from "./CourseAnimatedBlock";
import FlowDiagram from "./flow-diagram";
import Columns from "./columns";
import Column from "./column";
import { courseAdmonitionTypes, type CourseAdmonitionType } from "./course-admonition-config";
import { courseAnimationTypes, type CourseAnimationType } from "@/lib/course-markdown/markdown-transforms";

const admonitionTypeSet = new Set<string>(courseAdmonitionTypes);
const animationTypeSet = new Set<string>(courseAnimationTypes);

function getCodeLanguage(className: string | undefined) {
  return className?.split(" ").find((name) => name.startsWith("language-"))?.slice("language-".length) ?? null;
}

function getCodeText(children: ReactNode) {
  return Children.toArray(children).map((child) => typeof child === "string" || typeof child === "number" ? String(child) : "").join("").replace(/\n$/, "");
}

function getColumnsRatio(className: string | undefined) {
  const ratioClass = className?.split(" ").find((name) => /^course-columns-ratio-\d{1,3}-\d{1,3}$/.test(name));
  const match = ratioClass?.match(/^course-columns-ratio-(\d{1,3})-(\d{1,3})$/);
  return match ? `${match[1]}/${match[2]}` : null;
}

function getClassType(className: string | undefined, prefix: string) {
  return className?.split(" ").find((name) => name.startsWith(prefix))?.slice(prefix.length) ?? null;
}

const colorTextClasses: Record<string, string> = {
  "course-text-red": "font-semibold text-red-600",
  "course-text-green": "font-semibold text-emerald-600",
  "course-text-yellow": "font-semibold text-amber-600",
  "course-text-blue": "font-semibold text-blue-600",
  "course-text-purple": "font-semibold text-purple-600",
};

export const courseMarkdownComponents: Components = {
  h1({ children }) {
    return <h1 className="mb-5 mt-2 text-2xl font-bold leading-tight text-[var(--text)] sm:text-3xl lg:text-4xl">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-4 mt-9 border-l-4 border-[var(--primary)] pl-3 text-xl font-semibold leading-tight text-[var(--text)] sm:text-2xl">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-3 mt-7 text-lg font-semibold text-[var(--text)] sm:text-xl">{children}</h3>;
  },
  p({ node, children }) {
    const containsImage = node?.children.some((child) => child.type === "element" && child.tagName === "img");

    if (containsImage) {
      return <div className="my-4">{children}</div>;
    }

    return <p className="my-4 text-[15px] leading-8 text-[var(--text-soft)] sm:text-base">{children}</p>;
  },
  ul({ children, className }) {
    return <ul className={`my-5 space-y-2 pl-6 text-[var(--text-soft)] marker:text-[var(--primary)] ${className ?? "list-disc"}`}>{children}</ul>;
  },
  ol({ children }) {
    return <ol className="my-5 list-decimal space-y-2 pl-6 text-[var(--text-soft)] marker:font-semibold marker:text-[var(--primary)]">{children}</ol>;
  },
  li({ children }) {
    return <li className="pl-1 leading-7">{children}</li>;
  },
  blockquote({ children }) {
    return <blockquote className="my-6 rounded-[var(--radius-md)] border-l-4 border-[var(--primary)] bg-[var(--bg-soft)] px-5 py-3 text-[var(--text-soft)] shadow-[var(--shadow-sm)]">{children}</blockquote>;
  },
  table({ children }) {
    return <div className="my-6 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]"><table className="min-w-full border-collapse text-left text-sm">{children}</table></div>;
  },
  thead({ children }) {
    return <thead className="bg-[var(--bg-soft)] text-[var(--text)]">{children}</thead>;
  },
  th({ children }) {
    return <th className="border-b border-[var(--border)] px-4 py-3 font-semibold">{children}</th>;
  },
  td({ children }) {
    return <td className="border-b border-[var(--border)] px-4 py-3 leading-6 text-[var(--text-soft)] last:border-b-0">{children}</td>;
  },
  hr() {
    return <div className="my-9 flex items-center gap-3" aria-hidden="true"><span className="h-px flex-1 bg-[var(--border)]" /><span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)]" /><span className="h-px flex-1 bg-[var(--border)]" /></div>;
  },
  a({ href, children }) {
    const external = href?.startsWith("http");
    return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="font-semibold text-[var(--primary)] underline decoration-[var(--primary)]/35 underline-offset-4 transition hover:decoration-[var(--primary)]">{children}</a>;
  },
  code({ className, children }) {
    if (getCodeLanguage(className) === "flow") return <FlowDiagram code={getCodeText(children)} />;

    return <code className={className ? `${className} text-sm` : "rounded bg-[var(--bg-soft)] px-1.5 py-0.5 text-[0.9em] font-semibold text-[var(--primary)]"}>{children}</code>;
  },
  pre({ children }) {
    const child = Children.toArray(children)[0];

    if (isValidElement<{ className?: string; children?: ReactNode }>(child) && getCodeLanguage(child.props.className) === "flow") {
      return <FlowDiagram code={getCodeText(child.props.children)} />;
    }

    return <pre className="my-6 overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)] shadow-[var(--shadow-sm)] [&>code]:bg-transparent [&>code]:p-0 [&>code]:text-inherit">{children}</pre>;
  },
  img({ src, alt, title }) {
    return (
      <figure className="my-7">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} className="w-full rounded-[var(--radius-md)] border border-[var(--border)] object-cover shadow-[var(--shadow-md)]" />
        {title ? <figcaption className="mt-2 text-center text-xs text-[var(--text-faint)]">{title}</figcaption> : null}
      </figure>
    );
  },
  input({ checked, type }) {
    return <input type={type} checked={checked} readOnly className="mr-2 h-4 w-4 rounded border-[var(--border)] accent-[var(--primary)]" />;
  },
  mark({ className, children }) {
    return className === "course-highlight" ? <mark className="rounded bg-yellow-300/45 px-1 py-0.5 text-inherit box-decoration-clone">{children}</mark> : <mark className={className}>{children}</mark>;
  },
  span({ className, children }) {
    if (className === "course-inline-badge") {
      return <span className="mx-1 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-xs font-semibold text-[var(--text)] align-middle">{children}</span>;
    }

    return <span className={className ? colorTextClasses[className] ?? className : undefined}>{children}</span>;
  },
  aside({ className, children }) {
    const type = getClassType(className, "course-admonition-");

    if (type && admonitionTypeSet.has(type)) {
      return <CourseAdmonition type={type as CourseAdmonitionType}>{children}</CourseAdmonition>;
    }

    return <aside className={className}>{children}</aside>;
  },
  div({ className, children }) {
    if (className?.split(" ").includes("course-columns")) return <Columns ratio={getColumnsRatio(className)}>{children}</Columns>;
    if (className?.split(" ").includes("course-column")) return <Column>{children}</Column>;

    const animation = getClassType(className, "course-animation-");
    const admonition = getClassType(className, "course-admonition-");

    if (animation && animationTypeSet.has(animation)) {
      const content = admonition && admonitionTypeSet.has(admonition) ? <CourseAdmonition type={admonition as CourseAdmonitionType}>{children}</CourseAdmonition> : children;
      return <CourseAnimatedBlock animation={animation as CourseAnimationType}>{content}</CourseAnimatedBlock>;
    }

    return <div className={className}>{children}</div>;
  },
};
