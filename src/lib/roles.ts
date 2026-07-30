export type Role = {
  id: string;
  title: string;
  slug: string;
  icon: string;
  category: string;
  description: string;
  tags: string[];
  avgSalary: string;
  demand: "very-high" | "high" | "medium";
};

export const ROLES: Role[] = [
  {
    id: "swe",
    title: "Software Engineer",
    slug: "software-engineer",
    icon: "Code2",
    category: "Engineering",
    description: "Generalist SWE interviews covering data structures, system design, and behavioral.",
    tags: ["Algorithms", "System Design", "Behavioral"],
    avgSalary: "$120K - $200K",
    demand: "very-high",
  },
  {
    id: "frontend",
    title: "Frontend Developer",
    slug: "frontend-developer",
    icon: "Layout",
    category: "Engineering",
    description: "JavaScript, React, CSS, web performance, accessibility, and component design.",
    tags: ["JavaScript", "React", "CSS"],
    avgSalary: "$95K - $170K",
    demand: "very-high",
  },
  {
    id: "backend",
    title: "Backend Developer",
    slug: "backend-developer",
    icon: "Server",
    category: "Engineering",
    description: "APIs, databases, distributed systems, caching, and backend architecture.",
    tags: ["APIs", "Databases", "Distributed Systems"],
    avgSalary: "$110K - $190K",
    demand: "high",
  },
  {
    id: "data-scientist",
    title: "Data Scientist",
    slug: "data-scientist",
    icon: "BarChart3",
    category: "Data & Analytics",
    description: "Statistics, ML fundamentals, SQL, case studies, and product sense.",
    tags: ["Statistics", "ML", "SQL"],
    avgSalary: "$120K - $210K",
    demand: "high",
  },
  {
    id: "devops",
    title: "DevOps Engineer",
    slug: "devops-engineer",
    icon: "GitBranch",
    category: "Engineering",
    description: "CI/CD, Kubernetes, cloud (AWS/GCP/Azure), infrastructure as code, observability.",
    tags: ["CI/CD", "Kubernetes", "Cloud"],
    avgSalary: "$115K - $195K",
    demand: "high",
  },
  {
    id: "product-manager",
    title: "Product Manager",
    slug: "product-manager",
    icon: "Target",
    category: "Product & Design",
    description: "Product sense, execution, analytical thinking, behavioral, and stakeholder mgmt.",
    tags: ["Product Sense", "Analytics", "Strategy"],
    avgSalary: "$130K - $230K",
    demand: "high",
  },
  {
    id: "cloud-engineer",
    title: "Cloud Engineer",
    slug: "cloud-engineer",
    icon: "Cloud",
    category: "Engineering",
    description: "AWS/Azure/GCP services, networking, security, migration, and cost optimization.",
    tags: ["AWS", "Azure", "Networking"],
    avgSalary: "$110K - $185K",
    demand: "high",
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    slug: "ml-engineer",
    icon: "BrainCircuit",
    category: "Engineering",
    description: "ML system design, model deployment, MLOps, and applied ML problems.",
    tags: ["ML", "MLOps", "Python"],
    avgSalary: "$140K - $240K",
    demand: "high",
  },
];

export const ROLE_CATEGORIES = Array.from(new Set(ROLES.map((r) => r.category)));

export const DIFFICULTY_LEVELS = [
  {
    id: "junior",
    title: "Junior (0-2 yrs)",
    description: "Easier questions, more guidance, foundational topics.",
  },
  {
    id: "mid",
    title: "Mid-Level (3-5 yrs)",
    description: "Standard industry questions, realistic difficulty.",
  },
  {
    id: "senior",
    title: "Senior (6+ yrs)",
    description: "Harder questions, deep system design, leadership focus.",
  },
];

export const INTERVIEW_MODES = [
  {
    id: "text",
    title: "Text Chat",
    description: "Type your answers. AI asks follow-ups. Best for focused practice.",
    icon: "MessageSquare",
  },
  {
    id: "voice",
    title: "Voice Interview",
    description: "Speak your answers. AI talks back. Most realistic. Pro feature.",
    icon: "Mic",
    pro: true,
  },
];
