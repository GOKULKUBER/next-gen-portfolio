import { HeroSection } from "./sections/HeroSection";
import { AboutSection } from "./sections/AboutSection";
import { TestimonialsSection  } from "./sections/TestimonialSection"
import { SkillsSection } from "./sections/SkillsSection";
import { ExperienceSection } from "./sections/ExperienceSection"
import { EducationSection } from "./sections/EducationSection"
import { ProjectsSection } from "./sections/ProjectsSection"
import { CertificationsSection } from "./sections/CertificationsSection"
import { AchievementsSection } from "./sections/AchievementsSection"
import { ServicesSection } from "./sections/ServicesSection"
import { BlogSection } from "./sections/BlogSection"
import { ContactSection } from "./sections/ContactSection"

async function PortfolioContent() {
  return (
    <>
        <HeroSection />
        <AboutSection />
        {/* <TestimonialsSection /> */}
        <SkillsSection />
        <ExperienceSection />
        <EducationSection />
        <ProjectsSection />
        <CertificationsSection />
        <AchievementsSection />
        <ServicesSection />
        <BlogSection />
        <ContactSection />
    </>
);
}

export default PortfolioContent;
