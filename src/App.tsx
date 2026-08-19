import { useCallback, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "./lib/api";
import type { AdminUsers, AnalyticsData, RatesData, TransactionList, UserProfile, WalletData } from "./lib/types";
import { FLAGS, NAMES } from "./lib/currencies";
import { formatDate, formatDateTime, formatRate } from "./lib/format";
import { injectStyles } from "./styles";
import { useToast } from "./hooks/useToast";
import { useFormAction } from "./hooks/useFormAction";
import {
  CurrencySelect,
  EmptyState,
  Field,
  LoadingState,
  Logo,
  Modal,
  PageHeader,
  SectionTitle,
  Spinner,
  StatusBadge,
  SubmitButton,
  Toast,
  TypeBadge,
} from "./components/ui";

const AuthPage = ({ onLogin }: { onLogin: (user: UserProfile) => void }) => {
  const [view, setView] = useState<"login"|"register"|"otp">("login");
  const { loading, error, success, setError, setSuccess, run } = useFormAction();
  const [f, setF] = useState({ email:"",password:"",firstName:"",lastName:"",otp:"" });
  const [pendingEmail, setPendingEmail] = useState("");
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  const clear = () => { setError(""); setSuccess(""); };

  const doRegister = () => run(async () => {
    const res = await api.post("/auth/register", { email:f.email,password:f.password,firstName:f.firstName,lastName:f.lastName });
    setPendingEmail(f.email);
    setSuccess((res.data as { message?: string })?.message ?? res.message ?? "OTP sent!");
    setTimeout(() => { setView("otp"); setSuccess(""); }, 1200);
  });

  const doVerify = () => run(async () => {
    await api.post("/auth/verify", { email:pendingEmail, otp:f.otp });
    setSuccess("Verified! Redirecting to login…");
    setTimeout(() => { setView("login"); setSuccess(""); }, 1400);
  });

  const doLogin = () => run(async () => {
    const res = await api.post("/auth/login", { email:f.email, password:f.password });
    const data = res.data as { accessToken: string; user: UserProfile };
    setToken(data.accessToken);
    onLogin(data.user);
  });

  const doResend = () => run(async () => {
    await api.post("/auth/resend-otp", { email:pendingEmail });
    setSuccess("New OTP sent!");
  });

  const link: React.CSSProperties = { color:"#E85D04",cursor:"pointer",fontWeight:500 };

  return (
    <div className="credfx" style={{ display:"flex",minHeight:"100vh" }}>
      <div style={{ flex:1,background:"linear-gradient(155deg,#0B1E4F 0%,#070F24 55%,#180900 100%)",padding:"48px 52px",display:"flex",flexDirection:"column",justifyContent:"space-between",position:"relative",overflow:"hidden" }}>
        <Logo large />
        <div>
          <h1 style={{ fontFamily:"Syne,sans-serif",fontSize:52,fontWeight:800,lineHeight:1.08,color:"#E8EDF5",marginBottom:18 }}>
            Trade currencies<br /><span style={{ color:"#E85D04" }}>at real rates.</span>
          </h1>
          <p style={{ color:"rgba(255,255,255,0.42)",fontSize:16,lineHeight:1.65,maxWidth:380 }}>Fund your wallet, convert NGN to any major currency, and execute trades at live FX rates.</p>
          <div style={{ display:"flex",gap:36,marginTop:52 }}>
            {([["10+","Currencies"],["0.5%","Trade Fee"],["Live","FX Rates"]] as [string,string][]).map(([v,l]) => (
              <div key={l}>
                <div style={{ fontFamily:"Syne,sans-serif",fontSize:24,fontWeight:700,color:"#E85D04" }}>{v}</div>
                <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:3 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ background:"linear-gradient(135deg,#1040A0,#0B1E4F)",borderRadius:18,padding:"26px 28px",border:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:2,marginBottom:14,textTransform:"uppercase" }}>CredFX Multi-Currency Wallet</div>
          <div style={{ fontFamily:"Syne,sans-serif",fontSize:30,fontWeight:700,color:"white" }}>₦1,000.00</div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:4 }}>Starting NGN Balance</div>
        </div>
      </div>

      <div style={{ width:460,padding:"52px 44px",display:"flex",flexDirection:"column",justifyContent:"center",background:"#07101F" }}>
        {view === "login" && (
          <div className="cf-fade" key="login">
            <h2 style={{ fontFamily:"Syne,sans-serif",fontSize:27,fontWeight:700,marginBottom:7 }}>Welcome back</h2>
            <p style={{ color:"rgba(255,255,255,0.38)",marginBottom:30,fontSize:14 }}>Sign in to your CredFX account</p>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <Field id="login-email" label="Email address"><input id="login-email" className="cf-input" type="email" placeholder="you@example.com" value={f.email} onChange={set("email")} onKeyDown={e=>e.key==="Enter"&&void doLogin()} /></Field>
              <Field id="login-pw" label="Password"><input id="login-pw" className="cf-input" type="password" placeholder="••••••••" value={f.password} onChange={set("password")} onKeyDown={e=>e.key==="Enter"&&void doLogin()} /></Field>
              {error && <p className="cf-error">{error}</p>}
              <SubmitButton loading={loading} onClick={()=>void doLogin()}>Sign In</SubmitButton>
            </div>
            <p style={{ marginTop:22,fontSize:13.5,color:"rgba(255,255,255,0.35)",textAlign:"center" }}>
              No account? <span onClick={() => { setView("register"); clear(); }} style={link}>Create one</span>
            </p>
          </div>
        )}

        {view === "register" && (
          <div className="cf-fade" key="register">
            <h2 style={{ fontFamily:"Syne,sans-serif",fontSize:27,fontWeight:700,marginBottom:7 }}>Create account</h2>
            <p style={{ color:"rgba(255,255,255,0.38)",marginBottom:30,fontSize:14 }}>Get started with CredFX today</p>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
                <Field id="reg-first" label="First name"><input id="reg-first" className="cf-input" placeholder="John" value={f.firstName} onChange={set("firstName")} /></Field>
                <Field id="reg-last" label="Last name"><input id="reg-last" className="cf-input" placeholder="Doe" value={f.lastName} onChange={set("lastName")} /></Field>
              </div>
              <Field id="reg-email" label="Email address"><input id="reg-email" className="cf-input" type="email" placeholder="you@example.com" value={f.email} onChange={set("email")} /></Field>
              <Field id="reg-pw" label="Password"><input id="reg-pw" className="cf-input" type="password" placeholder="Min. 8 characters" value={f.password} onChange={set("password")} /></Field>
              {error && <p className="cf-error">{error}</p>}
              {success && <p className="cf-success">{success}</p>}
              <SubmitButton loading={loading} onClick={()=>void doRegister()}>Create Account</SubmitButton>
            </div>
            <p style={{ marginTop:22,fontSize:13.5,color:"rgba(255,255,255,0.35)",textAlign:"center" }}>
              Have an account? <span onClick={() => { setView("login"); clear(); }} style={link}>Sign in</span>
            </p>
          </div>
        )}

        {view === "otp" && (
          <div className="cf-fade" key="otp">
            <h2 style={{ fontFamily:"Syne,sans-serif",fontSize:27,fontWeight:700,marginBottom:7 }}>Check your email</h2>
            <p style={{ color:"rgba(255,255,255,0.38)",marginBottom:30,fontSize:14 }}>We sent a 6-digit code to <strong style={{ color:"rgba(255,255,255,0.65)" }}>{pendingEmail}</strong></p>
            <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
              <Field id="otp-input" label="OTP Code">
                <input id="otp-input" className="cf-input" placeholder="000000" maxLength={6} value={f.otp} onChange={set("otp")} style={{ fontSize:26,letterSpacing:10,textAlign:"center",fontFamily:"Syne,sans-serif" }} />
              </Field>
              {error && <p className="cf-error">{error}</p>}
              {success && <p className="cf-success">{success}</p>}
              <SubmitButton loading={loading} onClick={()=>void doVerify()}>Verify Email</SubmitButton>
              <button className="cf-btn cf-btn-secondary" style={{ width:"100%",justifyContent:"center" }} onClick={()=>void doResend()}>Resend OTP</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FundModal = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: (msg: string) => void }) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("NGN");
  const { loading, error, run } = useFormAction();
  const handle = () => run(async () => {
    await api.post("/wallet/fund", { amount:Number(amount), currency });
    onSuccess("Wallet funded successfully!");
    onClose();
  });
  return (
    <Modal title="Fund Wallet" subtitle="Add balance to any currency" onClose={onClose}>
      <Field id="fund-amount" label="Amount"><input id="fund-amount" className="cf-input" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} /></Field>
      <Field id="fund-currency" label="Currency">
        <CurrencySelect id="fund-currency" ariaLabel="Select currency" value={currency} onChange={setCurrency} showName />
      </Field>
      {error && <p className="cf-error">{error}</p>}
      <SubmitButton loading={loading} disabled={!amount} onClick={()=>void handle()}>{`Fund ${currency} Wallet`}</SubmitButton>
    </Modal>
  );
};

