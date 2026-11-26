export const companies = {
  "TechNova":      { city: "Indore", area: "Vijay Nagar",     industry: "Software Development", size: "201-500 employees", about: "Builds web and mobile products for retail and logistics clients." },
  "InsightIQ":     { city: "Pune",   area: "Baner",           industry: "Data & Analytics",     size: "51-200 employees",  about: "Turns raw business data into dashboards and reports." },
  "BrandLoop":     { city: "Delhi",  area: "Nehru Place",     industry: "Digital Marketing",    size: "11-50 employees",   about: "Runs social media and performance marketing for small brands." },
  "Pixel Studio":  { city: "Bhopal", area: "Arera Colony",    industry: "Design & Web",         size: "51-200 employees",  about: "Designs and builds websites and apps with a small, fast team." },
  "PeopleFirst":   { city: "Mumbai", area: "Andheri East",    industry: "HR Services",          size: "201-500 employees", about: "Recruitment and HR support for growing companies." },
  "DesignNest":    { city: "Bhopal", area: "MP Nagar",        industry: "Product Design",       size: "11-50 employees",   about: "A product design studio focused on clean, simple interfaces." },
  "FinEdge":       { city: "Delhi",  area: "Connaught Place", industry: "Finance",              size: "201-500 employees", about: "Accounting and finance services for businesses." },
  "HelpDesk Pro":  { city: "Indore", area: "Palasia",         industry: "Customer Support",     size: "501-1000 employees", about: "Runs customer support teams for online stores." },
  "SellRight":     { city: "Indore", area: "Sapna Sangeeta",  industry: "Sales & Retail",       size: "51-200 employees",  about: "Direct sales and distribution across central India." },
  "CodeCraft":     { city: "Bhopal", area: "Kolar Road",      industry: "Software Development", size: "201-500 employees", about: "Java and cloud development for banks and insurance firms." },
  "ByteWorks":     { city: "Pune",   area: "Hinjewadi",       industry: "Software Development", size: "501-1000 employees", about: "Product engineering company with teams across India." },
  "DataVista":     { city: "Mumbai", area: "Powai",           industry: "Data & Analytics",     size: "201-500 employees", about: "Business intelligence and data engineering services." },
  "AdWave":        { city: "Indore", area: "Bhawarkuan",      industry: "Digital Marketing",    size: "11-50 employees",   about: "Advertising and SEO agency for local businesses." },
  "WebCraft":      { city: "Pune",   area: "Kharadi",         industry: "Web Development",      size: "51-200 employees",  about: "Builds fast React websites and web apps." },
  "TalentBridge":  { city: "Bhopal", area: "Hoshangabad Road", industry: "HR Services",         size: "11-50 employees",   about: "Connects freshers with their first job through hiring drives." },
  "LedgerLine":    { city: "Mumbai", area: "Nariman Point",   industry: "Finance",              size: "201-500 employees", about: "Audit, tax and bookkeeping for mid-size companies." },
  "CareConnect":   { city: "Pune",   area: "Viman Nagar",     industry: "Customer Support",     size: "501-1000 employees", about: "Voice and chat support for healthcare and telecom brands." },
  "GrowthHive":    { city: "Delhi",  area: "Saket",           industry: "Sales & Marketing",    size: "51-200 employees",  about: "B2B sales team that helps start-ups find customers." },
  "JavaJunction":  { city: "Pune",   area: "Aundh",           industry: "Software Development", size: "51-200 employees",  about: "Trains and hires Java developers for enterprise projects." },
  "NextGen Soft":  { city: "Bhopal", area: "Shyamla Hills",   industry: "Software Development", size: "11-50 employees",   about: "Small software company that takes interns every year." },
  "Skyline Labs":  { city: "Delhi",  area: "Okhla",           industry: "Web Development",      size: "51-200 employees",  about: "Remote-first company building web tools for global clients." },
  "Creative Hub":  { city: "Mumbai", area: "Bandra West",     industry: "Design & Branding",    size: "51-200 employees",  about: "Brand identity and UI/UX design for media and fashion." },
  "DealMakers":    { city: "Bhopal", area: "Habibganj",       industry: "Sales & Retail",       size: "11-50 employees",   about: "Sales team for real estate and consumer products." },
  "EnterpriseOne": { city: "Indore", area: "AB Road",         industry: "Software Development", size: "1000+ employees",   about: "Large IT services company with enterprise Java teams." },
};

