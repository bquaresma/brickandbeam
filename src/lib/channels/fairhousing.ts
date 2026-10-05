// An advisory check on ad wording. It looks for phrases the Fair Housing Act's
// advertising rules warn about — language that describes the kind of person who
// should live somewhere instead of the home. It is a prompt to reread, not legal
// advice and not a guarantee: a clean result doesn't make an ad compliant.
export type Finding = {
  id: string;
  category: string;
  phrase: string;
  where: string;
  message: string;
  suggestion: string;
};

type Rule = {
  id: string;
  category: string;
  pattern: RegExp;
  message: string;
  suggestion: string;
};

const DESCRIBE_HOME =
  "Describe the home's features instead — layout, light, space, what is nearby.";

const RULES: Rule[] = [
  {
    id: "no-children",
    category: "Families",
    pattern:
      /\b(no (kids|children)|child[- ]?free|no families|adults?[- ]only|adult (building|community|living))\b/gi,
    message: "Excludes or discourages families with children.",
    suggestion:
      "Remove it. Occupancy limits, if any, should be stated as a number of people.",
  },
  {
    id: "who-for",
    category: "Families, age or marital status",
    pattern:
      /\b(perfect|ideal|great|best|suited|suitable|made) (for|to suit) (an? )?(couples?|singles?|young professionals?|professionals?|students?|families|a family|retirees?|seniors?|bachelors?|empty[- ]nesters?|newlyweds?)\b/gi,
    message: "Says who the home is for, which can signal who is unwelcome.",
    suggestion: DESCRIBE_HOME,
  },
  {
    id: "family-friendly",
    category: "Families",
    pattern:
      /\b(family[- ]friendly|family neighborhood|great neighborhood for (kids|families)|no (roommates|students))\b/gi,
    message: "Characterizes the neighborhood or home by household type.",
    suggestion: "Say what is nearby (a park, a bus line) rather than who it suits.",
  },
  {
    id: "age",
    category: "Age",
    pattern:
      /\b(young|mature|older|elderly|retired|retirees?|seniors?)( (adults?|people|couples?|tenants?|professionals?|folks))\b/gi,
    message: "Refers to a preferred age group.",
    suggestion: DESCRIBE_HOME,
  },
  {
    id: "single-gender",
    category: "Sex",
    pattern:
      /\b(females?|males?|men|women|girls?|guys?|ladies|gentlemen)[- ](only|preferred)\b|\bbachelor(ette)? pad\b/gi,
    message: "Expresses a preference by sex.",
    suggestion: "Remove it.",
  },
  {
    id: "disability",
    category: "Disability",
    pattern:
      /\b(able[- ]bodied|healthy (only|tenants?|people)|physically fit|agile|no wheelchairs?|not (suitable|appropriate) for (the )?(handicapped|disabled|elderly)|handicapped|crippled|mentally (ill|disabled|handicapped)|no group homes)\b/gi,
    message: "Excludes or labels people with disabilities.",
    suggestion:
      "Describe physical features factually (for example, “three steps to the front door”).",
  },
  {
    id: "religion",
    category: "Religion",
    pattern: /\b(christian|catholic|jewish|muslim|mormon|protestant|hindu|buddhist)\b/gi,
    message: "Names a religion, which can signal a preference.",
    suggestion:
      "Remove it, unless it is part of a place's name that you are only using as a landmark.",
  },
  {
    id: "houses-of-worship",
    category: "Religion",
    pattern:
      /\b(near|close to|steps from|next to|walking distance (to|from)|walk(able)? to|minutes from) (an? |the |several |many )?(church(es)?|synagogues?|mosques?|temples?|cathedral)\b/gi,
    message: "Pointing out houses of worship can steer renters by religion.",
    suggestion: "Mention transit, parks, shops or schools instead.",
  },
  {
    id: "national-origin",
    category: "National origin or race",
    pattern:
      /\b(english[- ]speaking|english only|native (english )?speakers? only|no foreigners|(american|us|u\.s\.) citizens? only|citizens? only|whites? only|no (immigrants|foreigners))\b/gi,
    message: "Expresses a preference by national origin or race.",
    suggestion: "Remove it.",
  },
  {
    id: "steering",
    category: "Neighborhood descriptions",
    pattern:
      /\b(safe (neighborhood|area|street|block)|desirable (neighborhood|area|location)|exclusive (neighborhood|area|community)|restricted|traditional (neighborhood|community)|integrated|(prime|nice|good) (neighborhood|area) for)\b/gi,
    message: "Neighborhood judgments can steer by race or national origin.",
    suggestion: "Stick to facts: distance to transit, shops, parks and walkability.",
  },
  {
    id: "income-source",
    category: "Source of income (check local law)",
    pattern:
      /\b(no section ?8|no (housing )?vouchers?|no (government|public) (assistance|aid))\b/gi,
    message:
      "Some cities and states protect renters who pay with vouchers or other assistance.",
    suggestion: "Ask your attorney whether this is allowed where the house is.",
  },
];

export function checkCopy(
  texts: { where: string; text: string | null | undefined }[],
): Finding[] {
  const findings: Finding[] = [];
  const seen = new Set<string>();

  for (const { where, text } of texts) {
    if (!text) continue;
    for (const rule of RULES) {
      for (const match of text.matchAll(rule.pattern)) {
        const phrase = match[0].trim();
        const key = `${rule.id}|${where}|${phrase.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        findings.push({
          id: rule.id,
          category: rule.category,
          phrase,
          where,
          message: rule.message,
          suggestion: rule.suggestion,
        });
      }
    }
  }
  return findings;
}
