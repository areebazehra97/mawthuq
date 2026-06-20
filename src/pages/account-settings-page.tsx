import { Globe2, ShieldCheck, UserCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/section-header";

export function AccountSettingsPage() {
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Preferences"
        title="Account Settings"
        description="Demo account details, display preferences, and review posture settings for Mawthūq walkthroughs."
      />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle2 className="h-4 w-4 text-muted-foreground" />
              Profile
            </CardTitle>
            <CardDescription>Active presenter account details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SettingRow label="Name" value="Fatima Al-Harbi" />
            <SettingRow label="Role" value="Procurement Director" />
            <SettingRow label="Email" value="fatima@whitehelmet.app" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              Workspace
            </CardTitle>
            <CardDescription>Current interface and demo preferences.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SettingRow label="Language" value="English" />
            <SettingRow label="Region" value="Saudi Arabia" />
            <SettingRow label="Mode" value="Production Demo" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              Governance
            </CardTitle>
            <CardDescription>Decision and audit defaults used in the demo environment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <SettingRow label="Decision logging" value="Enabled" />
            <SettingRow label="Review traceability" value="Enabled" />
            <SettingRow label="Demo reset access" value="Allowed" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-3 py-2.5">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
