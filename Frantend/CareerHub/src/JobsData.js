const titles = [
  "Software Developer",
  "Data Analyst",
  "Digital Marketing Executive",
  "Frontend Developer",
  "HR Executive",
  "UI/UX Designer",
  "Accountant",
  "Customer Support Executive",
  "Sales Executive",
  "Java Developer",
];

const companies = [
  { name: "TCS", city: "Mumbai" },
  { name: "Infosys", city: "Pune" },
  { name: "Wipro", city: "Bengaluru" },
  { name: "HCLTech", city: "Noida" },
  { name: "Tech Mahindra", city: "Hyderabad" },
  { name: "Zoho", city: "Chennai" },
  { name: "Accenture", city: "Gurugram" },
  { name: "Capgemini", city: "Mumbai" },
  { name: "Cognizant", city: "Chennai" },
  { name: "Mphasis", city: "Bengaluru" },
];

const salaryByTitle = {
  "Software Developer": "6 - 10 LPA",
  "Data Analyst": "5 - 8 LPA",
  "Digital Marketing Executive": "3 - 5 LPA",
  "Frontend Developer": "5 - 9 LPA",
  "HR Executive": "3 - 5 LPA",
  "UI/UX Designer": "4 - 8 LPA",
  "Accountant": "3 - 5 LPA",
  "Customer Support Executive": "2.5 - 4 LPA",
  "Sales Executive": "3 - 6 LPA",
  "Java Developer": "6 - 11 LPA",
};

const categoryByTitle = {
  "Software Developer": "IT",
  "Data Analyst": "IT",
  "Digital Marketing Executive": "Marketing",
  "Frontend Developer": "IT",
  "HR Executive": "HR",
  "UI/UX Designer": "Design",
  "Accountant": "Finance",
  "Customer Support Executive": "Support",
  "Sales Executive": "Sales",
  "Java Developer": "IT",
};

const types = ["Full Time", "Full Time", "Part Time", "Internship", "Remote"];
const experiences = ["Fresher", "1 - 2 years", "2 - 4 years", "3 - 5 years", "Fresher"];
const posted = ["Today", "1 day ago", "2 days ago", "3 days ago", "1 week ago"];

export const jobs = Array.from({ length: 25 }, (_, i) => {
  const title = titles[i % titles.length];
  const company = companies[(i * 3) % companies.length];
  const type = types[i % types.length];

  return {
    id: i + 1,
    title,
    company: company.name,
    companyName: company.name,
    location: company.city,
    city: company.city,
    type,
    jobType: type,
    experience: experiences[i % experiences.length],
    salary: salaryByTitle[title],
    package: salaryByTitle[title],
    category: categoryByTitle[title],
    posted: posted[i % posted.length],
    description: `${company.name} is hiring a ${title} in ${company.city}. You will work with a friendly team on real projects.`,
  };
});

export default jobs;
