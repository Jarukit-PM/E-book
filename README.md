# Interactive E-Book (Flip Book)

เว็บแอปอ่านหนังสือแบบพลิกหน้า (flip book) สไตล์ปกแข็ง + กระดาษครีม สร้างด้วย **React + Vite + TypeScript + Tailwind CSS** และ **react-pageflip**

## โครงเนื้อหา (ไฟล์ละหนึ่งหน้า)

เนื้อหาหลังปกถูกแยกเป็น **ไฟล์ Markdown หนึ่งไฟล์ต่อหนึ่งหน้า** ใน [`src/content/pages/`](src/content/pages/) ลำดับและจุดกระโดดสารบัญอยู่ใน [`src/content/page-manifest.json`](src/content/page-manifest.json)

- แก้ข้อความทีละหน้าได้ชัดเจน ไม่ต้องพึ่งการแบ่งอัตโนมัติตอนรันแอป
- ต้นฉบับยาวยังใช้ [`raw.md`](raw.md) แล้ว **สร้างหน้าใหม่จากสคริปต์** (ดูด้านล่าง)

## ความต้องการของระบบ

- Node.js 18+ (แนะนำ LTS)

## คำสั่งที่ใช้บ่อย

```bash
npm install
npm run dev
```

เปิดเบราว์เซอร์ที่ URL ที่ Vite แสดง (ปกติคือ `http://localhost:5173`)

### สร้าง / รีเจนไฟล์หน้าจาก raw.md

หลังแก้ `raw.md` หรือต้องการรีเซ็ตการแบ่งหน้าแบบอัตโนมัติ (ตัวอักษรต่อหน้า):

```bash
npm run generate:pages
```

คำสั่งนี้จะเขียนทับ `src/content/pages/*.md` และ `src/content/page-manifest.json` — **ถ้าแก้มือในไฟล์ .md แล้วไม่ต้องการโดนเขียนทับ** ให้สำรองโฟลเดอร์ `pages/` ก่อน

### จัดหน้าให้ตรงกับ PDF ที่จัดแล้ว (แนะนำ)

ถ้ามีไฟล์ PDF ที่จัดเลย์เอาต์หน้าไว้แล้ว (เช่น จาก InDesign / Word ส่งออก PDF) ให้รัน:

```bash
npm run sync:pdf
```

ค่าเริ่มต้นจะอ่านจาก  
`~/Downloads/E-Book_ อย่าอ่าน! ถ้าคุณยังสนุกกับการเป็นหนี้เพื่อรักษาหน้าตาทางสังคม.pdf`  
หรือระบุ path เอง:

```bash
npm run sync:pdf -- "/path/to/your-book.pdf"
```

สคริปต์จะดึงข้อความ **ทีละหน้า PDF** แล้วสร้าง `pages/*.md` + `page-manifest.json` ใหม่ (หนึ่งหน้า PDF ≈ หนึ่งหน้าเนื้อหาในแอป ยกเว้นปกยังใช้คอมโพเนนต์เดิม และหน้าสารบัญยังเป็นปุ่มกระโดดได้) ข้อความจะถูก normalize เป็น Unicode NFKC เพื่อลดปัญหา คำ / คํา จาก PDF

### Build สำหรับ deploy

```bash
npm run build
```

ผลลัพธ์อยู่ในโฟลเดอร์ `dist/` — นำไปวางบน **GitHub Pages**, **Netlify**, **Vercel** หรือ static host อื่นได้

```bash
npm run preview
```

ทดสอบไฟล์ production แบบ local หลัง build

## การใช้งานในแอป

- พลิกมุมหน้าหรือลากเพื่อเปลี่ยนหน้า
- ปุ่มลูกศร / **ลูกศรซ้าย–ขวาบนคีย์บอร์ด** เปลี่ยนหน้า
- ปุ่มบ้านกลับหน้าปก
- **สารบัญ**: แตะหัวข้อเพื่อกระโดดไปหน้าเปิดบท / คำนำ / บทส่งท้าย

## รูปแบบไฟล์ `.md` แต่ละหน้า

ไฟล์จะขึ้นต้นด้วยบล็อก `---json` … `---` แล้วตามด้วยเนื้อหา (ย่อหน้าคั่นด้วยบรรทัดว่าง)

- `preface-open` — หัวคำนำ + คำคม + ย่อหน้าในหน้าเดียว
- `chapter-start` — หัวบท + เนื้อหาเริ่มต้น
- `epilogue` — บทส่งท้าย (มี `showTitle` / `dropCap`)
- `body` — ย่อหน้าทั่วไป

รายละเอียดการเรนเดอร์อยู่ที่ [`src/components/PaperFromMarkdown.tsx`](src/components/PaperFromMarkdown.tsx)

## โครงสร้างโฟลเดอร์หลัก

| โฟลเดอร์ / ไฟล์ | คำอธิบาย |
|-----------------|----------|
| `raw.md` | ต้นฉบับยาว (ใช้กับ `generate:pages`) |
| `scripts/generate-pages-from-raw.ts` | สร้าง `pages/*.md` + manifest |
| `src/content/pages/*.md` | เนื้อหาหนึ่งหน้าต่อหนึ่งไฟล์ |
| `src/content/page-manifest.json` | ลำดับหน้า + meta ปก + `tocAnchors` |
| `src/content/parseBook.ts` | แยกโครงสร้างจาก raw (ใช้ในสคริปต์ generate) |
| `src/lib/paginate.ts` | แบ่งย่อหน้าเป็นหลายหน้า (ใช้ในสคริปต์ generate) |
| `src/components/PaperFromMarkdown.tsx` | อ่าน `.md` แล้วแสดงเป็นหน้ากระดาษ |
| `src/App.tsx` | Flip book + โหลด manifest + glob ไฟล์หน้า |

---

จัดทำตามแผน e-book flip book (Classic Book + React / Vite)
