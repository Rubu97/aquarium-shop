# Publish EXOTIC AQUARIUM HOUSE for free

## Recommended starting setup

- **Netlify Free** hosts the Next.js website, API routes and images, and provides HTTPS and a free `your-chosen-name.netlify.app` address (subject to name availability). Netlify allows commercial projects on its Free plan.
- **Neon Free** provides hosted PostgreSQL for products, orders, custom aquarium requests and newsletter subscriptions.
- A custom `.com` or `.in` domain is optional and normally costs money. You do not need one to publish.

This project has been prepared for this setup, but adding the configuration does **not** publish the site to your accounts. The sandbox preview is not a substitute for your own production hosting and database.

## 1. Create your free production database

1. Create an account at https://neon.com and select the **Free** plan.
2. Create a PostgreSQL project in a region reasonably close to your customers and hosting functions.
3. Use the **Connect** dialog to copy the **pooled PostgreSQL connection string**, including its SSL parameters. This is the private `DATABASE_URL` for the website.
4. Also copy the unpooled/direct connection string for the initial schema setup if available. This can be used as `DATABASE_DIRECT_URL` on your local computer; it is not required in Netlify.
5. Never publish either connection string or put it in a `NEXT_PUBLIC_*` variable.

The local sandbox PostgreSQL address cannot be reached from Netlify. A fresh Neon project does not contain existing sandbox orders or customer data. If you need to retain real data, arrange a secure database backup and restore separately before switching hosts.

## 2. Initialize the production database once

On your own computer, download the project source and install Node.js 22. In the project directory:

1. Install the project's packages using `npm install`.
2. Create a private `.env` file and set `DATABASE_URL` to your Neon pooled connection string. Optionally also set `DATABASE_DIRECT_URL` to the direct connection string.
3. Run `npx drizzle-kit push`.
4. Confirm that Drizzle is connecting to **your intended Neon project** before approving any proposed changes.

`drizzle.config.ts` now reads your environment variables rather than a fixed localhost address. It creates the products, orders, aquarium requests and subscribers tables. The application inserts missing catalogue products on its first catalogue request without resetting existing stock.

Do not run schema changes automatically on every deployment. Back up a database containing customer data before future schema changes, and use reviewed migrations as the shop grows.

## 3. Upload the source to GitHub

1. Create a GitHub repository under your own account and upload the project source.
2. Include `src`, `public`, `package.json`, the package lockfile, `netlify.toml`, `drizzle.config.ts` and the remaining project configuration files.
3. Do not upload `.env`, `node_modules`, `.next`, `.netlify`, browser screenshots or database backups. `.gitignore` protects these during a normal Git upload.
4. If a secret file was already tracked by Git, `.gitignore` does not untrack it. Remove it from tracking and rotate exposed credentials before publishing.

## 4. Connect the website to Netlify

1. Create an account at https://www.netlify.com and choose the **Free** plan.
2. Add a new project by importing your GitHub repository. Choose the production branch.
3. Set the private `DATABASE_URL` environment variable in the **Netlify dashboard**. It must be available during **builds and functions**; leaving it available to all scopes is sufficient on Free. Variables in `netlify.toml` alone do not configure runtime secrets.
4. The supplied `netlify.toml` selects Node.js 22, the `npm run build` build command, and the `.next` publish directory.
5. Allow Netlify's automatic Next.js/OpenNext integration. Do not choose static export or deploy only the `public` directory: checkout and enquiries require the server API routes.
6. Deploy the site. If your account starts projects privately, use Netlify's **Publish** control when ready to make it accessible to customers.
7. Choose an available site name, for example `exotic-aquarium-house`, to obtain a free `.netlify.app` address.
8. Optionally set `SITE_URL` to your final HTTPS address and redeploy. Social preview images otherwise use Netlify's automatic `URL` variable. Update `SITE_URL` if you later add a custom domain.

## 5. Verify before accepting customers

- Open `/api/health` on the published address. It should show a successful health result.
- Open the Fish collection and confirm all 18 fish varieties and their images load.
- Confirm prices, stock quantities and availability with the shop owner. The catalogue contains starter prices and representative images, not a verified live inventory feed.
- Test the cart, search and shop-pickup checkout, and confirm the order is recorded in your production database.
- Test a custom aquarium enquiry and confirm it is recorded.
- Open the directions links and confirm they point to https://maps.app.goo.gl/SyAZnxWmk8oprgHPA.
- Test the website on a mobile phone.
- Delete test orders and restore any stock they reserved before launch.
- Keep database credentials private and monitor the free-plan dashboards.

