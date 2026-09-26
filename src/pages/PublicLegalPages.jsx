import React from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  CssBaseline,
  Divider,
  Paper,
  Stack,
  Toolbar,
  Typography
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

const companyName = "Kahan Technologies Pvt Ltd";
const effectiveDate = "23 September 2026";

function LegalLayout({ title, subtitle, children }) {
  return (
    <Box sx={{ bgcolor: "#f7f9fc", color: "#111827", minHeight: "100vh" }}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#fff", color: "#111827", borderBottom: "1px solid #e5e7eb" }}>
        <Toolbar sx={{ minHeight: 72 }}>
          <Typography component={RouterLink} to="/" sx={{ flexGrow: 1, textDecoration: "none", color: "inherit", fontWeight: 900, fontSize: 20 }}>
            {companyName}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button component={RouterLink} to="/privacy-policy" variant={title === "Privacy Policy" ? "contained" : "outlined"}>Privacy Policy</Button>
            <Button component={RouterLink} to="/terms-of-service" variant={title === "Terms of Service" ? "contained" : "outlined"}>Terms</Button>
            <Button component={RouterLink} to="/" variant="text">Home</Button>
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 7 } }}>
        <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3, border: "1px solid #e2e8f0" }}>
          <Typography variant="overline" sx={{ color: "#2563eb", fontWeight: 900 }}>Legal</Typography>
          <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: 0, mb: 1 }}>{title}</Typography>
          <Typography sx={{ color: "#64748b", mb: 2 }}>{subtitle}</Typography>
          <Typography sx={{ color: "#475569", mb: 3 }}>Effective date: {effectiveDate}</Typography>
          <Divider sx={{ mb: 4 }} />
          {children}
        </Paper>
      </Container>
    </Box>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 900, mb: 1 }}>{title}</Typography>
      <Typography component="div" sx={{ color: "#334155", lineHeight: 1.75 }}>{children}</Typography>
    </Box>
  );
}

export function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" subtitle="How we collect, use, protect and manage information when you use our services.">
      <Section title="1. Introduction">
        This Privacy Policy explains how {companyName} collects, uses, stores, shares and protects personal information in connection with its websites, portals, ERP, LMS, CRM, examination, payment, AI and related digital services.
      </Section>
      <Section title="2. Information We Collect">
        We may collect account information, contact details, institution details, student and staff records, academic information, payment records, support tickets, uploaded files, usage logs, device information, browser data and communications submitted through our platform. Where enabled by an institution, we may also process attendance, examination, HR, placement, alumni, transport, hostel and workflow records.
      </Section>
      <Section title="3. How We Use Information">
        We use information to provide and operate the platform, authenticate users, maintain records, process workflows, generate reports, support payments, send notifications, improve services, troubleshoot issues, meet legal obligations, prevent misuse and provide customer support.
      </Section>
      <Section title="4. Institution-Controlled Data">
        Many records are uploaded, configured or managed by institutions using our platform. For such information, the institution is generally the data controller or primary decision-maker, and {companyName} acts as a service provider or processor according to the institution's instructions.
      </Section>
      <Section title="5. AI Features">
        Some services may use AI models for tasks such as content generation, validation, summaries, recommendations, ticket assistance, document analysis and reporting. Users should review AI outputs before relying on them for official decisions. Institutions are responsible for deciding what information may be submitted to AI features.
      </Section>
      <Section title="6. Files and Uploads">
        Documents, images, certificates, reports and other uploaded files may be stored using cloud storage or configured storage services. Uploaded files are used for the purpose for which they were submitted and for related audit, reporting or workflow requirements.
      </Section>
      <Section title="7. Cookies and Similar Technologies">
        We may use cookies, local storage and similar technologies for login sessions, preferences, security, analytics and platform functionality. Users may adjust browser settings, but disabling some storage features may affect service functionality.
      </Section>
      <Section title="8. Sharing of Information">
        We do not sell personal information. We may share information with authorized institution users, service providers, cloud infrastructure providers, payment processors, email/SMS providers, analytics providers, legal authorities where required, and others where necessary to provide the services or comply with law.
      </Section>
      <Section title="9. Security">
        We use reasonable administrative, technical and organizational measures to protect information. No system is completely secure, and users should keep passwords confidential, use authorized accounts only and promptly report suspected misuse.
      </Section>
      <Section title="10. Data Retention">
        We retain information for as long as required to provide services, meet contractual obligations, maintain academic or institutional records, resolve disputes, enforce agreements and comply with legal requirements. Institutions may request deletion or export subject to contract and law.
      </Section>
      <Section title="11. User Rights">
        Depending on applicable law and institutional policy, users may request access, correction, deletion, restriction or export of their personal information. Requests involving institution-managed records may be routed to the concerned institution.
      </Section>
      <Section title="12. Children's and Student Data">
        Student data may be processed only as authorized by the institution, parent/guardian, student or applicable law. Institutions are responsible for obtaining required consents for use of student records on the platform.
      </Section>
      <Section title="13. International Processing">
        Information may be processed or stored in India or other locations where our service providers operate. By using the services, users acknowledge that data may be transferred and processed in such locations subject to applicable safeguards.
      </Section>
      <Section title="14. Changes to This Policy">
        We may update this Privacy Policy from time to time. The updated version will be posted on this page with a revised effective date. Continued use of the services after changes means the updated policy applies.
      </Section>
      <Section title="15. Contact">
        For privacy questions or requests, contact {companyName} through the official support channel provided by your institution or by email at support@campus.technology.
      </Section>
    </LegalLayout>
  );
}

