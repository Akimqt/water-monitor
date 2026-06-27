export default function PageTitle({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="mt-3 text-sm text-text-secondary">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
