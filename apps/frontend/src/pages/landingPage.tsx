import { Link } from "react-router-dom";
import { APP_ROUTES } from "../constants/appRoutes";
import {
  ArrowRight,
  Building2,
  Calendar,
  CheckCircle,
  ClipboardList,
  HeartPulse,
  Lock,
  Pill,
  ShieldAlert,
  Stethoscope,
  Users,
} from "lucide-react";

const featureCards = [
  {
    icon: Users,
    title: "Resident 360°",
    description:
      "Comprehensive resident profiles, admission status, care level classifications, and emergency contacts in one unified view.",
  },
  {
    icon: ClipboardList,
    title: "Care Plan",
    description:
      "Monitor health conditions, individualized treatment goals, scheduled interventions, and daily observation records.",
  },
  {
    icon: Pill,
    title: "eMAR Medicine",
    description:
      "Streamline electronic medication administration, dose tracking, safety verification alerts, and allergy safeguards.",
  },
  {
    icon: Calendar,
    title: "Doctor Schedule",
    description:
      "Manage physician shifts, specialist rounds, clinical appointments, and facility resource allocations.",
  },
];

const workflowSteps = [
  "Resident Intake",
  "Assessment",
  "Care Planning",
  "Medication Record",
  "Family & Compliance",
];

const stats = [
  { value: "24/7", label: "care visibility" },
  { value: "5+", label: "core modules" },
  { value: "HIPAA", label: "ready mindset" },
];

const roleCards = [
  {
    title: "Administrator",
    description: "Facility operations overview, resident roster, staffing schedules, compliance reports, and RBAC governance.",
  },
  {
    title: "Nurse / Care Staff",
    description: "Real-time care updates, medication administration, observations, incident alerts, and resident condition tracking.",
  },
  {
    title: "Doctor / Physician",
    description: "Clinical encounter logs, treatment orders, progress evaluations, and multidisciplinary care plan authorizations.",
  },
];

export function LandingPage() {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Landing navigation">
        <Link className="landing-brand" to={APP_ROUTES.LANDING}>
          <span className="landing-brand__icon">
            <HeartPulse size={24} />
          </span>
          <span>
            <strong>WellNest</strong>
            <small>Nursing Home Management</small>
          </span>
        </Link>

        <div className="landing-nav__links">
          <a href="#features">Features</a>
          <a href="#workflow">Workflow</a>
          <a href="#roles">Roles</a>
        </div>

        <div className="landing-nav__actions">
          <Link className="landing-nav__login" to={APP_ROUTES.LOGIN}>
            Login
          </Link>
          <Link className="landing-nav__signup" to={APP_ROUTES.REGISTER}>
            Register
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero__content">
          <span className="landing-eyebrow">
            <ShieldAlert size={16} />
            Modern care operations platform
          </span>

          <h1>
            Intelligent, Safe, and Seamless Nursing Home Management.
          </h1>

          <p>
            WellNest provides a modern, healthcare-first operations platform designed for long-term care facilities, assisted living, and skilled nursing homes.
          </p>

          <div className="landing-hero__actions">
            <Link className="landing-primary-btn" to={APP_ROUTES.LOGIN}>
              Sign In to System
              <ArrowRight size={18} />
            </Link>
            <Link className="landing-secondary-btn" to={APP_ROUTES.DASHBOARD}>
              Explore Demo Dashboard
            </Link>
          </div>

          <div className="landing-stats" aria-label="Platform highlights">
            {stats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-hero__visual" aria-label="Dashboard preview">
          <div className="landing-dashboard-card landing-dashboard-card--main">
            <div className="landing-card-header">
              <div>
                <span>Today overview</span>
                <strong>Resident Care Command</strong>
              </div>
              <span className="landing-live-pill">Live</span>
            </div>

            <div className="landing-care-row landing-care-row--active">
              <span>
                <Users size={18} />
              </span>
              <div>
                <strong>128 residents</strong>
                <small>12 pending assessments</small>
              </div>
              <b>+8%</b>
            </div>

            <div className="landing-care-row">
              <span>
                <Pill size={18} />
              </span>
              <div>
                <strong>Medication rounds</strong>
                <small>34 scheduled today</small>
              </div>
              <b>92%</b>
            </div>

            <div className="landing-care-row">
              <span>
                <Calendar size={18} />
              </span>
              <div>
                <strong>Doctor visits</strong>
                <small>7 appointments</small>
              </div>
              <b>On track</b>
            </div>

            <div className="landing-progress-panel">
              <div>
                <span>Care plan completion</span>
                <strong>84%</strong>
              </div>
              <div className="landing-progress-track">
                <span />
              </div>
            </div>
          </div>

          <div className="landing-floating-card landing-floating-card--top">
            <Lock size={17} />
            <span>Secure role-based access</span>
          </div>

          <div className="landing-floating-card landing-floating-card--bottom">
            <CheckCircle size={17} />
            <span>Daily care tasks synced</span>
          </div>
        </div>
      </section>

      <section className="landing-section" id="features">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">Core modules</span>
          <h2>Integrated modules engineered for patient-first care</h2>
          <p>
            Everything your clinical and administrative teams need to deliver quality care, ensure regulatory compliance, and optimize operations.
          </p>
        </div>

        <div className="landing-feature-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="landing-feature-card" key={feature.title}>
                <span>
                  <Icon size={24} />
                </span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-workflow" id="workflow">
        <div>
          <span className="landing-eyebrow">Simple workflow</span>
          <h2>Streamlined clinical lifecycle from intake to continuous care</h2>
          <p>
            A standardized, transparent progression that keeps interdisciplinary teams aligned and family members informed.
          </p>
        </div>

        <div className="landing-workflow__steps">
          {workflowSteps.map((step, index) => (
            <div className="landing-step" key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-section--roles" id="roles">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">Role-based access</span>
          <h2>Tailored workspaces for every member of the care team</h2>
        </div>

        <div className="landing-role-grid">
          {roleCards.map((role) => (
            <article className="landing-role-card" key={role.title}>
              <div className="landing-role-card__icon">
                <Building2 size={22} />
              </div>
              <h3>{role.title}</h3>
              <p>{role.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div>
          <span className="landing-eyebrow">Ready to get started</span>
          <h2>Experience Modern Care Management with WellNest</h2>
          <p>
            Sign in to access your assigned care portal or explore the live interactive demo dashboard.
          </p>
        </div>
        <div className="landing-cta__actions">
          <Link className="landing-primary-btn" to={APP_ROUTES.LOGIN}>
            Sign In
            <ArrowRight size={18} />
          </Link>
          <Link className="landing-secondary-btn landing-secondary-btn--light" to={APP_ROUTES.DASHBOARD}>
            View Live Demo
          </Link>
        </div>
      </section>
    </main>
  );
}
