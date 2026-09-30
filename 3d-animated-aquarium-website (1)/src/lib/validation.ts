export function cleanText(value: unknown, max = 200): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function validateContact(data: Record<string, unknown>) {
  const name = cleanText(data.name, 100);
  const phone = cleanText(data.phone, 20).replace(/[\s()-]/g, "").replace(/^\+91/, "");
  const email = cleanText(data.email, 150).toLowerCase();
  if (name.length < 2) return { error: "Please enter your full name." } as const;
  if (!/^[6-9]\d{9}$/.test(phone)) return { error: "Please enter a valid 10-digit Indian mobile number." } as const;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Please enter a valid email address." } as const;
  return { name, phone, email } as const;
}
