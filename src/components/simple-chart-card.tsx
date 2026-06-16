import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartDatum {
  label: string;
  value: number;
  color: string;
}

interface SimpleChartCardProps {
  title: string;
  description: string;
  data: ChartDatum[];
}

export function SimpleChartCard({
  title,
  description,
  data,
}: SimpleChartCardProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex h-4 overflow-hidden rounded-full bg-slate-200">
          {data.map((item) => (
            <div
              key={item.label}
              className={item.color}
              style={{ width: `${total === 0 ? 0 : (item.value / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="space-y-3">
          {data.map((item) => {
            const percent = total === 0 ? 0 : Math.round((item.value / total) * 100);
            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="font-medium text-slate-900">{item.label}</span>
                  </div>
                  <div className="text-slate-500">
                    {item.value} <span className="ml-1 text-xs">{percent}%</span>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
