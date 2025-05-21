# SparkedBy Landing Page Template

## Quick Start Guide

This template is designed to help you quickly create and deploy branded landing pages for businesses using SparkedBy's infrastructure. Follow these steps to get started:

1. **Copy the template**
   - Use this template as a starting point for your new landing page

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure your environment**
   - Copy `.env.template` to `.env.local`
   - Edit the values in `.env.local` to customize your landing page

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Customize the landing page**
   - Edit components in `src/components/landing/` to match your needs
   - Modify styles in Tailwind configuration files

6. **Deploy your landing page**
   ```bash
   CLIENT_NAME=yourbusiness npm run deploy:client
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Endpoint for waitlist form submissions | `http://localhost:3001/api/waitlist` |
| `VITE_COMPANY_NAME` | Business name to display | `SparkedBy` |
| `VITE_TAGLINE` | Main tagline/description | *Default tagline* |
| `VITE_PRIMARY_COLOR` | Primary brand color (hex) | `#3b82f6` (blue) |
| `VITE_SECONDARY_COLOR` | Secondary brand color (hex) | `#a855f7` (purple) |
| `VITE_ENABLE_WAITLIST` | Enable/disable waitlist form | `true` |

## Key Files to Customize

- `src/components/landing/Hero.tsx` - Main header section with headline and form
- `src/components/landing/Features.tsx` - Product features showcase
- `src/components/landing/WaitlistForm.tsx` - Email signup form
- `src/components/landing/Navbar.tsx` - Navigation header
- `src/components/landing/Footer.tsx` - Page footer with links

## Deployment

This template supports direct deployment to the SparkedBy infrastructure which provides:

- Client-specific subdomains (client_name.sparkedby.app)
- SSL/HTTPS for all subdomains
- AWS S3/CloudFront hosting architecture
- Automated deployments

When you run the deploy command, your landing page will be accessible at `yourbusiness.sparkedby.app`.

## Need Help?

For more information on customization options or for technical support, please refer to the main SparkedBy documentation or contact support.
