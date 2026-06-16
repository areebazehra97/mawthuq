import { createBrowserRouter } from "react-router-dom";
import { PageShell } from "@/components/page-shell";
import { AiExtractionPage } from "@/pages/ai-extraction-page";
import { ApprovedVendorListPage } from "@/pages/approved-vendor-list-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { EcosystemFitPage } from "@/pages/ecosystem-fit-page";
import { EvalsLabPage } from "@/pages/evals-lab-page";
import { HumanReviewPage } from "@/pages/human-review-page";
import { PackageSetupPage } from "@/pages/package-setup-page";
import { ResearchPage } from "@/pages/research-page";
import { ScorecardPage } from "@/pages/scorecard-page";
import { VendorIntakePage } from "@/pages/vendor-intake-page";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <PageShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "package-setup", element: <PackageSetupPage /> },
      { path: "vendor-intake", element: <VendorIntakePage /> },
      { path: "ai-extraction", element: <AiExtractionPage /> },
      { path: "scorecard", element: <ScorecardPage /> },
      { path: "human-review", element: <HumanReviewPage /> },
      { path: "approved-vendor-list", element: <ApprovedVendorListPage /> },
      { path: "evals-lab", element: <EvalsLabPage /> },
      { path: "ecosystem-fit", element: <EcosystemFitPage /> },
      { path: "research", element: <ResearchPage /> },
    ],
  },
]);
