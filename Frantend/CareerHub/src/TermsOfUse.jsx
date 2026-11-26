import LegalPage from "./LegalPage.jsx";

const sections = [
  {
    heading: "Using CareerHub",
    body: [
      "CareerHub is a platform where job seekers can find jobs, follow companies and apply, and where recruiters can manage applications and interviews. By creating an account or using the site you agree to these terms.",
    ],
  },
  {
    heading: "Your account",
    body: [
      "You must give correct information and use an email address that belongs to you. You are responsible for keeping your password safe and for everything that happens under your account. Please tell us if you think someone else is using it.",
    ],
  },
  {
    heading: "What you may not do",
    body: [
      {
        list: [
          "Give false or misleading information, or pretend to be someone else.",
          "Upload files or write messages that are unlawful, abusive or harmful.",
          "Try to break, overload or get around the security of the site.",
          "Collect other people's information from the site, or use it to send spam.",
        ],
      },
    ],
  },
  {
    heading: "Jobs, applications and interviews",
    body: [
      "Jobs and company details are provided by recruiters. CareerHub does not guarantee that you will get a job, an interview or a reply, and we are not a party to any hiring decision between you and a company. Please check every offer yourself before you accept it, and never pay money to get a job.",
    ],
  },
  {
    heading: "Your content",
    body: [
      "You keep the rights to the profile details, resume and messages you submit. You allow CareerHub to store them and to show them to the recruiters you choose to apply to, so the service can work.",
    ],
  },
  {
    heading: "Ending your use",
    body: [
      "You can delete your account at any time from Settings. We may suspend or remove accounts that break these terms.",
    ],
  },
  {
    heading: "No warranty and limits of responsibility",
    body: [
      "CareerHub is provided as it is. We try to keep it available and accurate but we cannot promise that it will always work without interruption or errors. To the extent the law allows, we are not responsible for losses that come from using the site or from decisions made by companies or candidates.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms from time to time. If you keep using CareerHub after a change, you accept the new terms.",
    ],
  },
];

export default function TermsOfUse() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="21 November 2026"
      intro="Please read these terms carefully. They describe the rules for using CareerHub."
      sections={sections}
    />
  );
}