The current application saves order and enquiry requests to PostgreSQL. It does not include an owner dashboard, automatic SMS/email notifications or online payment processing. You can privately inspect the data using `npx drizzle-kit studio` from your own computer with your production environment variables; do not expose that tool publicly. Establish a process for checking requests and contacting customers before launch.

## Expanded catalogue and custom glass tanks

The catalogue includes 18 fish listings, 18 plant listings and 28 accessories, plus ready-made aquarium tanks. New product and glass-fabrication prices are starter estimates; confirm actual inventory, grades, model specifications and prices with the shop before accepting orders. Accessory images are representative illustrations of the material/equipment type, not verified brand/model photos. Plant photos include visible source and licence attribution in product details.

Customers can enter aquarium length, width and height in **feet**, and request **6, 8, 10 or 12 mm glass**. These choices are saved in the aquarium enquiry and included in its WhatsApp summary. Gross volume is estimated before glass/substrate displacement. The price is indicative, not a structural design or final quotation. A qualified fabricator must review dimensions, glass, bracing, silicone joints and stand support before construction. An existing-tank upgrade excludes a new glass tank from its estimate.

## Directions and browser fallbacks

The owner's original Maps link resolves to coordinates **26.1673526, 91.5608686**, with a Maps label of **Jhantar mantar** at the time it was checked. The site uses that supplied pin rather than guessing a replacement shop location. Verify the pin and place label before launch; if it is not the intended shop, update `src/lib/shop-contact.ts` with the corrected location.

Directions buttons show a panel with a full Google Maps directions URL, a pin-view link, the original short link, and copy controls. Google Maps and WhatsApp block display in embedded frames. Open their links in a separate browser tab, or copy the link/address/message and open it directly if the preview or in-app browser blocks popups. The website cannot override third-party iframe policies or create an active WhatsApp account for the shop number.

## WhatsApp ordering

The site includes WhatsApp order buttons on product cards, product details, the shopping bag and a floating shortcut. They open a pre-filled chat addressed to **+91 8822340240**, with product names, quantities and estimated prices. The floating shortcut uses the current bag, or a general ordering message when the bag is empty. Confirm this number has an active WhatsApp account before launch.

Customers must tap **Send** in WhatsApp. Clicking the button does not send a message automatically, collect payment, reserve stock or create a database order. Confirm the request, final price and pickup/delivery directly in chat, and record and manage WhatsApp orders separately. Website checkout continues to save orders to PostgreSQL; its confirmation includes a WhatsApp follow-up button with the existing order reference to avoid confusing it with a new order.

Click-to-chat needs no WhatsApp Business API key or paid messaging integration. Do not run the WhatsApp Business API just for these buttons.

## What “free” means

Official pricing checked while preparing this guide:

- **Netlify Free:** $0, with **300 credits per month**. Production deployments, traffic and function usage share that allowance. If it is exhausted, sites pause until the next cycle or you upgrade; the Free plan does not charge overages.
- **Neon Free:** $0, with **100 CU-hours per project per month** and **0.5 GB database storage per project**, plus other plan limits. Databases sleep when idle, so the first request may take longer. Usage limits can require waiting for a reset or upgrading.
- These plans have no production uptime guarantee. They can suit a small, low-traffic shop initially, but uninterrupted operation as traffic grows may require a paid plan.
- Domain registration, future payment-gateway transaction fees and any paid SMS/email services are separate from free hosting.
- Keep both accounts on Free unless you deliberately decide to upgrade. Check the providers' current pricing and terms before launching, as allowances can change.
- **Do not use Vercel Hobby for this commercial shop:** its free plan is restricted to personal, non-commercial use.

## Official references

- Netlify pricing: https://www.netlify.com/pricing/
- Netlify Free commercial-use announcement: https://www.netlify.com/blog/introducing-netlify-free-plan/
- Next.js on Netlify: https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/
- Netlify environment variables: https://docs.netlify.com/build/environment-variables/overview/
- Neon pricing: https://neon.com/pricing
- Neon Node.js connection guide: https://neon.com/docs/guides/node
- Vercel Hobby restrictions: https://vercel.com/docs/plans/hobby