const ConvertModal = ({ onClose, onSuccess, rates }: { onClose: () => void; onSuccess: (msg: string) => void; rates: Record<string, number> | null }) => {
  const [from, setFrom] = useState("NGN");
  const [to, setTo] = useState("USD");
  const [amount, setAmount] = useState("");
  const { loading, error, run } = useFormAction();
  const rate = rates?.[to] ?? 0;
  const preview = amount && rate ? (Number(amount) * rate).toFixed(6) : null;
  const handle = () => run(async () => {
    await api.post("/wallet/convert", { fromCurrency:from, toCurrency:to, amount:Number(amount) });
    onSuccess("Conversion successful!");
    onClose();
  });
  return (
    <Modal title="Convert Currency" subtitle="No conversion fee" onClose={onClose}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
        <Field id="conv-from" label="From"><CurrencySelect id="conv-from" ariaLabel="From currency" value={from} onChange={setFrom} /></Field>
        <Field id="conv-to" label="To"><CurrencySelect id="conv-to" ariaLabel="To currency" value={to} onChange={setTo} /></Field>
      </div>
      <Field id="conv-amt" label={`Amount (${from})`}><input id="conv-amt" className="cf-input" type="number" placeholder="0.00" value={amount} onChange={e=>setAmount(e.target.value)} /></Field>
      {preview && (
        <div style={{ background:"rgba(232,93,4,0.07)",border:"1px solid rgba(232,93,4,0.18)",borderRadius:11,padding:15 }}>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.38)",marginBottom:5 }}>You will receive</div>
          <div style={{ fontSize:24,fontFamily:"Syne,sans-serif",fontWeight:700,color:"#E85D04" }}>{preview} {to}</div>
          <div style={{ fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:5 }}>Rate: 1 {from} = {rate} {to} · Zero fee</div>
        </div>
      )}
      {error && <p className="cf-error">{error}</p>}
      <SubmitButton loading={loading} disabled={!amount||from===to} onClick={()=>void handle()}>Convert Now</SubmitButton>
    </Modal>
  );
};

