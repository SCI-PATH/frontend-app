import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  BookOpen,
  Bot,
  Gamepad2,
  GraduationCap,
  Lock,
  Scale,
  Shield,
  Sparkles,
  Users,
} from "lucide-react";

import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

export const TERMS_LAST_UPDATED = "28 August 2026";

export function TermsDocument({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn("space-y-3", compact ? "space-y-2.5" : "space-y-4")}>
      <TermsSection
        compact={compact}
        id="about"
        icon={Sparkles}
        accent="primary"
        title="1. About SCI-PATH"
      >
        <p>
          SCI-PATH (Science Pathway) is an educational platform for{" "}
          <strong>Grade 6–9 science</strong>. It brings together adaptive
          lessons, quizzes, a Socratic AI tutor (Socrates), a science farm game,
          and a teacher analytics dashboard.
        </p>
        <p>
          The platform is developed as a <strong>university research
          project</strong> to study personalised science learning. It is an
          educational support tool — not a commercial product, not an official
          exam board, and not a replacement for your school science teacher.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="who"
        icon={GraduationCap}
        accent="special"
        title="2. Who can use it"
      >
        <p>SCI-PATH is for:</p>
        <ul>
          <li>
            <strong>Students</strong> in Grades 6–9 who join with a class code
            from their teacher (or as invited by their school).
          </li>
          <li>
            <strong>Educators</strong> who create classes, assign science
            content, and review classroom analytics.
          </li>
        </ul>
        <p>
          If you are under 18, a parent, guardian, or school should know you are
          using SCI-PATH. Teachers are expected to use the platform only with
          learners they are responsible for.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="account"
        icon={Lock}
        accent="accent"
        title="3. Your account"
      >
        <ul>
          <li>
            Give accurate details when you sign up (name, email, grade or school).
          </li>
          <li>Keep your password private. Do not share login details.</li>
          <li>
            You are responsible for activity that happens on your account.
          </li>
          <li>
            We may suspend an account that is used unsafely, dishonestly, or to
            disrupt other learners.
          </li>
        </ul>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="learning"
        icon={BookOpen}
        accent="secondary"
        title="4. Lessons, quizzes, and games"
      >
        <p>
          Lessons follow the Grade 6–9 science curriculum. Quizzes from the
          assessment engine are the <strong>official evidence</strong> of what
          you know: they update mastery (BKT) on your profile and the teacher
          dashboard.
        </p>
        <p>
          The Discovery Grove farm game is practice and motivation. Farm
          frustration scores may change how Socrates <em>speaks</em> to you. They
          do <strong>not</strong> change your mastery grade.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="socrates"
        icon={Bot}
        accent="special"
        title="5. Socrates, the AI tutor"
      >
        <p>
          Socrates is designed to hint and ask questions — not to dump full
          answers. It uses retrieved syllabus notes plus a language model. That
          means:
        </p>
        <ul>
          <li>Hints can still be imperfect or occasionally off-topic.</li>
          <li>
            Chat is a coaching aid. It does not replace textbooks, classwork, or
            your teacher.
          </li>
          <li>
            By default, chatting with Socrates does <strong>not</strong> update
            BKT mastery. Quizzes do.
          </li>
          <li>
            Do not type personal secrets, home addresses, or information about
            other students into the chat.
          </li>
        </ul>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="data"
        icon={BarChart3}
        accent="primary"
        title="6. What we record"
      >
        <p>
          To personalise learning and help teachers, SCI-PATH stores educational
          data linked to your account, including:
        </p>
        <ul>
          <li>Account details (name, email, grade, class enrolment).</li>
          <li>Lesson progress and generated lesson content you open.</li>
          <li>
            Quiz attempts, correctness, and skill mastery estimates (BKT).
          </li>
          <li>
            Tutor turns (enough to support teaching analytics — the student chat
            is not shown as a full transcript on the teacher dashboard).
          </li>
          <li>
            Optional game engagement data, including a per-student frustration
            score used only to soften tutor tone.
          </li>
        </ul>
        <p>
          We use this data to run {APP_NAME}, show teachers class insights, and
          support the research study. We do not sell your data. Do not upload
          content you do not have the right to share.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="teachers"
        icon={Users}
        accent="accent"
        title="7. Teachers and classrooms"
      >
        <p>
          Teachers see a class-scoped view: who is enrolled, quiz mastery across
          skills, at-risk flags, and research cards such as frustration and
          common misconceptions.
        </p>
        <p>
          Those alerts are <strong>decision support</strong>. They recommend
          human follow-up. They do not automatically fail, message, or lock a
          child. Mastery is a model estimate, not a high-stakes exam mark.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="conduct"
        icon={Gamepad2}
        accent="secondary"
        title="8. How to use SCI-PATH"
      >
        <p>Please:</p>
        <ul>
          <li>Use the platform for science learning, not to harass anyone.</li>
          <li>Do not try to break, scrape, or overload the services.</li>
          <li>
            Do not treat quizzes as something to game with outside help in a way
            that misrepresents what you know — teachers rely on this evidence.
          </li>
          <li>
            Respect other students’ privacy if you glimpse names in a class or
            leaderboard.
          </li>
        </ul>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="research"
        icon={Shield}
        accent="primary"
        title="9. Research use"
      >
        <p>
          SCI-PATH is part of an academic research project on adaptive science
          learning, knowledge tracing, and AI tutoring. De-identified or
          aggregated learning traces may be used in reports, papers, and
          evaluations (for example mastery model accuracy). Individual students
          will not be named in public research outputs.
        </p>
      </TermsSection>

      <TermsSection
        compact={compact}
        id="disclaimer"
        icon={Scale}
        accent="accent"
        title="10. Important limits"
      >
        <ul>
          <li>
            SCI-PATH is provided <strong>“as is”</strong> for education and
            research. Features may change, and services can be offline.
          </li>
          <li>
            Curriculum materials are for learning. Official syllabuses remain
            the property of their publishers / the Ministry of Education.
          </li>
          <li>
            We are not liable for exam results, school decisions, or harm from
            relying solely on AI hints.
          </li>
          <li>
            We may update these terms. The date at the top of this page is the
            current version. Continued use after an update means you accept the
            new terms.
          </li>
        </ul>
        <p className="rounded-xl border border-brand-primary/20 bg-brand-primary/5 px-4 py-3 text-sm">
          Questions about accounts or this research platform? Ask your teacher
          first, or contact the SCI-PATH project team through your school.
        </p>
      </TermsSection>
    </div>
  );
}

