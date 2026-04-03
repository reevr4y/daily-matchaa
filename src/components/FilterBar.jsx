const FILTERS = [
  { key: 'daily',   label: 'Hari Ini' },
  { key: 'weekly',  label: '7 Hari' },
  { key: 'monthly', label: '30 Hari' },
];

export default function FilterBar({ active, onChange }) {
  return (
    <div className="flex items-center gap-2 flex-1">
      {FILTERS.map(f => (
        <button
          key={f.key}
          className={`filter-pill ${active === f.key ? 'active' : ''}`}
          onClick={() => onChange(f.key)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