const TradeModal = ({ onClose, onSuccess, rates }: { onClose: () => void; onSuccess: (msg: string) => void; rates: Record<string, number> | null }) => {
  const [source, setSource] = useState("NGN");
  const [target, setTarget] = useState("USD");
  const [targetAmt, setTargetAmt] = useState("");
  const { loading, error, run } = useFormAction();
  const rate = rates?.[target] ?? 0;
  const cost = targetAmt && rate ? Number(targetAmt) / rate : 0;
  const fee = cost * 0.005;
  const total = cost + fee;
  const handle = () => run(async () => {
    await api.post("/wallet/trade", { sourceCurrency:source, targetCurrency:target, targetAmount:Number(targetAmt) });
    onSuccess("Trade executed!");
    onClose();
  });
  return (
    <Modal title="Trade Currency" subtitle="0.5% trading fee applies" onClose={onClose}>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:11 }}>
        <Field id="trade-src" label="Spend"><CurrencySelect id="trade-src" ariaLabel="Source currency" value={source} onChange={setSource} /></Field>
        <Field id="trade-tgt" label="Buy"><CurrencySelect id="trade-tgt" ariaLabel="Target currency" value={target} onChange={setTarget} /></Field>
      </div>
      <Field id="trade-amt" label={`Exact ${target} amount to buy`}><input id="trade-amt" className="cf-input" type="number" placeholder="0.00" value={targetAmt} onChange={e=>setTargetAmt(e.target.value)} /></Field>
      {Number(targetAmt) > 0 && cost > 0 && (
        <div style={{ background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:11,padding:15 }}>
          {([["Base cost",cost.toFixed(4),"rgba(255,255,255,0.6)"],["Fee (0.5%)",fee.toFixed(4),"#FFB43C"],["Total deducted",total.toFixed(4),"#E85D04"]] as [string,string,string][]).map(([l,v,c])=>(
            <div key={l} style={{ display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:l==="Total deducted"?0:8,paddingTop:l==="Total deducted"?9:0,borderTop:l==="Total deducted"?"1px solid rgba(255,255,255,0.07)":"none" }}>
              <span style={{ color:"rgba(255,255,255,0.38)" }}>{l}</span>
              <span style={{ color:c,fontWeight:l==="Total deducted"?600:400 }}>{v} {source}</span>
            </div>
          ))}
        </div>
      )}
      {error && <p className="cf-error">{error}</p>}
      <SubmitButton loading={loading} disabled={!targetAmt||source===target} onClick={()=>void handle()}>{`Buy ${targetAmt||"0"} ${target}`}</SubmitButton>
    </Modal>
  );
};

