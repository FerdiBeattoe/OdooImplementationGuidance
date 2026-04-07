import { STAGES } from "/shared/index.js";
import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";

export function renderStagesView(project, onSelectStage) {
  const total = project.checkpoints.length;
  const done = project.checkpoints.filter(c => c.status === "Pass" || c.status === "Done").length;
  const progressPercent = total === 0 ? 0 : Math.round((done / total) * 100);
  
  return el("section", { className: "workspace max-w-6xl mx-auto" }, [
    el("section", { className: "mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6" }, [
      el("div", {}, [
        el("h1", { className: "text-4xl font-extrabold font-headline tracking-tight text-on-surface mb-2", text: "Implementation Roadmap" }),
        el("p", { className: "text-on-surface-variant max-w-xl text-lg", text: "Orchestrating the transition to Odoo Enterprise. Tracking structural milestones and technical provisioning." })
      ]),
      el("div", { className: "bg-surface-container-lowest p-6 rounded-xl shadow-sm min-w-[280px] border border-outline-variant/10 relative overflow-hidden" }, [
        el("div", { className: "absolute top-0 right-0 w-32 h-32 bg-secondary/5 rounded-full -mr-16 -mt-16 blur-3xl" }),
        el("div", { className: "flex justify-between items-center mb-4 relative z-10" }, [
          el("span", { className: "text-sm font-bold font-label uppercase tracking-wider text-secondary", text: "Global Progress" }),
          el("span", { className: "text-2xl font-black font-headline text-primary", text: progressPercent + "%" })
        ]),
        el("div", { className: "w-full bg-surface-container h-3 rounded-full overflow-hidden relative z-10" }, [
          el("div", { className: "bg-gradient-to-r from-secondary to-secondary-fixed-dim h-full transition-all duration-1000", style: `width: ${progressPercent}%` })
        ]),
        el("p", { className: "mt-3 text-xs text-on-surface-variant font-medium relative z-10", text: `Next Milestone: Proceed to Configuration` })
      ])
    ]),
    
    el("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8" }, 
      STAGES.map((stage, index) => {
        const stageCheckpoints = project.checkpoints.filter(c => c.stageId === stage.id);
        
        let theme, icon, margin;
        if (index === 0) { theme = "primary"; icon = "cloud"; margin = ""; }
        else if (index === 1) { theme = "secondary"; icon = "settings"; margin = "lg:mt-12"; }
        else { theme = "tertiary"; icon = "database"; margin = "lg:mt-24"; }

        return el("div", { className: `lg:col-span-4 space-y-6 ${margin}` }, [
          el("div", { className: "flex items-center gap-3 mb-2" }, [
            el("div", { className: `w-10 h-10 ${theme === 'primary' ? 'bg-primary-fixed text-primary' : theme === 'secondary' ? 'bg-secondary-fixed text-secondary' : 'bg-tertiary-fixed text-tertiary'} rounded-lg flex items-center justify-center` }, [
              lucideIcon(icon, 20)
            ]),
            el("h2", { className: "text-xl font-bold font-headline", text: `${index + 1}. ${stage.label}` })
          ]),
          ...stageCheckpoints.map(cp => renderRoadmapCard(cp, theme))
        ]);
      })
    ),

    el("section", { className: "mt-16 grid grid-cols-1 md:grid-cols-3 gap-8" }, [
      el("div", { className: "md:col-span-2 bg-surface-container-low p-8 rounded-xl relative overflow-hidden" }, [
        el("div", { className: "flex items-center gap-4 mb-6" }, [
          el("h2", { className: "text-2xl font-extrabold font-headline", text: "Project Velocity" }),
          el("div", { className: "px-3 py-1 bg-secondary text-white text-[10px] font-black rounded-full uppercase", text: "On Schedule" })
        ]),
        el("div", { className: "grid grid-cols-4 gap-4" }, [
          velocityStat("Sprint Day", "14 / 30", ""),
          velocityStat("Team Output", "8.2", "/hr"),
          velocityStat("Tasks Pending", String(project.checkpoints.filter(c => c.status === "Fail" || c.status === "Warning").length), ""),
          velocityStat("System Load", "Low", "")
        ])
      ]),
      el("div", { className: "bg-primary text-on-primary p-8 rounded-xl flex flex-col" }, [
        lucideIcon("brain", 32),
        el("h3", { className: "text-xl font-bold font-headline mb-4", text: "Architect's Guidance" }),
        el("p", { className: "text-sm leading-relaxed text-on-primary-container mb-8", text: `"Prioritize the Multi-Company structure before the Chart of Accounts import. Odoo handles tax positions dynamically based on this hierarchy, avoiding duplicate manual entries later."` })
      ])
    ])
  ]);
}

