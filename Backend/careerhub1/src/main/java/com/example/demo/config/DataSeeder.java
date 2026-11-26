package com.example.demo.config;

import java.time.LocalDate;

import com.example.demo.entity.Company;
import com.example.demo.entity.Job;
import com.example.demo.repository.CompanyRepository;
import com.example.demo.repository.JobRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final CompanyRepository companies;
    private final JobRepository jobs;
    private final JdbcTemplate jdbc;

    public DataSeeder(CompanyRepository companies, JobRepository jobs, JdbcTemplate jdbc) {
        this.companies = companies;
        this.jobs = jobs;
        this.jdbc = jdbc;
    }

    private static final String[][] COMPANIES = {
        {"TechNova", "Indore", "Vijay Nagar", "Software Development", "201-500 employees", "Builds web and mobile products for retail and logistics clients."},
        {"InsightIQ", "Pune", "Baner", "Data & Analytics", "51-200 employees", "Turns raw business data into dashboards and reports."},
        {"BrandLoop", "Delhi", "Nehru Place", "Digital Marketing", "11-50 employees", "Runs social media and performance marketing for small brands."},
        {"Pixel Studio", "Bhopal", "Arera Colony", "Design & Web", "51-200 employees", "Designs and builds websites and apps with a small, fast team."},
        {"PeopleFirst", "Mumbai", "Andheri East", "HR Services", "201-500 employees", "Recruitment and HR support for growing companies."},
        {"DesignNest", "Bhopal", "MP Nagar", "Product Design", "11-50 employees", "A product design studio focused on clean, simple interfaces."},
        {"FinEdge", "Delhi", "Connaught Place", "Finance", "201-500 employees", "Accounting and finance services for businesses."},
        {"HelpDesk Pro", "Indore", "Palasia", "Customer Support", "501-1000 employees", "Runs customer support teams for online stores."},
        {"SellRight", "Indore", "Sapna Sangeeta", "Sales & Retail", "51-200 employees", "Direct sales and distribution across central India."},
        {"CodeCraft", "Bhopal", "Kolar Road", "Software Development", "201-500 employees", "Java and cloud development for banks and insurance firms."},
        {"ByteWorks", "Pune", "Hinjewadi", "Software Development", "501-1000 employees", "Product engineering company with teams across India."},
        {"DataVista", "Mumbai", "Powai", "Data & Analytics", "201-500 employees", "Business intelligence and data engineering services."},
        {"AdWave", "Indore", "Bhawarkuan", "Digital Marketing", "11-50 employees", "Advertising and SEO agency for local businesses."},
        {"WebCraft", "Pune", "Kharadi", "Web Development", "51-200 employees", "Builds fast React websites and web apps."},
        {"TalentBridge", "Bhopal", "Hoshangabad Road", "HR Services", "11-50 employees", "Connects freshers with their first job through hiring drives."},
        {"LedgerLine", "Mumbai", "Nariman Point", "Finance", "201-500 employees", "Audit, tax and bookkeeping for mid-size companies."},
        {"CareConnect", "Pune", "Viman Nagar", "Customer Support", "501-1000 employees", "Voice and chat support for healthcare and telecom brands."},
        {"GrowthHive", "Delhi", "Saket", "Sales & Marketing", "51-200 employees", "B2B sales team that helps start-ups find customers."},
        {"JavaJunction", "Pune", "Aundh", "Software Development", "51-200 employees", "Trains and hires Java developers for enterprise projects."},
        {"NextGen Soft", "Bhopal", "Shyamla Hills", "Software Development", "11-50 employees", "Small software company that takes interns every year."},
        {"Skyline Labs", "Delhi", "Okhla", "Web Development", "51-200 employees", "Remote-first company building web tools for global clients."},
        {"Creative Hub", "Mumbai", "Bandra West", "Design & Branding", "51-200 employees", "Brand identity and UI/UX design for media and fashion."},
        {"DealMakers", "Bhopal", "Habibganj", "Sales & Retail", "11-50 employees", "Sales team for real estate and consumer products."},
        {"EnterpriseOne", "Indore", "AB Road", "Software Development", "1000+ employees", "Large IT services company with enterprise Java teams."}
    };

    private static final String[][] JOBS = {
        {"Software Developer", "TechNova", "Development", "R6-10 LPA", "Full Time", "1-3 Years", "8", "On-site"},
        {"Data Analyst", "InsightIQ", "Data", "R20K / mo", "Internship", "Fresher", "2.4", "On-site"},
        {"Digital Marketing Executive", "BrandLoop", "Marketing", "R3-5 LPA", "Part Time", "Fresher", "4", "Remote"},
        {"Frontend Developer", "Pixel Studio", "Development", "R5-8 LPA", "Full Time", "1-3 Years", "6.5", "On-site"},
        {"HR Executive", "PeopleFirst", "Human Resource", "R4-6 LPA", "Full Time", "1-3 Years", "5", "On-site"},
        {"UI/UX Designer", "DesignNest", "Design", "R6-9 LPA", "Full Time", "1-3 Years", "7.5", "On-site"},
        {"Accountant", "FinEdge", "Finance", "R3-5 LPA", "Full Time", "1-3 Years", "4", "On-site"},
        {"Customer Support Executive", "HelpDesk Pro", "Support", "R15K / mo", "Part Time", "Fresher", "1.8", "Remote"},
        {"Sales Executive", "SellRight", "Sales", "R3-6 LPA", "Full Time", "Fresher", "4.5", "On-site"},
        {"Java Developer", "CodeCraft", "Development", "R7-12 LPA", "Full Time", "3-5 Years", "9.5", "On-site"},

        {"Software Developer", "ByteWorks", "Development", "R12-18 LPA", "Full Time", "5+ Years", "15", "Remote"},
        {"Data Analyst", "DataVista", "Data", "R6-9 LPA", "Full Time", "1-3 Years", "7.5", "On-site"},
        {"Digital Marketing Executive", "AdWave", "Marketing", "R4-6 LPA", "Full Time", "1-3 Years", "5", "On-site"},
        {"Frontend Developer", "WebCraft", "Development", "R10-15 LPA", "Full Time", "3-5 Years", "12.5", "On-site"},
        {"HR Executive", "TalentBridge", "Human Resource", "R15K / mo", "Internship", "Fresher", "1.8", "On-site"},
        {"UI/UX Designer", "Pixel Studio", "Design", "R4-7 LPA", "Freelance", "1-3 Years", "5.5", "Remote"},
        {"Accountant", "LedgerLine", "Finance", "R6-10 LPA", "Full Time", "3-5 Years", "8", "On-site"},
        {"Customer Support Executive", "CareConnect", "Support", "R3-4 LPA", "Full Time", "Fresher", "3.5", "On-site"},
        {"Sales Executive", "GrowthHive", "Sales", "R5-8 LPA", "Full Time", "1-3 Years", "6.5", "On-site"},
        {"Java Developer", "JavaJunction", "Development", "R4-6 LPA", "Full Time", "Fresher", "5", "On-site"},

        {"Software Developer", "NextGen Soft", "Development", "R25K / mo", "Internship", "Fresher", "3", "On-site"},
        {"Frontend Developer", "Skyline Labs", "Development", "R4-7 LPA", "Freelance", "1-3 Years", "5.5", "Remote"},
        {"UI/UX Designer", "Creative Hub", "Design", "R12-16 LPA", "Full Time", "5+ Years", "14", "On-site"},
        {"Sales Executive", "DealMakers", "Sales", "R20K / mo", "Internship", "Fresher", "2.4", "On-site"},
        {"Java Developer", "EnterpriseOne", "Development", "R14-20 LPA", "Full Time", "5+ Years", "17", "On-site"}
    };

    private static String fmt(String s) {
        return s.replace("R", "\u20B9").replace("-", "\u2013");
    }

    @Override
    public void run(String... args) {
        seedCompanies();
        seedJobs();
    }

    private void seedCompanies() {
        int added = 0;
        for (String[] row : COMPANIES) {
            if (companies.findByNameIgnoreCase(row[0]).isPresent()) continue;
            Company c = new Company();
            c.setName(row[0]);
            c.setCity(row[1]);
            c.setArea(row[2]);
            c.setIndustry(row[3]);
            c.setCompanySize(row[4]);
            c.setAbout(row[5]);
            companies.save(c);
            added++;
        }
        log.info("DataSeeder: {} companies added", added);
    }

    private void seedJobs() {
        long existing = jobs.count();
        if (existing > 0) {
            log.info("DataSeeder: jobs table already has {} rows, nothing added", existing);
            return;
        }

        jdbc.execute("ALTER TABLE jobs AUTO_INCREMENT = 1");

        int i = 0;
        for (String[] row : JOBS) {
            Company c = companies.findByNameIgnoreCase(row[1]).orElseThrow();
            Job j = new Job();
            j.setTitle(row[0]);
            j.setCompany(c);
            j.setCategory(row[2]);
            j.setSalary(fmt(row[3]));
            j.setJobType(row[4]);
            j.setExperience(fmt(row[5]));
            j.setLpa(Double.parseDouble(row[6]));
            j.setWorkMode(row[7]);
            j.setDescription(c.getName() + " is hiring a " + row[0] + " in " + c.getCity()
                    + ". " + c.getAbout());
            j.setPostedAt(LocalDate.now().minusDays(i % 6));
            j.setActive(true);
            jobs.save(j);
            i++;
        }
        log.info("DataSeeder: {} jobs added (ids 1..{})", i, i);
    }
}
