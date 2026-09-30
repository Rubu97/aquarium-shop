"use client";
import { useState, type ReactNode } from "react";
import { ArrowUpRight, MapPin, Navigation, Phone } from "lucide-react";
import Dialog from "@/components/dialog";
import CopyButton from "@/components/copy-button";
import { SHOP_ADDRESS, SHOP_DIRECTIONS_URL, SHOP_MAP_SHORT_URL, SHOP_MAP_URL, SHOP_PHONE, SHOP_PIN } from "@/lib/shop-contact";

export default function DirectionsLink({ children, className = "", ariaLabel }: { children: ReactNode; className?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  return <><a href={SHOP_DIRECTIONS_URL} className={className} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel} data-directions="true" onClick={event => { if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); setOpen(true); } }}>{children}</a>
    {open && <Dialog title="Directions to Exotic Aquarium House" onClose={() => setOpen(false)} className="contact-dialog">
      <div className="eyebrow"><MapPin size={13} /> A LITTLE CLOSER TO YOUR AQUARIUM SHOP</div><h2>Come find your wonder.</h2><p className="contact-intro">{SHOP_ADDRESS}</p>
      <div className="location-pin-card"><Navigation size={29} /><div><strong>Use the shop’s saved map pin</strong><span>Pin coordinates: {SHOP_PIN}</span><p>These coordinates come from the location link supplied by the shop. The pin may display a different place label in Maps.</p></div></div>
      <a className="button button-coral contact-primary" href={SHOP_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" data-external-directions="true"><Navigation size={17} /> Open Google Maps directions <ArrowUpRight size={16} /></a>
      <div className="contact-secondary-links"><a href={SHOP_MAP_URL} target="_blank" rel="noopener noreferrer">View the map pin <ArrowUpRight size={13} /></a><a href={SHOP_MAP_SHORT_URL} target="_blank" rel="noopener noreferrer">Original location link <ArrowUpRight size={13} /></a></div>
      <p className="external-help">Maps opens outside this site. If an embedded preview or in-app browser blocks the new tab, copy the directions link and open it in Chrome, Safari or Google Maps.</p>
      <CopyButton text={SHOP_DIRECTIONS_URL} label="Copy directions link" /><input className="contact-copy-field" value={SHOP_DIRECTIONS_URL} readOnly onFocus={event => event.currentTarget.select()} aria-label="Directions link to copy" />
      <CopyButton text={SHOP_ADDRESS} label="Copy shop address" /><a className="contact-link" href={`tel:${SHOP_PHONE}`}><Phone size={15} /> Need help finding us? {SHOP_PHONE}</a>
    </Dialog>}
  </>;
}
