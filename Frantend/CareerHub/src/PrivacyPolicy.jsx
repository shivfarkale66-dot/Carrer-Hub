import LegalPage from "./LegalPage.jsx";

const sections = [
  {
    heading: "Information we collect",
    body: [
      "When you use CareerHub we collect the information you give us:",
      {
        list: [
          "Account details: your name, email address and password (the password is stored in a protected, hashed form, never as plain text).",
          "Profile details you choose to add: phone number, location, skills, education, experience, photo and resume.",
          "Job applications: the details, cover letter and resume you send when you apply for a job.",
          "Messages: the messages and files you send to companies, and the messages you send through the Contact Us page.",
          "Activity on the site: saved jobs, followed companies, notifications and interview details.",
        ],
      },
    ],
  },
  {
    heading: "How we use your information",
    body: [
      {
        list: [
          "To create and secure your account, including checking your email address with a 6-digit code.",
          "To show your applications and profile to the recruiters of the jobs you apply for.",
          "To schedule and run interviews, and to show you your notifications.",
          "To email you about your account and your activity, for example the verification code, a reset code, a received application, a status change or a scheduled interview.",
          "To keep the service working, safe and free from misuse.",
        ],
      },
    ],
  },
  {
    heading: "Who can see your information",
    body: [
      "Recruiters can see the applications you send them, together with the profile details and resume you submit with them. Your password is never visible to anyone. We do not sell your personal information.",
    ],
  },
  {
    heading: "Emails",
    body: [
      "We send emails that are needed to run your account and to keep you updated about your applications and interviews. These are sent to the email address you registered with, so please make sure it is correct and that you can read it.",
    ],
  },
  {
    heading: "Storage and security",
    body: [
      "Your information is stored in our database. We protect passwords by hashing them and we limit access to the data to what is needed to run the service. No system is perfectly secure, so please choose a strong password and do not share it.",
    ],
  },
  {
    heading: "Browser storage",
    body: [
      "To keep you logged in and to make pages load faster, the site stores a login token and a small copy of your own applications and saved jobs in your browser. These are removed when you log out.",
    ],
  },
  {
    heading: "Your choices",
    body: [
      "You can update your profile at any time from the Profile page. You can delete your account from Settings; this removes your account together with your profile, resume, applications, saved jobs, messages and notifications. You can also contact us to ask questions about your information.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy from time to time. The date at the top of this page shows when it was last changed.",
    ],
  },
];

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="21 November 2026"
      intro="This policy explains what information CareerHub collects, how it is used and the choices you have. By using CareerHub you agree to it."
      sections={sections}
    />
  );
}
