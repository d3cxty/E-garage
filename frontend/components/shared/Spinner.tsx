export default function Spinner({
  size = 'md',
  variant = 'brand',
  label = 'Loading…',
  className = ''
}:{
  size?: 'xs'|'sm'|'md'|'lg'|'xl';
  variant?: 'brand'|'neutral'|'inverted';
  label?: string;
  className?: string;
}){
  const sizeCls: Record<string,string> = {
    xs: 'h-4 w-4',
    sm: 'h-5 w-5',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-10 w-10',
  };
  const track: Record<string,string> = {
    brand: 'border-brand-500/20',
    neutral: 'border-slate-500/20',
    inverted: 'border-white/20',
  };
  const cap: Record<string,string> = {
    brand: 'border-brand-500',
    neutral: 'border-slate-300',
    inverted: 'border-white',
  };
  const s = sizeCls[size] || sizeCls.md;
  const trackColor = track[variant] || track.neutral;
  const capColor = cap[variant] || cap.neutral;

  return (
    <span role="status" aria-label={label} className={`relative inline-block ${s} ${className}`}>
      {/* track */}
      <span className={`absolute inset-0 rounded-full border-2 ${trackColor}`} />
      {/* animated cap */}
      <span className={`absolute inset-0 rounded-full border-2 border-t-transparent ${capColor} animate-spin motion-reduce:animate-none`} />
      <span className="sr-only">{label}</span>
    </span>
  );
}