const Dashboard = ({ user }: { user: UserProfile }) => {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [w, r] = await Promise.all([api.get("/wallet"), api.get("/fx/rates?base=NGN")]);
      setWallet(w.data as WalletData);
      setRates((r.data as RatesData)?.rates);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const balances = wallet?.balances ?? [];
  const totalNgn = balances.reduce((s, b) => {
    if (b.currency === "NGN") return s + Number(b.balance);
    const r = rates?.[b.currency]; if (!r) return s;
    return s + Number(b.balance) / r;
  }, 0);

  return (
    <div className="cf-fade">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} />}
      {modal==="fund" && <FundModal onClose={()=>setModal(null)} onSuccess={m=>{showToast(m);void load();}} />}
      {modal==="convert" && <ConvertModal onClose={()=>setModal(null)} onSuccess={m=>{showToast(m);void load();}} rates={rates} />}
      {modal==="trade" && <TradeModal onClose={()=>setModal(null)} onSuccess={m=>{showToast(m);void load();}} rates={rates} />}
      <PageHeader title={`Good day, ${user?.firstName} 👋`} subtitle="Here's your multi-currency portfolio" />
      <div style={{ background:"linear-gradient(140deg,#0D2860 0%,#0B1A40 50%,#1A0B00 100%)",borderRadius:18,padding:28,marginBottom:22,border:"1px solid rgba(255,255,255,0.07)" }}>
        <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",letterSpacing:1,textTransform:"uppercase",marginBottom:7 }}>Total Portfolio (NGN equivalent)</div>
        <div style={{ fontFamily:"Syne,sans-serif",fontSize:40,fontWeight:800,color:"white",marginBottom:22 }}>
          {loading ? "—" : `₦${totalNgn.toLocaleString("en-NG",{minimumFractionDigits:2,maximumFractionDigits:2})}`}
        </div>
        <div style={{ display:"flex",gap:10,flexWrap:"wrap" }}>
          {([{l:"Fund Wallet",a:"fund",primary:true},{l:"Convert",a:"convert",primary:false},{l:"Trade",a:"trade",primary:false}]).map(b=>(
            <button key={b.a} className={`cf-btn ${b.primary?"cf-btn-primary":"cf-btn-secondary"}`} onClick={()=>setModal(b.a)} style={{ padding:"9px 18px" }}>{b.l}</button>
          ))}
        </div>
      </div>
      <SectionTitle>Currency Balances</SectionTitle>
      {loading ? (
        <LoadingState padding={40} />
      ) : balances.length === 0 ? (
        <EmptyState padding={36}>No balances yet. Fund your wallet to get started.</EmptyState>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(190px,1fr))",gap:11 }}>
          {balances.map(b => (
            <div key={b.currency} className="cf-card" style={{ display:"flex",alignItems:"center",gap:14 }}>
              <div style={{ fontSize:30 }}>{FLAGS[b.currency]??"💱"}</div>
              <div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",marginBottom:2,textTransform:"uppercase",letterSpacing:0.5 }}>{b.currency}</div>
                <div style={{ fontFamily:"Syne,sans-serif",fontSize:20,fontWeight:700 }}>{Number(b.balance).toLocaleString(undefined,{maximumFractionDigits:4})}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:1 }}>{NAMES[b.currency]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const FxRatesPage = () => {
  const [base, setBase] = useState("NGN");
  const [data, setData] = useState<RatesData | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await api.get(`/fx/rates?base=${base}`); setData(r.data as RatesData); }
    catch(e) { console.error(e); }
    setLoading(false);
  }, [base]);
  useEffect(() => { void load(); }, [load]);
  const currencies = data?.rates ? Object.entries(data.rates).filter(([c])=>c!==base) : [];
  return (
    <div className="cf-fade">
      <PageHeader
        title="FX Rates"
        subtitle={`${data?.source === "cache" ? "📦 Cached" : "🟢 Live"} · Refreshes every 5 min`}
        actions={
          <div style={{ display:"flex",alignItems:"center",gap:10 }}>
            <label htmlFor="base-select" style={{ position:"absolute",width:1,height:1,overflow:"hidden" }}>Base currency</label>
            <CurrencySelect id="base-select" ariaLabel="Base currency" value={base} onChange={setBase} style={{ width:140 }} />
            <button className="cf-btn cf-btn-secondary" onClick={()=>void load()}>Refresh</button>
          </div>
        }
      />
      {loading ? <LoadingState padding={60} /> : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:11 }}>
          {currencies.map(([currency, rate]) => (
            <div key={currency} className="cf-card" style={{ display:"flex",justifyContent:"space-between",alignItems:"center" }}>
              <div style={{ display:"flex",alignItems:"center",gap:12 }}>
                <div style={{ fontSize:26 }}>{FLAGS[currency]}</div>
                <div>
                  <div style={{ fontWeight:600,fontSize:14 }}>{currency}</div>
                  <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>{NAMES[currency]}</div>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:15,color:"#E85D04" }}>{formatRate(rate)}</div>
                <div style={{ fontSize:10,color:"rgba(255,255,255,0.28)" }}>1 {base} =</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const TransactionsPage = () => {
  const [data, setData] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit: "20", ...(typeFilter&&{type:typeFilter}) });
      const r = await api.get(`/transactions?${p.toString()}`);
      setData(r.data as TransactionList);
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [typeFilter, page]);
  useEffect(() => { void load(); }, [load]);
  return (
    <div className="cf-fade">
      <PageHeader
        title="Transactions"
        subtitle={`${data?.total ?? 0} total records`}
        actions={
          <div>
            <label htmlFor="type-filter" style={{ position:"absolute",width:1,height:1,overflow:"hidden" }}>Filter by type</label>
            <select id="type-filter" className="cf-input" value={typeFilter} onChange={e=>{setTypeFilter(e.target.value);setPage(1);}} style={{ width:155,cursor:"pointer" }}>
              <option value="">All Types</option>
              {["FUNDING","CONVERSION","TRADE"].map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        }
      />
      <div className="cf-card" style={{ padding:0,overflow:"hidden" }}>
        {loading ? <LoadingState />
        : !data?.transactions?.length ? <div style={{ textAlign:"center",padding:44,color:"rgba(255,255,255,0.28)",fontSize:14 }}>No transactions found</div>
        : (
          <div style={{ overflowX:"auto" }}>
            <table className="cf-table">
              <thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Converted</th><th>Rate</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {data.transactions.map(tx=>(
                  <tr key={tx.id}>
                    <td style={{ fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.38)",maxWidth:160,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{tx.reference}</td>
                    <td><TypeBadge type={tx.type} icon /></td>
                    <td style={{ fontWeight:500 }}>{Number(tx.amount).toFixed(2)} <span style={{ color:"rgba(255,255,255,0.4)",fontSize:11 }}>{tx.fromCurrency}</span></td>
                    <td>{tx.convertedAmount>0?<>{Number(tx.convertedAmount).toFixed(4)} <span style={{ color:"rgba(255,255,255,0.4)",fontSize:11 }}>{tx.toCurrency}</span></>:"—"}</td>
                    <td style={{ color:"rgba(255,255,255,0.35)",fontSize:12 }}>{tx.rateUsed?Number(tx.rateUsed).toFixed(5):"—"}</td>
                    <td><StatusBadge status={tx.status} /></td>
                    <td style={{ fontSize:12,color:"rgba(255,255,255,0.38)" }}>{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {data && data.total > 20 && (
        <div style={{ display:"flex",justifyContent:"center",gap:11,marginTop:20 }}>
          <button className="cf-btn cf-btn-secondary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>← Prev</button>
          <span style={{ display:"flex",alignItems:"center",fontSize:13,color:"rgba(255,255,255,0.38)" }}>Page {page} of {Math.ceil(data.total/20)}</span>
          <button className="cf-btn cf-btn-secondary" disabled={page*20>=data.total} onClick={()=>setPage(p=>p+1)}>Next →</button>
        </div>
      )}
    </div>
  );
};

const AdminPage = () => {
  const [tab, setTab] = useState<"users"|"analytics"|"fx-trends"|"transactions">("users");
  const [users, setUsers] = useState<AdminUsers | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [fxTrends, setFxTrends] = useState<Array<{baseCurrency: string; rates: Record<string,number>; fetchedAt: string}>>([]);
  const [allTx, setAllTx] = useState<TransactionList | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast, showToast, hideToast } = useToast(3500);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "users") {
        const r = await api.get("/admin/users?page=1&limit=50");
        setUsers(r.data as AdminUsers);
      } else if (tab === "analytics") {
        const [a, tx] = await Promise.all([
          api.get("/admin/analytics/summary"),
          api.get("/admin/transactions?limit=100"),
        ]);
        const analyticsPayload = a.data as {
          users: { total: number; verified: number; unverified: number };
          transactions: { byType: Array<{ type: string; count: string }>; byCurrency: Array<{ currency: string; volume: string; count: string }> };
          topUsers: Array<{ userId: string; transactionCount: string; totalVolume: string }>;
        };

        setAnalytics({
          users: {
            total: Number(analyticsPayload?.users?.total ?? 0),
            verified: Number(analyticsPayload?.users?.verified ?? 0),
            unverified: Number(analyticsPayload?.users?.unverified ?? 0),
          },
          transactions: {
            byType: analyticsPayload?.transactions?.byType ?? [],
          },
        });

        const txPayload = tx.data as TransactionList;
        setAllTx({
          transactions: txPayload?.transactions ?? [],
          total: txPayload?.total ?? 0,
        });
      } else if (tab === "fx-trends") {
        const r = await api.get("/admin/analytics/fx-trends?base=NGN&limit=20");
        setFxTrends(r.data as Array<{baseCurrency: string; rates: Record<string,number>; fetchedAt: string}>);
      } else if (tab === "transactions") {
        const tx = await api.get("/admin/transactions?limit=100");
        setAllTx(tx.data as TransactionList);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { void load(); }, [load]);

  const toggleRole = async (id: string, currentRole: string) => {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    try { await api.patch(`/admin/users/${id}/role`, { role: newRole }); showToast(`Role updated to ${newRole}`); void load(); }
    catch(e) { showToast((e as Error).message, "error"); }
  };

  const tabs = [
    { id: "users", label: "Users" },
    { id: "analytics", label: "Analytics" },
    { id: "fx-trends", label: "FX Trends" },
    { id: "transactions", label: "All Transactions" },
  ] as const;

  const txByType = allTx?.transactions.reduce((acc, tx) => {
    acc[tx.type] = (acc[tx.type] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const txByDay = allTx?.transactions.reduce((acc, tx) => {
    const day = new Date(tx.createdAt).toLocaleDateString("en-GB", { day:"2-digit", month:"short" });
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentActivity = allTx?.transactions.slice(0, 8) ?? [];

  return (
    <div className="cf-fade">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={hideToast} />}
      <PageHeader title="Admin Panel" subtitle="Platform management, analytics & FX trends" />

      <div style={{ display:"flex",gap:3,background:"rgba(255,255,255,0.04)",borderRadius:11,padding:3,width:"fit-content",marginBottom:24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:"7px 20px",borderRadius:8,border:"none",cursor:"pointer",background:tab===t.id?"#E85D04":"transparent",color:tab===t.id?"white":"rgba(255,255,255,0.38)",fontFamily:"DM Sans,sans-serif",fontSize:13.5,fontWeight:500,transition:"all 0.18s" }}>{t.label}</button>
        ))}
      </div>

      {loading ? <LoadingState padding={60} /> : (

        <>
          {tab === "users" && users && (
            <div className="cf-card" style={{ padding:0,overflow:"hidden" }}>
              <div style={{ overflowX:"auto" }}>
                <table className="cf-table">
                  <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Role</th><th>Joined</th><th>Action</th></tr></thead>
                  <tbody>
                    {users.users?.map(u => (
                      <tr key={u.id}>
                        <td style={{ fontWeight:500 }}>{u.firstName} {u.lastName}</td>
                        <td style={{ fontSize:12,color:"rgba(255,255,255,0.42)" }}>{u.email}</td>
                        <td><span className={`cf-badge cf-badge-${u.isVerified?"success":"danger"}`}>{u.isVerified?"Verified":"Unverified"}</span></td>
                        <td><span className={`cf-badge cf-badge-${u.role==="ADMIN"?"warning":"info"}`}>{u.role}</span></td>
                        <td style={{ fontSize:12,color:"rgba(255,255,255,0.35)" }}>{new Date(u.createdAt ?? "").toLocaleDateString()}</td>
                        <td><button onClick={()=>void toggleRole(u.id, u.role)} style={{ background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:6,color:"#C8D4E8",padding:"4px 13px",cursor:"pointer",fontSize:12,fontFamily:"DM Sans,sans-serif" }}>Make {u.role==="ADMIN"?"User":"Admin"}</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "analytics" && analytics && (
            <div>
              <SectionTitle>User Activity</SectionTitle>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:11,marginBottom:28 }}>
                {([
                  ["Total Users", analytics.users?.total, "#E85D04"],
                  ["Verified", analytics.users?.verified, "#4EC98A"],
                  ["Unverified", analytics.users?.unverified, "#FF7070"],
                ] as [string,number,string][]).map(([l,v,c]) => (
                  <div key={l} className="cf-card" style={{ textAlign:"center" }}>
                    <div style={{ fontSize:36,fontFamily:"Syne,sans-serif",fontWeight:800,color:c }}>{v ?? 0}</div>
                    <div style={{ fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:4 }}>{l}</div>
                  </div>
                ))}
              </div>

              <SectionTitle>Trade & Transaction Volume</SectionTitle>
              <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:11,marginBottom:28 }}>
                {analytics.transactions?.byType?.map(t => (
                  <div key={t.type} className="cf-card" style={{ textAlign:"center" }}>
                    <div style={{ fontSize:36,fontFamily:"Syne,sans-serif",fontWeight:800,color:t.type==="TRADE"?"#E85D04":t.type==="CONVERSION"?"#FFB43C":"#64A0FF" }}>{parseInt(t.count)}</div>
                    <div style={{ fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:4 }}>{t.type}</div>
                  </div>
                ))}
                {txByType && (
                  <div className="cf-card" style={{ textAlign:"center" }}>
                    <div style={{ fontSize:36,fontFamily:"Syne,sans-serif",fontWeight:800,color:"#4EC98A" }}>{allTx?.total ?? 0}</div>
                    <div style={{ fontSize:12,color:"rgba(255,255,255,0.38)",marginTop:4 }}>Total Transactions</div>
                  </div>
                )}
              </div>

              {txByDay && Object.keys(txByDay).length > 0 && (
                <>
                  <SectionTitle>Daily Transaction Activity</SectionTitle>
                  <div className="cf-card" style={{ marginBottom:28 }}>
                    <div style={{ display:"flex",alignItems:"flex-end",gap:6,height:100,padding:"0 4px" }}>
                      {Object.entries(txByDay).slice(-14).map(([day, count]) => {
                        const max = Math.max(...Object.values(txByDay));
                        const pct = max > 0 ? (count / max) * 100 : 0;
                        return (
                          <div key={day} style={{ flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:6 }}>
                            <div style={{ fontSize:10,color:"rgba(255,255,255,0.4)" }}>{count}</div>
                            <div style={{ width:"100%",background:"#E85D04",borderRadius:"4px 4px 0 0",height:`${pct}%`,minHeight:4,transition:"height 0.3s" }} />
                            <div style={{ fontSize:9,color:"rgba(255,255,255,0.25)",whiteSpace:"nowrap",transform:"rotate(-45deg)",transformOrigin:"top center",marginTop:4 }}>{day}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <SectionTitle>Recent Activity Log</SectionTitle>
              <div className="cf-card" style={{ padding:0,overflow:"hidden" }}>
                <table className="cf-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Reference</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Pair</th>
                      <th>Status</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontWeight:500,whiteSpace:"nowrap" }}>
                          {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "—"}
                        </td>
                        <td style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>
                          {tx.user?.email ?? "—"}
                        </td>
                        <td style={{ fontFamily:"monospace",fontSize:10,color:"rgba(255,255,255,0.28)",maxWidth:110,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>
                          {tx.reference}
                        </td>
                        <td><TypeBadge type={tx.type} /></td>
                        <td style={{ fontWeight:500 }}>{Number(tx.amount).toFixed(2)}</td>
                        <td style={{ fontSize:12 }}>
                          {FLAGS[tx.fromCurrency]} {tx.fromCurrency}
                          {tx.toCurrency ? ` → ${FLAGS[tx.toCurrency] ?? ""} ${tx.toCurrency}` : ""}
                        </td>
                        <td><StatusBadge status={tx.status} /></td>
                        <td style={{ fontSize:11,color:"rgba(255,255,255,0.3)",whiteSpace:"nowrap" }}>
                          {formatDateTime(tx.createdAt, false)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "fx-trends" && (
            <div>
              <SectionTitle>FX Rate Snapshots — NGN Base</SectionTitle>
              {fxTrends.length === 0 ? (
                <EmptyState>
                  No FX snapshots yet. Rates are captured when users request them.
                </EmptyState>
              ) : (
                <>
                  <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(170px,1fr))",gap:11,marginBottom:24 }}>
                    {fxTrends[0]?.rates && Object.entries(fxTrends[0].rates).filter(([c]) => c !== "NGN").slice(0,6).map(([currency, rate]) => (
                      <div key={currency} className="cf-card" style={{ display:"flex",alignItems:"center",gap:12 }}>
                        <div style={{ fontSize:26 }}>{FLAGS[currency]}</div>
                        <div>
                          <div style={{ fontSize:10,color:"rgba(255,255,255,0.35)",textTransform:"uppercase",letterSpacing:0.5 }}>{currency}</div>
                          <div style={{ fontFamily:"Syne,sans-serif",fontSize:18,fontWeight:700,color:"#E85D04" }}>{formatRate(rate, 5)}</div>
                          <div style={{ fontSize:10,color:"rgba(255,255,255,0.25)" }}>1 NGN =</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <SectionTitle>Rate Snapshot History</SectionTitle>
                  <div className="cf-card" style={{ padding:0,overflow:"hidden" }}>
                    <div style={{ overflowX:"auto" }}>
                      <table className="cf-table">
                        <thead>
                          <tr>
                            <th>Fetched At</th>
                            <th>USD</th>
                            <th>EUR</th>
                            <th>GBP</th>
                            <th>CAD</th>
                            <th>AUD</th>
                            <th>ZAR</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fxTrends.map((snap, i) => (
                            <tr key={i}>
                              <td style={{ fontSize:12,color:"rgba(255,255,255,0.42)",whiteSpace:"nowrap" }}>
                                {formatDateTime(snap.fetchedAt)}
                              </td>
                              {["USD","EUR","GBP","CAD","AUD","ZAR"].map(c => (
                                <td key={c} style={{ fontFamily:"monospace",fontSize:12,color:"#E85D04" }}>
                                  {snap.rates[c] ? snap.rates[c].toFixed(5) : "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === "transactions" && (
            <div>
              <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:12 }}>
                <p style={{ color:"rgba(255,255,255,0.38)",fontSize:13.5 }}>{allTx?.total ?? 0} total platform transactions</p>
              </div>
              <div className="cf-card" style={{ padding:0,overflow:"hidden" }}>
                <div style={{ overflowX:"auto" }}>
                  <table className="cf-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Converted</th>
                        <th>Rate</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allTx?.transactions.map(tx => (
                        <tr key={tx.id}>
                          <td style={{ fontWeight:500,whiteSpace:"nowrap" }}>
                            {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : "—"}
                          </td>
                          <td style={{ fontSize:11,color:"rgba(255,255,255,0.35)" }}>
                            {tx.user?.email ?? "—"}
                          </td>
                          <td><TypeBadge type={tx.type} /></td>
                          <td style={{ fontWeight:500 }}>
                            {Number(tx.amount).toFixed(2)} <span style={{ color:"rgba(255,255,255,0.4)",fontSize:11 }}>{tx.fromCurrency}</span>
                          </td>
                          <td>
                            {tx.convertedAmount > 0
                              ? <>{Number(tx.convertedAmount).toFixed(4)} <span style={{ color:"rgba(255,255,255,0.4)",fontSize:11 }}>{tx.toCurrency}</span></>
                              : "—"}
                          </td>
                          <td style={{ fontFamily:"monospace",fontSize:11,color:"rgba(255,255,255,0.35)" }}>
                            {tx.rateUsed ? Number(tx.rateUsed).toFixed(5) : "—"}
                          </td>
                          <td><StatusBadge status={tx.status} /></td>
                          <td style={{ fontSize:11,color:"rgba(255,255,255,0.35)",whiteSpace:"nowrap" }}>
                            {formatDate(tx.createdAt)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const IcoWallet = () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 12V7H5a2 2 0 010-4h14v4M21 12v5H9a2 2 0 010-4h12"/></svg>;
const IcoFx = () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4"/></svg>;
const IcoTx = () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>;
const IcoAdmin = () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/></svg>;
const IcoOut = () => <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;

const MainApp = ({ user, onLogout }: { user: UserProfile; onLogout: () => void }) => {
  const [page, setPage] = useState("dashboard");
  const nav = [
    { id:"dashboard",label:"Dashboard",Icon:IcoWallet },
    { id:"fx",label:"FX Rates",Icon:IcoFx },
    { id:"transactions",label:"Transactions",Icon:IcoTx },
    ...(user?.role==="ADMIN"?[{ id:"admin",label:"Admin",Icon:IcoAdmin }]:[]),
  ];
  return (
    <div className="credfx" style={{ display:"flex",minHeight:"100vh" }}>
      <div style={{ width:228,background:"#080F1E",borderRight:"1px solid rgba(255,255,255,0.05)",padding:"26px 14px",display:"flex",flexDirection:"column",position:"sticky",top:0,height:"100vh",flexShrink:0 }}>
        <div style={{ marginBottom:36,paddingLeft:6 }}><Logo /></div>
        <nav style={{ display:"flex",flexDirection:"column",gap:3,flex:1 }}>
          {nav.map(({ id,label,Icon }) => (
            <div key={id} className={`cf-nav-item ${page===id?"active":""}`} onClick={()=>setPage(id)}>
              <Icon />{label}
            </div>
          ))}
        </nav>
        <div style={{ borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:14 }}>
          <div style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 10px",marginBottom:6 }}>
            <div style={{ width:34,height:34,borderRadius:9,background:"linear-gradient(135deg,#1040A0,#E85D04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"white",flexShrink:0 }}>
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontSize:13,fontWeight:500,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis" }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ fontSize:10,color:"rgba(255,255,255,0.28)" }}>{user?.role}</div>
            </div>
          </div>
          <div className="cf-nav-item" onClick={onLogout}><IcoOut />Sign Out</div>
        </div>
      </div>
      <div style={{ flex:1,padding:"36px 40px",overflowY:"auto",background:"#070F24" }}>
        {page==="dashboard" && <Dashboard user={user} />}
        {page==="fx" && <FxRatesPage />}
        {page==="transactions" && <TransactionsPage />}
        {page==="admin" && <AdminPage />}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    injectStyles();
    const token = getToken();
    if (token) {
      api.get("/auth/me")
        .then(r => {
          setUser(r.data as UserProfile);
          setReady(true);
        })
        .catch(() => {
          clearToken();
          setReady(true);
        });
    } else {
      setTimeout(() => setReady(true), 0);
    }
  }, []);

  if (!ready) return (
    <div style={{ background:"#070F24",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center" }}>
      <Spinner />
    </div>
  );

  return user
    ? <MainApp user={user} onLogout={() => { clearToken(); setUser(null); }} />
    : <AuthPage onLogin={u => setUser(u)} />;
}