const rawJobs = [
  { id: 1,  title: "Software Developer",          company: "TechNova",      category: "Development",    pay: "₹6–10 LPA",  type: "Full Time", exp: "1–3 Years", lpa: 8,   workMode: "On-site", color: "bg-[#FF8A00]" },
  { id: 2,  title: "Data Analyst",                company: "InsightIQ",     category: "Data",           pay: "₹20K / mo",  type: "Internship", exp: "Fresher",  lpa: 2.4, workMode: "On-site", color: "bg-red-500" },
  { id: 3,  title: "Digital Marketing Executive", company: "BrandLoop",     category: "Marketing",      pay: "₹3–5 LPA",   type: "Part Time", exp: "Fresher",   lpa: 4,   workMode: "Remote",  color: "bg-violet-500" },
  { id: 4,  title: "Frontend Developer",          company: "Pixel Studio",  category: "Development",    pay: "₹5–8 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 6.5, workMode: "On-site", color: "bg-emerald-500" },
  { id: 5,  title: "HR Executive",                company: "PeopleFirst",   category: "Human Resource", pay: "₹4–6 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 5,   workMode: "On-site", color: "bg-sky-500" },
  { id: 6,  title: "UI/UX Designer",              company: "DesignNest",    category: "Design",         pay: "₹6–9 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 7.5, workMode: "On-site", color: "bg-pink-500" },
  { id: 7,  title: "Accountant",                  company: "FinEdge",       category: "Finance",        pay: "₹3–5 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 4,   workMode: "On-site", color: "bg-indigo-500" },
  { id: 8,  title: "Customer Support Executive",  company: "HelpDesk Pro",  category: "Support",        pay: "₹15K / mo",  type: "Part Time", exp: "Fresher",   lpa: 1.8, workMode: "Remote",  color: "bg-teal-500" },
  { id: 9,  title: "Sales Executive",             company: "SellRight",     category: "Sales",          pay: "₹3–6 LPA",   type: "Full Time", exp: "Fresher",   lpa: 4.5, workMode: "On-site", color: "bg-rose-500" },
  { id: 10, title: "Java Developer",              company: "CodeCraft",     category: "Development",    pay: "₹7–12 LPA",  type: "Full Time", exp: "3–5 Years", lpa: 9.5, workMode: "On-site", color: "bg-blue-500" },

  { id: 11, title: "Software Developer",          company: "ByteWorks",     category: "Development",    pay: "₹12–18 LPA", type: "Full Time", exp: "5+ Years",  lpa: 15,  workMode: "Remote",  color: "bg-emerald-500" },
  { id: 12, title: "Data Analyst",                company: "DataVista",     category: "Data",           pay: "₹6–9 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 7.5, workMode: "On-site", color: "bg-[#FF8A00]" },
  { id: 13, title: "Digital Marketing Executive", company: "AdWave",        category: "Marketing",      pay: "₹4–6 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 5,   workMode: "On-site", color: "bg-pink-500" },
  { id: 14, title: "Frontend Developer",          company: "WebCraft",      category: "Development",    pay: "₹10–15 LPA", type: "Full Time", exp: "3–5 Years", lpa: 12.5, workMode: "On-site", color: "bg-violet-500" },
  { id: 15, title: "HR Executive",                company: "TalentBridge",  category: "Human Resource", pay: "₹15K / mo",  type: "Internship", exp: "Fresher",  lpa: 1.8, workMode: "On-site", color: "bg-red-500" },
  { id: 16, title: "UI/UX Designer",              company: "Pixel Studio",  category: "Design",         pay: "₹4–7 LPA",   type: "Freelance", exp: "1–3 Years", lpa: 5.5, workMode: "Remote",  color: "bg-sky-500" },
  { id: 17, title: "Accountant",                  company: "LedgerLine",    category: "Finance",        pay: "₹6–10 LPA",  type: "Full Time", exp: "3–5 Years", lpa: 8,   workMode: "On-site", color: "bg-teal-500" },
  { id: 18, title: "Customer Support Executive",  company: "CareConnect",   category: "Support",        pay: "₹3–4 LPA",   type: "Full Time", exp: "Fresher",   lpa: 3.5, workMode: "On-site", color: "bg-indigo-500" },
  { id: 19, title: "Sales Executive",             company: "GrowthHive",    category: "Sales",          pay: "₹5–8 LPA",   type: "Full Time", exp: "1–3 Years", lpa: 6.5, workMode: "On-site", color: "bg-[#FF8A00]" },
  { id: 20, title: "Java Developer",              company: "JavaJunction",  category: "Development",    pay: "₹4–6 LPA",   type: "Full Time", exp: "Fresher",   lpa: 5,   workMode: "On-site", color: "bg-rose-500" },

  { id: 21, title: "Software Developer",          company: "NextGen Soft",  category: "Development",    pay: "₹25K / mo",  type: "Internship", exp: "Fresher",  lpa: 3,   workMode: "On-site", color: "bg-blue-500" },
  { id: 22, title: "Frontend Developer",          company: "Skyline Labs",  category: "Development",    pay: "₹4–7 LPA",   type: "Freelance", exp: "1–3 Years", lpa: 5.5, workMode: "Remote",  color: "bg-emerald-500" },
  { id: 23, title: "UI/UX Designer",              company: "Creative Hub",  category: "Design",         pay: "₹12–16 LPA", type: "Full Time", exp: "5+ Years",  lpa: 14,  workMode: "On-site", color: "bg-violet-500" },
  { id: 24, title: "Sales Executive",             company: "DealMakers",    category: "Sales",          pay: "₹20K / mo",  type: "Internship", exp: "Fresher",  lpa: 2.4, workMode: "On-site", color: "bg-pink-500" },
  { id: 25, title: "Java Developer",              company: "EnterpriseOne", category: "Development",    pay: "₹14–20 LPA", type: "Full Time", exp: "5+ Years",  lpa: 17,  workMode: "On-site", color: "bg-sky-500" },
];

export const jobs = rawJobs.map((j) => ({
  ...j,
  city: companies[j.company].city,
  area: companies[j.company].area,
}));

export const getJobById = (id) => jobs.find((j) => j.id === Number(id));
export const getCompany = (name) => companies[name];

export const cityOptions = [
  "Bhopal",
  "Indore",
  "Mumbai",
  "Pune",
  "Delhi"
];
