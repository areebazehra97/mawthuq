import { createBrowserRouter } from "react-router-dom";
import { AccountSettingsPage } from "@/pages/account-settings-page";
import { ActivityLogPage } from "@/pages/activity-log-page";
import { PageShell } from "@/components/page-shell";
import { PublicLayout } from "@/components/public-layout";
import { AiExtractionPage } from "@/pages/ai-extraction-page";
import { AnalyticsPage } from "@/pages/analytics-page";
import { ApprovedVendorListPage } from "@/pages/approved-vendor-list-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { HumanReviewPage } from "@/pages/human-review-page";
import { PackageSetupPage } from "@/pages/package-setup-page";
import { ProjectSetupPage } from "@/pages/project-setup-page";
import { ProjectsPage } from "@/pages/projects-page";
import { ScorecardPage } from "@/pages/scorecard-page";
import { VendorIntakePage } from "@/pages/vendor-intake-page";
import { VendorInvitationsPage } from "@/pages/vendor-invitations-page";
import { VendorMasterPage } from "@/pages/vendor-master-page";
import { VendorProfilePage } from "@/pages/vendor-profile-page";
import { VendorRegistrationPage } from "@/pages/vendor-registration-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PageShell />,
    children: [
      { index: true,                       element: <DashboardPage /> },
      { path: "analytics",                 element: <AnalyticsPage /> },
      { path: "activity-log",              element: <ActivityLogPage /> },
      { path: "account-settings",          element: <AccountSettingsPage /> },
      { path: "projects",                  element: <ProjectsPage /> },
      { path: "projects/:projectId",       element: <VendorIntakePage /> },
      { path: "vendors",                   element: <VendorMasterPage /> },
      { path: "vendors/:vendorId",         element: <VendorProfilePage /> },
      { path: "project-setup",             element: <ProjectSetupPage /> },
      { path: "package-setup",             element: <PackageSetupPage /> },
      { path: "vendor-invitations",        element: <VendorInvitationsPage /> },
      { path: "vendor-intake",             element: <ProjectsPage /> },
      { path: "ai-extraction",             element: <AiExtractionPage /> },
      { path: "scorecard",                 element: <ScorecardPage /> },
      { path: "human-review",             element: <HumanReviewPage /> },
      { path: "approved-vendor-list",      element: <ApprovedVendorListPage /> },
    ],
  },
  {
    path: "/register",
    element: <PublicLayout />,
    children: [
      { path: ":token", element: <VendorRegistrationPage /> },
    ],
  },
]);
