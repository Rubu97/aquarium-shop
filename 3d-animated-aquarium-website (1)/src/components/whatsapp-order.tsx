"use client";

import { useState } from "react";
import { ArrowUpRight, Phone } from "lucide-react";
import Dialog from "@/components/dialog";
import CopyButton from "@/components/copy-button";
import { whatsappBrowserLink, whatsappWebLink, whatsappOrderLink, whatsappOrderMessage, SHOP_WHATSAPP_NUMBER, type WhatsAppOrderOptions } from "@/lib/whatsapp";

export function WhatsAppIcon({ size = 19 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20.8 11.8a8.8 8.8 0 0 1-13.2 7.6L3 21l1.6-4.5a8.8 8.8 0 1 1 16.2-4.7Z" /><path d="M8.2 7.6c-.4-.6-1.4-.4-1.6.1-.5 1.1.1 3.4 2.3 5.5 2.2 2.1 4.4 2.8 5.5 2.2.6-.3 1-1.4.5-1.8l-1.8-1c-.3-.2-.6-.1-.8.2l-.5.6c-.3.2-1-.2-1.9-1s-1.2-1.5-1-1.8l.5-.6c.2-.2.3-.5.1-.8l-1.3-1.6Z" /></svg>;
}

export default function WhatsAppOrderButton({ className = "", label = "Order on WhatsApp", ariaLabel, ...options }: WhatsAppOrderOptions & { className?: string; label?: string; ariaLabel?: string }) {
  const [open, setOpen] = useState(false);
  const message = whatsappOrderMessage(options);
  return <><a className={`button button-whatsapp ${className}`} href={whatsappOrderLink(options)} target="_blank" rel="noopener noreferrer" aria-label={ariaLabel || label} title="Review your message and open WhatsApp, WhatsApp Web, or copy the request." data-whatsapp-order="true" onClick={event => {
    if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) { event.preventDefault(); setOpen(true); }
  }}><WhatsAppIcon /><span>{label}</span></a>
    {open && <Dialog title="Send your WhatsApp order" onClose={() => setOpen(false)} className="contact-dialog whatsapp-contact-dialog">
      <div className="eyebrow"><WhatsAppIcon size={13} /> YOUR LITTLE WORLD, ONE MESSAGE AWAY</div><h2>Let’s talk aquarium.</h2><p className="contact-intro">Send your request to <strong>+91 8822340240</strong>. Review the message below, then open WhatsApp and tap Send.</p>
      <textarea className="whatsapp-message-preview" readOnly value={message} rows={8} aria-label="Your WhatsApp order message" onFocus={event => event.currentTarget.select()} />
      <a className="button button-whatsapp contact-primary" href={whatsappBrowserLink(message)} target="_blank" rel="noopener noreferrer" data-external-whatsapp="true"><WhatsAppIcon /> Open WhatsApp <ArrowUpRight size={16} /></a>
      <div className="contact-secondary-links"><a href={whatsappWebLink(message)} target="_blank" rel="noopener noreferrer" data-whatsapp-web="true">Use WhatsApp Web <ArrowUpRight size={13} /></a><a href={`whatsapp://send?phone=${SHOP_WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`}>Open installed mobile app <ArrowUpRight size={13} /></a></div>
      <p className="external-help">If a preview or in-app browser blocks WhatsApp, copy the message and open WhatsApp directly. The shop number must have an active WhatsApp account. No message is sent automatically.</p>
      <div className="contact-copy-actions"><CopyButton text={message} label="Copy order message" /><CopyButton text="+91 8822340240" label="Copy shop number" /></div>
      <CopyButton text={whatsappOrderLink(options)} label="Copy WhatsApp link" /><input className="contact-copy-field" value={whatsappOrderLink(options)} readOnly onFocus={event => event.currentTarget.select()} aria-label="WhatsApp link to copy" />
      <p className="whatsapp-note">A request is not a paid or confirmed order. Please wait for the shop to confirm stock, final pricing and transport.</p><a className="contact-link" href="tel:8822340240"><Phone size={15} /> Or call the shop · 8822340240</a>
    </Dialog>}
  </>;
}
