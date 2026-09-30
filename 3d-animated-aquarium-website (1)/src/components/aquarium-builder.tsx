"use client";

import { useEffect, useState, type FormEvent } from "react";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Box, Check, CheckCircle2, Fish, Leaf, Pause, Phone, Play, RotateCcw, Ruler, ShieldCheck, Sparkles, Waves } from "lucide-react";
import Dialog from "@/components/dialog";
import WhatsAppOrderButton from "@/components/whatsapp-order";
import { aquariumEstimate, extraOptions, fishOptions, formatPrice, styleOptions, type AquariumConfig } from "@/lib/catalog";
import { aquariumConfigError, aquariumSummary, defaultDimensions, dimensionsLabel, feetPresets, glassOptions, tankDimensions, tankGlassEstimate, tankVolume, type GlassThickness, type TankDimensions } from "@/lib/aquarium";

const AquariumScene = dynamic(() => import("@/components/aquarium-scene"), { ssr: false, loading: () => <div className="scene-fallback"><img src="/images/aquarium-tank.jpg" alt="Aquarium preview" /><span>Bringing your little world to life…</span></div> });

export default function AquariumBuilder({ onClose, purpose = "new" }: { onClose: () => void; purpose?: "new" | "upgrade" }) {
  const [config, setConfig] = useState<AquariumConfig>({ purpose, size: "classic", dimensionsFeet: { ...defaultDimensions }, glassThickness: 8, style: "nature", fish: "community", extras: ["filter", "light", "heater"] });
  const [step, setStep] = useState(1);
  const [motion, setMotion] = useState(true);
  const [reset, setReset] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ id: string; estimate: number; phone: string } | null>(null);
  useEffect(() => { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setMotion(false); }, []);
  const estimate = aquariumEstimate(config);
  const volume = tankVolume(config);
  const dimensions = tankDimensions(config);
  const configError = aquariumConfigError(config);
  const whatsappMessage = `Hello EXOTIC AQUARIUM HOUSE!\n\nI'd like a quote for this aquarium design:\n${aquariumSummary(config)}\n\nEstimated setup: ${formatPrice(estimate)} (indicative only).\nPlease confirm glass safety, bracing, stock and the final quote before fabrication.${success ? `\nSaved design reference: ${success.id}` : "\nThis is a free design enquiry, not a paid order."}`;

  function chooseSize(size: "nano" | "classic" | "landscape") {
    const preset = feetPresets.find(p => p.size === size)!;
    setConfig(c => ({ ...c, size, dimensionsFeet: { ...preset.dimensions }, fish: size === "nano" ? "betta" : size === "classic" && c.fish === "goldfish" ? "community" : c.fish }));
  }
  function chooseFish(fish: AquariumConfig["fish"]) {
    setConfig(c => {
      const next = { ...c, fish };
      if (fish === "goldfish" && tankVolume(c) < 120) return { ...next, size: "landscape", dimensionsFeet: { ...feetPresets[2].dimensions } };
      if (fish === "community" && (tankVolume(c) < 60 || tankDimensions(c).length < 1.8)) return { ...next, size: "classic", dimensionsFeet: { ...feetPresets[1].dimensions } };
      return next;
    });
  }
  function changeDimension(axis: keyof TankDimensions, value: string) {
    setConfig(c => ({ ...c, size: "custom", dimensionsFeet: { ...tankDimensions(c), [axis]: value === "" ? 0 : Number(value) } }));
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (configError) { setError(configError); return; }
    setPending(true); setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const res = await fetch("/api/aquarium-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...values, config }) });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Unable to save your design.");
      setSuccess({ ...body.request, phone: values.phone as string });
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); } finally { setPending(false); }
  }

  return <Dialog onClose={onClose} title="Customize your aquarium" className="builder-dialog">
    <div className="builder-heading"><div className="eyebrow"><Sparkles size={13} /> IMAGINATION, MEET YOUR AQUARIUM</div><h2>Your world. Your way.</h2><p>Your dimensions in feet. Your glass thickness. Your little escape.</p></div>
    {success ? <div className="builder-success"><div className="success-icon"><CheckCircle2 size={47} strokeWidth={1.4} /></div><h3>Your little world is taking shape.</h3><p>We’ve saved your design, including <strong>{dimensionsLabel(config)}</strong> and <strong>{config.glassThickness} mm glass</strong>. Our team will call <strong>{success.phone}</strong> to confirm the design and quote.</p><div className="confirmation-box"><span>YOUR DESIGN REFERENCE</span><strong>{success.id}</strong><div><span>Tank dimensions</span><b>{dimensionsLabel(config)}</b></div><div><span>Requested glass</span><b>{config.glassThickness} mm</b></div><div><span>Estimated setup</span><b>{formatPrice(success.estimate)}</b></div></div><p className="small muted">This is an enquiry, not a paid order. Glass thickness, bracing, installation and livestock suitability require approval by the shop.</p><WhatsAppOrderButton label="Discuss my design on WhatsApp" message={whatsappMessage} /><button className="button button-coral" onClick={onClose}>Back to the little wonders <ArrowRight size={17} /></button><a className="contact-link" href="tel:8822340240"><Phone size={16} /> Talk to our team · 8822340240</a></div> : <div className="builder-grid">
      <div className="builder-preview">
        <div className="scene-container"><div className="scene-topline"><span><i /> LIVE 3D PREVIEW</span><div><button className="icon-button" onClick={() => setMotion(v => !v)} aria-label={motion ? "Pause aquarium animation" : "Play aquarium animation"}>{motion ? <Pause size={16} /> : <Play size={16} />}</button><button className="icon-button" onClick={() => setReset(v => v + 1)} aria-label="Reset aquarium view"><RotateCcw size={16} /></button></div></div><AquariumScene config={config} motion={motion} reset={reset} /><div className="scene-instructions"><RotateCcw size={12} /> Drag to explore <span>·</span> Scroll to zoom</div></div>
        <div className="preview-tags"><span><Ruler size={13} />{dimensionsLabel(config)}</span><span>{config.glassThickness} mm glass</span><span>≈ {volume} L gross</span><span><Leaf size={13} />{styleOptions.find(t => t.id === config.style)?.name}</span></div>
        <div className="estimate-box"><div><span>YOUR ESTIMATED {config.purpose === "upgrade" ? "UPGRADE" : "SETUP"}</span><strong>{formatPrice(estimate)}</strong></div><Sparkles size={26} strokeWidth={1.2} /><p>{config.purpose === "new" ? `Glass & fabrication estimate: ${formatPrice(tankGlassEstimate(config))}. ` : "Existing glass tank excluded. "}Indicative pricing, not a final quotation.</p></div>
        <div className="builder-assurance"><ShieldCheck size={18} /><p>Glass thickness is a requested specification, not a safety certification. Our team must approve glass, bracing, silicone joints and stand support before fabrication.</p></div>
        <WhatsAppOrderButton className="builder-whatsapp" label="Get this quote on WhatsApp" message={whatsappMessage} />
      </div>
      <div className="builder-options">
        <div className="builder-steps"><span className={step === 1 ? "active" : "complete"}>{step > 1 ? <Check size={12} /> : "1"} Design your world</span><i /><span className={step === 2 ? "active" : ""}>2 Make it happen</span></div>
        {step === 1 ? <div className="config-options">
          <div className="purpose-toggle"><button className={config.purpose === "new" ? "active" : ""} onClick={() => setConfig(c => ({ ...c, purpose: "new" }))}>A new aquarium</button><button className={config.purpose === "upgrade" ? "active" : ""} onClick={() => setConfig(c => ({ ...c, purpose: "upgrade" }))}>Upgrade my aquarium</button></div>
          <div className="option-heading"><Box size={16} /><h3>{config.purpose === "upgrade" ? "Your existing tank dimensions" : "Start with a size, make it yours"}</h3></div>
          <div className="tank-options">{feetPresets.map(tank => <button key={tank.size} aria-pressed={config.size === tank.size} className={config.size === tank.size ? "selected" : ""} onClick={() => chooseSize(tank.size)}><strong>{tank.label}</strong><span>{tank.dimensions.length} × {tank.dimensions.width} × {tank.dimensions.height} ft</span><small>{tank.name}</small></button>)}</div>
          <div className="dimension-fields">{(["length", "width", "height"] as const).map(axis => <label key={axis}>{axis[0].toUpperCase() + axis.slice(1)} <span>(feet)</span><input type="number" inputMode="decimal" min={axis === "length" ? 1 : 0.5} max={axis === "length" ? 6 : axis === "width" ? 3 : 2.5} step="0.25" value={dimensions[axis] || ""} aria-label={`Tank ${axis} in feet`} onChange={event => changeDimension(axis, event.target.value)} /></label>)}</div>
          <p className="option-note">L × W × H in feet · 1 foot = 30.48 cm. Approx. {volume} L before glass, substrate and hardscape displacement.</p>
          <div className="option-heading"><Ruler size={16} /><h3>{config.purpose === "upgrade" ? "Existing glass thickness" : "Choose glass thickness"}</h3></div>
          <div className="glass-options">{glassOptions.map(glass => <button key={glass.mm} aria-pressed={config.glassThickness === glass.mm} className={config.glassThickness === glass.mm ? "selected" : ""} aria-label={`${glass.mm} mm glass`} onClick={() => setConfig(c => ({ ...c, glassThickness: glass.mm as GlassThickness }))}><span>{glass.mm}</span> mm{config.glassThickness === glass.mm && <Check size={12} />}</button>)}</div>
          <p className="option-note glass-safety-note"><ShieldCheck size={12} /> Final thickness and bracing must be approved by the shop. Larger or taller tanks may need a different construction.</p>
          <div className="option-heading"><Leaf size={16} /><h3>Choose your landscape</h3></div>
          <div className="style-options">{styleOptions.map(style => <button key={style.id} aria-pressed={config.style === style.id} className={config.style === style.id ? "selected" : ""} onClick={() => setConfig(c => ({ ...c, style: style.id }))}><span className={`style-swatch swatch-${style.id}`}><Leaf size={18} /></span><div><strong>{style.name}</strong><span>{style.description}</span></div><small>+{formatPrice(style.price)}</small>{config.style === style.id && <Check size={14} />}</button>)}</div>
          <div className="option-heading"><Fish size={16} /><h3>A little life & colour</h3></div>
          <select className="builder-select" aria-label="Choose fish" value={config.fish} onChange={event => chooseFish(event.target.value as AquariumConfig["fish"])}>{fishOptions.map(fish => <option key={fish.id} value={fish.id}>{fish.name} · {formatPrice(fish.price)}</option>)}</select>
          <p className="option-note">{fishOptions.find(f => f.id === config.fish)?.description}. Tank presets adjust if more swimming space is needed.</p>
          <div className="option-heading"><Sparkles size={16} /><h3>The finishing touches</h3></div>
          <div className="extra-options">{extraOptions.map(extra => <button key={extra.id} aria-pressed={config.extras.includes(extra.id)} onClick={() => setConfig(c => ({ ...c, extras: c.extras.includes(extra.id) ? c.extras.filter(x => x !== extra.id) : [...c.extras, extra.id] }))}><span className={`checkbox ${config.extras.includes(extra.id) ? "checked" : ""}`}>{config.extras.includes(extra.id) && <Check size={12} />}</span><span>{extra.name}</span><small>+{formatPrice(extra.price)}</small></button>)}</div>
          {configError && <p className="form-error" role="alert">{configError}</p>}
          <button className="button button-coral builder-continue" disabled={!!configError} onClick={() => setStep(2)}>Make it happen <ArrowRight size={17} /></button><p className="checkout-disclaimer">A free design enquiry. No payment required.</p>
        </div> : <form className="builder-contact" onSubmit={submit}>
          <button type="button" className="text-button" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back to your design</button><h3>Let’s bring it to life.</h3><p>Your request: <strong>{dimensionsLabel(config)} · {config.glassThickness} mm glass</strong>. We’ll confirm fabrication, your space and the final quote.</p>
          <label>Your name<input name="name" placeholder="Full name" minLength={2} maxLength={100} autoComplete="name" required /></label><label>Mobile number<input name="phone" type="tel" placeholder="10-digit Indian mobile number" pattern="[6-9][0-9]{9}" maxLength={10} autoComplete="tel-national" required /></label><label>Email <span className="optional">(optional)</span><input name="email" type="email" placeholder="you@example.com" autoComplete="email" maxLength={150} /></label><label>A little about your space <span className="optional">(optional)</span><textarea name="notes" placeholder={config.purpose === "upgrade" ? "Existing tank, glass condition, bracing and what you’d like to improve…" : "Where will the tank sit? Tell us about your stand, space and design ideas…"} maxLength={2000} rows={3} /></label>
          {error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={pending || !!configError} className="button button-coral">{pending ? "Saving your little world…" : "Request my custom aquarium"}{!pending && <ArrowRight size={17} />}</button><p className="checkout-disclaimer">We’ll only use your details to discuss your aquarium request.</p>
        </form>}
      </div>
    </div>}
  </Dialog>;
}
