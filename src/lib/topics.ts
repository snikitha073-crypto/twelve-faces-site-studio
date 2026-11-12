export type Difficulty = "easy" | "medium" | "hard";
export type Position = "for" | "against";
export type DebateMode = "quick" | "unlimited";

export interface Topic {
  id: string;
  title: string;
  description: string;
  category: string;
  suggested: Difficulty;
}

export const CATEGORIES = [
  "Technology & AI",
  "Education",
  "Science",
  "Environment",
  "Society",
  "Business & Economics",
  "Ethics",
  "Politics & Governance",
  "Future Innovations",
  "Everyday Life",
] as const;

export const TOPICS: Topic[] = [
  { id: "ai-jobs", category: "Technology & AI", suggested: "medium", title: "AI will create more jobs than it destroys", description: "Will automation and AI ultimately expand employment, or permanently shrink the human workforce?" },
  { id: "ai-art", category: "Technology & AI", suggested: "easy", title: "AI-generated art should be considered real art", description: "Can a work made by a model carry creativity and meaning, or does art require a human creator?" },
  { id: "ai-regulation", category: "Technology & AI", suggested: "hard", title: "Advanced AI development should be paused until regulated", description: "Should governments halt frontier AI research until binding global safety rules exist?" },
  { id: "homework", category: "Education", suggested: "easy", title: "Homework should be abolished", description: "Does homework reinforce learning, or does it mostly add stress and inequality?" },
  { id: "free-university", category: "Education", suggested: "medium", title: "University education should be free for everyone", description: "Is free higher education a public good worth funding, or an unfair and inefficient subsidy?" },
  { id: "ai-classroom", category: "Education", suggested: "medium", title: "Students should be allowed to use AI tools in exams", description: "Is AI the new calculator, or does it undermine what exams are meant to measure?" },
  { id: "mars", category: "Science", suggested: "medium", title: "Colonising Mars should be humanity's top space priority", description: "Is a Mars settlement worth the cost, or should we focus resources on Earth and nearer goals?" },
  { id: "gene-editing", category: "Science", suggested: "hard", title: "Human gene editing should be allowed to prevent disease", description: "Should technologies like CRISPR be used on human embryos to eliminate inherited illnesses?" },
  { id: "animal-testing", category: "Science", suggested: "medium", title: "Animal testing should be banned", description: "Is animal research a necessary cost of medical progress, or an outdated cruelty?" },
  { id: "nuclear", category: "Environment", suggested: "medium", title: "Nuclear power is essential to fight climate change", description: "Is nuclear energy the clean backbone we need, or too risky and slow compared with renewables?" },
  { id: "meat-tax", category: "Environment", suggested: "medium", title: "Meat should be taxed to protect the planet", description: "Should governments use taxes to reduce meat consumption and its environmental impact?" },
  { id: "plastic-ban", category: "Environment", suggested: "easy", title: "Single-use plastics should be banned worldwide", description: "Would a global ban meaningfully help the environment, or create bigger problems?" },
  { id: "social-media-age", category: "Society", suggested: "easy", title: "Social media should be banned for under-16s", description: "Do age limits protect young people, or are they unenforceable and overprotective?" },
  { id: "four-day-week", category: "Society", suggested: "easy", title: "A four-day work week should be the standard", description: "Would shorter weeks improve productivity and wellbeing, or hurt the economy?" },
  { id: "remote-cities", category: "Society", suggested: "medium", title: "Remote work is better for society than office work", description: "Does remote work empower people and cities, or erode collaboration and community?" },
  { id: "ubi", category: "Business & Economics", suggested: "hard", title: "Universal basic income should be introduced", description: "Should every citizen get an unconditional income, especially in an age of automation?" },
  { id: "crypto", category: "Business & Economics", suggested: "medium", title: "Cryptocurrency will replace traditional banking", description: "Is decentralised finance the future of money, or a speculative bubble?" },
  { id: "billionaires", category: "Business & Economics", suggested: "medium", title: "Billionaires should not exist", description: "Is extreme wealth a sign of a broken system, or a reward for creating enormous value?" },
  { id: "privacy-security", category: "Ethics", suggested: "hard", title: "Privacy should never be sacrificed for security", description: "Is mass surveillance ever justified to keep citizens safe?" },
  { id: "zoos", category: "Ethics", suggested: "easy", title: "Zoos do more harm than good", description: "Are zoos vital for conservation and education, or outdated prisons for animals?" },
  { id: "euthanasia", category: "Ethics", suggested: "hard", title: "Assisted dying should be legal", description: "Should terminally ill adults have the right to choose a medically assisted death?" },
  { id: "voting-age", category: "Politics & Governance", suggested: "easy", title: "The voting age should be lowered to 16", description: "Are 16-year-olds ready to vote, and would it strengthen democracy?" },
  { id: "compulsory-voting", category: "Politics & Governance", suggested: "medium", title: "Voting should be compulsory", description: "Does mandatory voting improve legitimacy, or violate personal freedom?" },
  { id: "ai-government", category: "Politics & Governance", suggested: "hard", title: "AI should help make government policy decisions", description: "Could algorithmic policy-making be fairer and smarter than politicians?" },
  { id: "self-driving", category: "Future Innovations", suggested: "medium", title: "Human driving should be banned once self-driving cars are safer", description: "If machines drive better, should people still be allowed behind the wheel?" },
  { id: "brain-chips", category: "Future Innovations", suggested: "hard", title: "Brain-computer implants will do more good than harm", description: "Will neural interfaces liberate human potential, or threaten autonomy and privacy?" },
  { id: "lab-meat", category: "Future Innovations", suggested: "easy", title: "Lab-grown meat should replace farming", description: "Is cultivated meat the ethical, sustainable future of food?" },
  { id: "cash", category: "Everyday Life", suggested: "easy", title: "Society should go completely cashless", description: "Is a cashless world more convenient and safe, or does it exclude and expose people?" },
  { id: "phones-schools", category: "Everyday Life", suggested: "easy", title: "Smartphones should be banned in schools", description: "Would phone-free schools improve focus and wellbeing, or ignore modern reality?" },
  { id: "breakfast", category: "Everyday Life", suggested: "easy", title: "Breakfast is the most important meal of the day", description: "Is this classic advice backed by evidence, or clever marketing?" },
];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Easy", medium: "Medium", hard: "Hard" };
export const DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: "Friendly opponent, simpler counterpoints. 1.0× points.",
  medium: "Balanced, rigorous rebuttals. 1.25× points.",
  hard: "Relentless expert-level challenges. 1.5× points.",
};
export const MODE_LABEL: Record<DebateMode, string> = { quick: "Quick Debate", unlimited: "Unlimited Debate" };
export const QUICK_ROUNDS = 3;

export function opposite(p: Position): Position {
  return p === "for" ? "against" : "for";
}