function TermsSection({
  id,
  icon: Icon,
  accent,
  title,
  children,
  compact,
}: {
  id: string;
  icon: LucideIcon;
  accent: "primary" | "secondary" | "accent" | "special";
  title: string;
  children: ReactNode;
  compact?: boolean;
}) {
  const iconWrap = {
    primary: "bg-brand-primary/12 text-brand-primary",
    secondary: "bg-brand-secondary/20 text-brand-text",
    accent: "bg-brand-accent/12 text-brand-accent",
    special: "bg-brand-special/12 text-brand-special",
  }[accent];

  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-6 rounded-2xl border border-brand-surface bg-white",
        compact ? "p-3.5 sm:p-4" : "p-5 shadow-sm sm:p-7"
      )}
    >
      <div className={cn("mb-3 flex items-start gap-3", compact && "mb-2")}>
        <span
          className={cn(
            "flex shrink-0 items-center justify-center rounded-2xl",
            compact ? "size-9" : "size-11",
            iconWrap
          )}
        >
          <Icon className={compact ? "size-4" : "size-5"} aria-hidden />
        </span>
        <h2
          className={cn(
            "font-semibold text-brand-text",
            compact ? "pt-1.5 text-base" : "pt-2 text-lg sm:text-xl"
          )}
        >
          {title}
        </h2>
      </div>
      <div className="space-y-2.5 text-sm leading-relaxed text-brand-text/75 [&_li]:ml-4 [&_li]:list-disc [&_li]:marker:text-brand-primary [&_p]:text-brand-text/75 [&_strong]:font-semibold [&_strong]:text-brand-text [&_ul]:space-y-1.5">
        {children}
      </div>
    </section>
  );
}
