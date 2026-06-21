export type MainTab =
  | "speaking"
  | "writing"
  | "reading"
  | "listening";

export type SpeakingSubTab =
  | "ra"
  | "rs"
  | "di"
  | "rl"
  | "asq"
  | "rts"
  | "sgd";

export type WritingSubTab =
  | "essay"
  | "swt";

export type ReadingSubTab =
  | "rfib"
  | "fibrw"
  | "rmcsa"
  | "rmcma"
  | "ro";

export type ListeningSubTab =
  | "sst"
  | "mcsa"
  | "mcma"
  | "fib_l"
  | "smw"
  | "hiw"
  | "hcs"
  | "wfd";

export type PTESubTab =
  | SpeakingSubTab
  | WritingSubTab
  | ReadingSubTab
  | ListeningSubTab;

export const pteMainTabs = [
  {
    key: "speaking",
    label: "Speaking",
    href: "/pte/speaking",
  },
  {
    key: "writing",
    label: "Writing",
    href: "/pte/writing",
  },
  {
    key: "reading",
    label: "Reading",
    href: "/pte/reading",
  },
  {
    key: "listening",
    label: "Listening",
    href: "/pte/listening",
  },
] as const;

export const pteSubTabMap: Record<
  MainTab,
  {
    key: PTESubTab;
    label: string;
    href: string;
  }[]
> = {
  speaking: [
    { key: "ra", label: "RA", href: "/pte/speaking/ra" },
    { key: "rs", label: "RS", href: "/pte/speaking/rs" },
    { key: "di", label: "DI", href: "/pte/speaking/di" },
    { key: "rl", label: "RL", href: "/pte/speaking/rl" },
    { key: "asq", label: "ASQ", href: "/pte/speaking/asq" },
    { key: "rts", label: "RTS", href: "/pte/speaking/rts" },
    { key: "sgd", label: "SGD", href: "/pte/speaking/sgd" },
  ],

  writing: [
    { key: "swt", label: "SWT", href: "/pte/writing/swt" },
    { key: "essay", label: "Essay", href: "/pte/writing/essay" },
  ],

  reading: [
    { key: "rfib", label: "FIBR", href: "/pte/reading/fibr" },
    { key: "fibrw", label: "FIBRW", href: "/pte/reading/fibrw" },
    { key: "rmcsa", label: "RMCSA", href: "/pte/reading/rmcsa" },
    { key: "rmcma", label: "RMCMA", href: "/pte/reading/rmcma" },
    { key: "ro", label: "RO", href: "/pte/reading/ro" },
  ],

  listening: [
    { key: "sst", label: "SST", href: "/pte/listening/sst" },
    { key: "mcsa", label: "MCSA", href: "/pte/listening/mcsa" },
    { key: "mcma", label: "MCMA", href: "/pte/listening/mcma" },
    { key: "fib_l", label: "FIB-L", href: "/pte/listening/fib_l" },
    { key: "smw", label: "SMW", href: "/pte/listening/smw" },
    { key: "hiw", label: "HIW", href: "/pte/listening/hiw" },
    { key: "hcs", label: "HCS", href: "/pte/listening/hcs" },
    { key: "wfd", label: "WFD", href: "/pte/listening/wfd" },
  ],
};
