import { client } from "@/sanity/lib/client";

type Profile = {
  firstName?: string;
  lastName?: string;
  headline?: string;
  shortBio?: string;
  email?: string;
  phone?: string;
  location?: string;
  availability?: string;
  yearsOfExperience?: number;
  socialLinks?: Record<string, string>;
};

type Project = {
  title?: string;
  tagline?: string;
  category?: string;
  liveUrl?: string;
  githubUrl?: string;
};

type Experience = {
  company?: string;
  position?: string;
  employmentType?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  descriptionText?: string;
  responsibilities?: string[];
  achievements?: string[];
};

type Skill = {
  name?: string;
  category?: string;
  proficiency?: string;
};

type Education = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
};

export async function getPortfolioContext(): Promise<string> {
  const [profile, projects, experience, skills, education] = await Promise.all([
    client.fetch<Profile | null>(
      `*[_id == "singleton-profile"][0]{
        firstName,
        lastName,
        headline,
        shortBio,
        email,
        phone,
        location,
        availability,
        yearsOfExperience,
        socialLinks
      }`
    ),
    client.fetch<Project[]>(
      `*[_type == "project"] | order(order asc){
        title,
        tagline,
        category,
        liveUrl,
        githubUrl
      }`
    ),
    client.fetch<Experience[]>(
      `*[_type == "experience"] | order(startDate desc){
        company,
        position,
        employmentType,
        location,
        startDate,
        endDate,
        current,
        "descriptionText": pt::text(description),
        responsibilities,
        achievements
      }`
    ),
    client.fetch<Skill[]>(
      `*[_type == "skill"] | order(category asc, name asc){
        name,
        category,
        proficiency
      }`
    ),
    client.fetch<Education[]>(
      `*[_type == "education"] | order(endDate desc){
        institution,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        current,
        description
      }`
    ),
  ]);

  const sections: string[] = [];

  if (profile) {
    const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
    sections.push(
      `## Profile\nName: ${name || "Not set"}\nHeadline: ${profile.headline ?? ""}\nShort bio: ${profile.shortBio ?? ""}\nEmail: ${profile.email ?? ""}\nPhone: ${profile.phone ?? ""}\nLocation: ${profile.location ?? ""}\nAvailability: ${profile.availability ?? ""}\nYears of experience: ${profile.yearsOfExperience ?? ""}\nSocial links: ${profile.socialLinks ? JSON.stringify(profile.socialLinks) : "None"}`
    );
  }

  if (projects?.length) {
    const list = projects
      .map(
        (p) =>
          `- ${p.title ?? ""}${p.tagline ? `: ${p.tagline}` : ""} (${p.category ?? ""})${p.liveUrl ? ` | Live: ${p.liveUrl}` : ""}${p.githubUrl ? ` | GitHub: ${p.githubUrl}` : ""}`
      )
      .join("\n");
    sections.push(`## Projects\n${list}`);
  }

  if (experience?.length) {
    const list = experience
      .map((e) => {
        const dates = e.current
          ? `${e.startDate ?? ""} – Present`
          : `${e.startDate ?? ""} – ${e.endDate ?? ""}`;
        const bullets = [
          ...(e.responsibilities ?? []),
          ...(e.achievements ?? []),
        ].filter(Boolean);
        const desc = e.descriptionText?.trim();
        return `- ${e.position ?? ""} at ${e.company ?? ""} (${e.employmentType ?? ""}, ${e.location ?? ""}) ${dates}\n  ${desc ? desc + "\n  " : ""}${bullets.length ? bullets.map((b) => `• ${b}`).join("\n  ") : ""}`;
      })
      .join("\n\n");
    sections.push(`## Work Experience\n${list}`);
  }

  if (skills?.length) {
    const byCategory = skills.reduce<Record<string, string[]>>((acc, s) => {
      const cat = s.category ?? "other";
      if (!acc[cat]) acc[cat] = [];
      if (s.name) acc[cat].push(`${s.name} (${s.proficiency ?? ""})`);
      return acc;
    }, {});
    const list = Object.entries(byCategory)
      .map(([cat, names]) => `${cat}: ${names.join(", ")}`)
      .join("\n");
    sections.push(`## Skills\n${list}`);
  }

  if (education?.length) {
    const list = education
      .map(
        (e) =>
          `- ${e.degree ?? ""} in ${e.fieldOfStudy ?? ""} at ${e.institution ?? ""} ${e.current ? "(current)" : `${e.startDate ?? ""} – ${e.endDate ?? ""}`}${e.description ? `\n  ${e.description}` : ""}`
      )
      .join("\n");
    sections.push(`## Education\n${list}`);
  }

  if (sections.length === 0) return "";

  return `You are the portfolio assistant for this person. Your answers must be based ONLY on the following data from Sanity CMS. Do not use external knowledge or make up information.

Rules:
- Base every answer strictly on the data below.
- If the user asks about something not in this data, reply that you don't have that information in the portfolio.
- Do not invent projects, jobs, skills, or personal details.
- Be concise and friendly. Quote or paraphrase only from the data below.

Portfolio data from Sanity:\n\n${sections.join("\n\n")}`;
}