export function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" subtitle="Terms governing access to and use of our websites, applications and digital services.">
      <Section title="1. Agreement">
        These Terms of Service govern use of websites, applications, portals, ERP, LMS, CRM, examination, AI, payment and related services provided by {companyName}. By accessing or using the services, you agree to these terms.
      </Section>
      <Section title="2. Eligibility and Accounts">
        Users must be authorized by an institution or by {companyName} to access the services. Users are responsible for maintaining the confidentiality of their login credentials and for all activity under their accounts.
      </Section>
      <Section title="3. Acceptable Use">
        Users must not misuse the services, attempt unauthorized access, disrupt systems, upload malicious content, infringe intellectual property, violate privacy, bypass security controls or use the platform for unlawful purposes.
      </Section>
      <Section title="4. Institution Responsibilities">
        Institutions are responsible for configuring users, roles, permissions, workflows, records, policies, fee rules, academic data and approvals. Institutions must ensure that information uploaded to the platform is accurate and lawfully processed.
      </Section>
      <Section title="5. User Content and Data">
        Users and institutions retain ownership of their submitted content and data. By submitting content, users authorize {companyName} to host, process, transmit, display and use it as necessary to provide the services.
      </Section>
      <Section title="6. AI and Automation">
        AI and automation features may assist with analysis, generation, validation, recommendations and workflow processing. Outputs may be incomplete or inaccurate and must be reviewed by authorized users before official use.
      </Section>
      <Section title="7. Payments">
        Where payment features are used, payments may be processed through third-party gateways or banking partners. Fees, refunds, settlements and disputes are subject to the applicable institution policy and payment provider terms.
      </Section>
      <Section title="8. Third-Party Services">
        The services may integrate with cloud storage, payment gateways, email, SMS, AI providers, authentication providers and other third-party services. Use of those services may be subject to their separate terms and policies.
      </Section>
      <Section title="9. Intellectual Property">
        The software, design, workflows, documentation, trademarks and related intellectual property of the platform belong to {companyName} or its licensors. Users may not copy, reverse engineer, resell or misuse the platform except as permitted by contract.
      </Section>
      <Section title="10. Availability and Changes">
        We aim to provide reliable services, but availability may be affected by maintenance, updates, internet failures, third-party outages, security events or circumstances beyond our control. Features may be modified, added or discontinued.
      </Section>
      <Section title="11. Confidentiality">
        Users may access confidential academic, administrative, financial or personal information. Users must handle such information responsibly and only for authorized institutional purposes.
      </Section>
      <Section title="12. Suspension and Termination">
        Access may be suspended or terminated for unauthorized use, breach of these terms, non-payment, security concerns, institutional request, legal requirement or discontinuation of services.
      </Section>
      <Section title="13. Disclaimers">
        The services are provided on an as-is and as-available basis to the extent permitted by law. We do not guarantee that all outputs, reports, AI responses, integrations or workflows will be error-free or suitable for every purpose.
      </Section>
      <Section title="14. Limitation of Liability">
        To the maximum extent permitted by law, {companyName} will not be liable for indirect, incidental, special, consequential or punitive damages, loss of profits, loss of data, business interruption or unauthorized access caused by factors outside reasonable control.
      </Section>
      <Section title="15. Governing Law">
        These terms are governed by the laws of India, unless a separate written agreement states otherwise. Courts with appropriate jurisdiction in India will handle disputes, subject to any contractual dispute resolution process.
      </Section>
      <Section title="16. Contact">
        Questions about these terms may be sent to support@campus.technology or through the official support process provided to your institution.
      </Section>
    </LegalLayout>
  );
}
