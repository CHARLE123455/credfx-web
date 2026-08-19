export const injectStyles = () => {
  if (document.getElementById("credfx-styles")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap";
  document.head.appendChild(link);
  const style = document.createElement("style");
  style.id = "credfx-styles";
  style.textContent = `
    *{box-sizing:border-box;margin:0;padding:0;}
    .credfx{font-family:'DM Sans',sans-serif;background:#070F24;color:#E8EDF5;min-height:100vh;}
    .credfx h1,.credfx h2,.credfx h3,.credfx h4{font-family:'Syne',sans-serif;}
    .cf-btn{padding:11px 22px;border-radius:8px;border:none;cursor:pointer;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;transition:all 0.18s;display:inline-flex;align-items:center;gap:7px;}
    .cf-btn-primary{background:#E85D04;color:white;}
    .cf-btn-primary:hover{background:#C44C03;}
    .cf-btn-secondary{background:rgba(255,255,255,0.07);color:#C8D4E8;border:1px solid rgba(255,255,255,0.1);}
    .cf-btn-secondary:hover{background:rgba(255,255,255,0.12);}
    .cf-btn:disabled{opacity:0.45;cursor:not-allowed;}
    .cf-input{width:100%;padding:11px 14px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:8px;color:#E8EDF5;font-family:'DM Sans',sans-serif;font-size:14px;outline:none;transition:border 0.18s;appearance:none;}
    .cf-input:focus{border-color:#E85D04;background:rgba(255,255,255,0.09);}
    .cf-input::placeholder{color:rgba(255,255,255,0.25);}
    .cf-card{background:#0F1E38;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:22px;}
    .cf-label{font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:7px;display:block;font-weight:500;letter-spacing:0.6px;text-transform:uppercase;}
    .cf-error{color:#FF7070;font-size:13px;margin-top:7px;}
    .cf-success{color:#4EC98A;font-size:13px;margin-top:7px;}
    .cf-badge{display:inline-flex;align-items:center;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;letter-spacing:0.3px;}
    .cf-badge-success{background:rgba(78,201,138,0.12);color:#4EC98A;}
    .cf-badge-warning{background:rgba(255,180,60,0.12);color:#FFB43C;}
    .cf-badge-danger{background:rgba(255,112,112,0.12);color:#FF7070;}
    .cf-badge-info{background:rgba(100,160,255,0.12);color:#64A0FF;}
    .cf-nav-item{display:flex;align-items:center;gap:11px;padding:9px 14px;border-radius:9px;cursor:pointer;color:rgba(255,255,255,0.42);font-size:13.5px;font-weight:500;transition:all 0.18s;user-select:none;}
    .cf-nav-item:hover{background:rgba(255,255,255,0.05);color:#E8EDF5;}
    .cf-nav-item.active{background:rgba(232,93,4,0.13);color:#E85D04;}
    .cf-backdrop{position:fixed;inset:0;background:rgba(0,0,0,0.72);display:flex;align-items:center;justify-content:center;z-index:200;padding:16px;backdrop-filter:blur(3px);}
    .cf-modal{background:#0D1B33;border:1px solid rgba(255,255,255,0.09);border-radius:18px;padding:30px;width:100%;max-width:460px;}
    .cf-table{width:100%;border-collapse:collapse;}
    .cf-table th{font-size:11px;font-weight:500;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.6px;padding:11px 16px;text-align:left;border-bottom:1px solid rgba(255,255,255,0.05);}
    .cf-table td{padding:13px 16px;border-bottom:1px solid rgba(255,255,255,0.04);font-size:13px;color:rgba(255,255,255,0.75);}
    .cf-table tr:last-child td{border-bottom:none;}
    .cf-table tr:hover td{background:rgba(255,255,255,0.025);}
    @keyframes spin{to{transform:rotate(360deg);}}
    .cf-spin{width:19px;height:19px;border:2px solid rgba(255,255,255,0.18);border-top-color:white;border-radius:50%;animation:spin 0.55s linear infinite;display:inline-block;}
    @keyframes fadeUp{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
    .cf-fade{animation:fadeUp 0.28s ease;}
    ::-webkit-scrollbar{width:5px;height:5px;}
    ::-webkit-scrollbar-track{background:transparent;}
    ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:10px;}
  `;
  document.head.appendChild(style);
};
