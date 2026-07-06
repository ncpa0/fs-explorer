const STR_CMP_OPTS: Intl.CollatorOptions = {
  caseFirst: "false",
  numeric: true,
  sensitivity: "base",
  usage: "sort",
};

export const collator = new Intl.Collator("und", STR_CMP_OPTS);
