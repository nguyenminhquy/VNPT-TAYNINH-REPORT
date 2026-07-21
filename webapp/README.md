# VNPT Report Hub – Next.js Web App

## Environment Variables

Copy `.env.local.example` → `.env.local` và điền vào:

```
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

BLOB_READ_WRITE_TOKEN=xxx
```

## Chạy local

```bash
cd webapp
npm install
npm run dev
```

Mở http://localhost:3000

## Deploy Vercel

1. Push repo lên GitHub
2. Import vào Vercel, chọn **Root Directory = webapp/**
3. Thêm Environment Variables trong Vercel dashboard
4. Deploy!
