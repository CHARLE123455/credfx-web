import { FLAGS, NAMES } from "../lib/currencies";

export const Logo = ({ large }: { large?: boolean }) => (
  <div style={{ display:"flex",alignItems:"center",gap:9 }}>
    <div style={{ width:large?42:34,height:large?42:34,background:"linear-gradient(135deg,#1040A0,#E85D04)",borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center" }}>
      <span style={{ color:"white",fontFamily:"Syne,sans-serif",fontWeight:800,fontSize:large?17:13 }}>FX</span>
    </div>
    <span style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:large?23:17,color:"#E8EDF5" }}>
      Cred<span style={{ color:"#E85D04" }}>FX</span>
    </span>
  </div>
);

export const Spinner = () => <span className="cf-spin" />;

export const Toast = ({ msg, type, onClose }: { msg: string; type: string; onClose: () => void }) => (
  <div style={{ position:"fixed",top:22,right:22,zIndex:999,background:type==="error"?"#1C0808":"#08181A",border:`1px solid ${type==="error"?"rgba(255,112,112,0.25)":"rgba(78,201,138,0.25)"}`,color:type==="error"?"#FF7070":"#4EC98A",padding:"12px 18px",borderRadius:11,fontSize:13,fontWeight:500,display:"flex",alignItems:"center",gap:10,maxWidth:340,animation:"fadeUp 0.25s ease" }}>
    <span style={{ fontSize:15 }}>{type==="error"?"⚠":"✓"}</span>
    <span style={{ flex:1 }}>{msg}</span>
    <button onClick={onClose} style={{ background:"none",border:"none",cursor:"pointer",color:"inherit",fontSize:16,lineHeight:1 }}>✕</button>
  </div>
);

export const CloseBtn = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} style={{ background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",fontSize:20,lineHeight:1,padding:2 }}>✕</button>
);

export const Modal = ({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="cf-backdrop" onClick={onClose}>
    <div className="cf-modal cf-fade" onClick={e=>e.stopPropagation()}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22 }}>
        <div><h3 style={{ fontSize:19,fontWeight:700 }}>{title}</h3><p style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{subtitle}</p></div>
        <CloseBtn onClick={onClose} />
      </div>
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>{children}</div>
    </div>
  </div>
);

export const Field = ({ id, label, children }: { id: string; label: React.ReactNode; children: React.ReactNode }) => (
  <div><label className="cf-label" htmlFor={id}>{label}</label>{children}</div>
);

export const CurrencySelect = ({ id, ariaLabel, value, onChange, showName, style }: {
  id: string;
  ariaLabel: string;
  value: string;
  onChange: (currency: string) => void;
  showName?: boolean;
  style?: React.CSSProperties;
}) => (
  <select id={id} aria-label={ariaLabel} className="cf-input" value={value} onChange={e=>onChange(e.target.value)} style={{ cursor:"pointer",...style }}>
    {Object.entries(FLAGS).map(([c,f])=><option key={c} value={c}>{f} {c}{showName?` — ${NAMES[c]}`:""}</option>)}
  </select>
);

export const SubmitButton = ({ loading, disabled, onClick, children }: {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button className="cf-btn cf-btn-primary" style={{ width:"100%",justifyContent:"center",marginTop:6 }} onClick={onClick} disabled={loading||disabled}>
    {loading ? <Spinner /> : children}
  </button>
);

export const PageHeader = ({ title, subtitle, actions }: { title: string; subtitle: React.ReactNode; actions?: React.ReactNode }) => (
  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,flexWrap:"wrap",gap:12 }}>
    <div>
      <h1 style={{ fontSize:25,fontWeight:700 }}>{title}</h1>
      <p style={{ color:"rgba(255,255,255,0.38)",marginTop:4,fontSize:13.5 }}>{subtitle}</p>
    </div>
    {actions}
  </div>
);

export const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <h4 style={{ fontSize:11,color:"rgba(255,255,255,0.35)",letterSpacing:0.7,textTransform:"uppercase",marginBottom:13 }}>{children}</h4>
);

const TYPE_VARIANTS: Record<string, string> = { FUNDING:"success",CONVERSION:"warning",TRADE:"danger" };
const TYPE_ICONS: Record<string, string> = { FUNDING:"↓",CONVERSION:"⇄",TRADE:"↗" };

export const TypeBadge = ({ type, icon }: { type: string; icon?: boolean }) => (
  <span className={`cf-badge cf-badge-${TYPE_VARIANTS[type]??"info"}`}>{icon?`${TYPE_ICONS[type]??""} `:""}{type}</span>
);

export const StatusBadge = ({ status }: { status: string }) => (
  <span className={`cf-badge cf-badge-${status==="SUCCESS"?"success":"danger"}`}>{status}</span>
);

export const LoadingState = ({ padding = 48 }: { padding?: number }) => (
  <div style={{ textAlign:"center",padding }}><Spinner /></div>
);

export const EmptyState = ({ children, padding = 40 }: { children: React.ReactNode; padding?: number }) => (
  <div className="cf-card" style={{ textAlign:"center",padding,color:"rgba(255,255,255,0.28)",fontSize:14 }}>{children}</div>
);