function velocityStat(title, val, suffix) {
  return el("div", { className: "space-y-1" }, [
    el("p", { className: "text-[10px] font-bold text-on-surface-variant uppercase", text: title }),
    el("p", { className: "text-xl font-black text-primary" }, [
      el("span", { text: val }),
      suffix ? el("span", { className: "text-sm font-normal text-on-surface-variant", text: suffix }) : null
    ])
  ]);
}

function renderRoadmapCard(checkpoint, colorTheme) {
  const isDone = checkpoint.status === "Pass" || checkpoint.status === "Done";
  const isBlocked = checkpoint.status === "Fail";
  
  let borderClass, badgeClass, textClass, statusLabel, opacityClass, verifyClass;
  if (isDone) {
    if (colorTheme === 'primary') { borderClass = 'border-primary'; badgeClass = 'bg-primary-fixed text-primary'; verifyClass = 'text-primary'; }
    if (colorTheme === 'secondary') { borderClass = 'border-secondary'; badgeClass = 'bg-secondary-fixed text-secondary'; verifyClass = 'text-secondary'; }
    if (colorTheme === 'tertiary') { borderClass = 'border-tertiary'; badgeClass = 'bg-tertiary-fixed text-tertiary'; verifyClass = 'text-tertiary'; }
    statusLabel = "Complete"; opacityClass = "";
  } else if (!isBlocked) {
    if (colorTheme === 'primary') { borderClass = 'border-primary'; badgeClass = 'bg-primary-fixed text-on-primary-fixed-variant'; }
    if (colorTheme === 'secondary') { borderClass = 'border-secondary'; badgeClass = 'bg-secondary-fixed text-on-secondary-fixed-variant'; }
    if (colorTheme === 'tertiary') { borderClass = 'border-tertiary'; badgeClass = 'bg-tertiary-fixed text-on-tertiary-fixed-variant'; }
    statusLabel = "In Progress"; opacityClass = "bg-white"; verifyClass = "";
  } else {
    borderClass = "border-outline-variant"; 
    badgeClass = "bg-surface-container-highest text-on-surface-variant"; 
    statusLabel = "Todo"; 
    opacityClass = "bg-surface-container-low opacity-80 grayscale hover:grayscale-0 hover:opacity-100";
    verifyClass = "";
  }

  return el("div", { className: `p-5 rounded-lg border-l-4 ${borderClass} shadow-sm hover:shadow-md transition-all cursor-pointer ${opacityClass || 'bg-surface-container-lowest'}` }, [
    el("div", { className: "flex justify-between items-start mb-3" }, [
      el("span", { className: `${badgeClass} px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight`, text: statusLabel }),
      el("span", { className: "text-xs text-on-surface-variant font-medium", text: checkpoint.checkpointClass })
    ]),
    el("h3", { className: "font-bold text-on-surface mb-1 font-headline", text: checkpoint.title }),
    el("p", { className: "text-xs text-on-surface-variant mb-4 font-body leading-relaxed", text: checkpoint.validationSource }),
    isDone ? el("div", { className: "flex items-center gap-2" }, [
      lucideIcon("check-circle", 14),
      el("span", { className: `text-[11px] font-medium ${verifyClass}`, text: "Verified" })
    ]) : null
  ]);
}
