export interface Product {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: "New" | "Like New" | "Good" | "Fair";
  seller: string;
  sellerAvatar: string;
  image: string;
  images: string[];
  description: string;
  location: string;
  postedAt: string;
  isSold: boolean;
  tags: string[];
  whatsapp: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "1",
    title: "Scientific Calculator Casio FX-991ES",
    price: 650,
    category: "Electronics",
    condition: "Like New",
    seller: "Arjun M.",
    sellerAvatar: "A",
    image:
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=900&q=80",
      "https://images.unsplash.com/photo-1563770660941-10a6360763a5?w=900&q=80",
      "https://images.unsplash.com/photo-1574607383077-47ddc2f38d75?w=900&q=80",
    ],
    description:
      "Barely used calculator in excellent condition. Perfect for engineering exams and class problem solving.",
    location: "AB1 Block",
    postedAt: "2 hours ago",
    isSold: false,
    tags: ["calculator", "math", "engineering"],
    whatsapp: "9876543210",
  },
  {
    id: "2",
    title: "Engineering Drawing Kit — Full Set",
    price: 400,
    category: "Stationery",
    condition: "Good",
    seller: "Priya K.",
    sellerAvatar: "P",
    image:
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=900&q=80",
      "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=900&q=80",
      "https://images.unsplash.com/photo-1583484963886-cfe2bff2945f?w=900&q=80",
    ],
    description:
      "Complete drafter set with compass, protractor, scales, and accessories. Ideal for first-year labs.",
    location: "Hostels Area",
    postedAt: "5 hours ago",
    isSold: false,
    tags: ["drawing", "civil", "drafting"],
    whatsapp: "9123456780",
  },
  {
    id: "3",
    title: "Laptop Stand — Aluminum Adjustable",
    price: 900,
    category: "Electronics",
    condition: "Like New",
    seller: "Rohan S.",
    sellerAvatar: "R",
    image:
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=900&q=80",
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?w=900&q=80",
      "https://images.unsplash.com/photo-1527443154391-507e9dc6c5cc?w=900&q=80",
    ],
    description:
      "Premium aluminum stand with adjustable viewing angle. Great for long coding sessions and better posture.",
    location: "Viridian Block",
    postedAt: "1 day ago",
    isSold: false,
    tags: ["laptop", "accessory", "desk"],
    whatsapp: "9988776655",
  },
  {
    id: "4",
    title: "Data Structures Textbook (Cormen)",
    price: 320,
    category: "Books",
    condition: "Good",
    seller: "Sneha T.",
    sellerAvatar: "S",
    image:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=900&q=80",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=900&q=80",
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=900&q=80",
    ],
    description:
      "Introduction to Algorithms by Cormen. Highlighted only in initial chapters, rest of the book is clean.",
    location: "Library Block",
    postedAt: "2 days ago",
    isSold: false,
    tags: ["cse", "algorithms", "textbook"],
    whatsapp: "9445566778",
  },
  {
    id: "5",
    title: "Mini Desk Fan — USB Powered",
    price: 250,
    category: "Room Essentials",
    condition: "Good",
    seller: "Vignesh L.",
    sellerAvatar: "V",
    image:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=900&q=80",
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80",
      "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=900&q=80",
    ],
    description:
      "Compact USB fan with 3 speed modes. Reliable for hostel rooms during warm nights.",
    location: "MH Block",
    postedAt: "3 days ago",
    isSold: true,
    tags: ["fan", "hostel", "room"],
    whatsapp: "9000011111",
  },
  {
    id: "6",
    title: "Wireless Mouse — Logitech M235",
    price: 550,
    category: "Electronics",
    condition: "Like New",
    seller: "Diya N.",
    sellerAvatar: "D",
    image:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=900&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=900&q=80",
      "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=900&q=80",
    ],
    description:
      "Smooth and compact wireless mouse, battery included. Works perfectly for assignments and coding.",
    location: "AB3 Block",
    postedAt: "4 days ago",
    isSold: false,
    tags: ["mouse", "wireless", "logitech"],
    whatsapp: "9112233445",
  },
  {
    id: "7",
    title: "Physics Vol. 1 & 2 — H.C. Verma",
    price: 280,
    category: "Books",
    condition: "Fair",
    seller: "Karan B.",
    sellerAvatar: "K",
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=900&q=80",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=900&q=80",
      "https://images.unsplash.com/photo-1474932430478-367dbb6832c1?w=900&q=80",
    ],
    description:
      "Both volumes with handwritten notes and solved examples. Good revision material for first-year students.",
    location: "Annapurna Block",
    postedAt: "5 days ago",
    isSold: false,
    tags: ["physics", "first year", "books"],
    whatsapp: "9765432109",
  },
  {
    id: "8",
    title: 'Cycle — Hero Sprint 26" (MTB)',
    price: 3200,
    category: "Transport",
    condition: "Good",
    seller: "Aarav P.",
    sellerAvatar: "A",
    image:
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&q=80",
    images: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=900&q=80",
      "https://images.unsplash.com/photo-1511994298241-608e28f14fde?w=900&q=80",
      "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=900&q=80",
    ],
    description:
      "18-speed MTB suitable for daily campus commute. Front brake needs a minor adjustment.",
    location: "Main Gate",
    postedAt: "1 week ago",
    isSold: false,
    tags: ["cycle", "transport", "mtb"],
    whatsapp: "9012345678",
  },
];

export const CATEGORIES = [
  "All",
  "Electronics",
  "Books",
  "Stationery",
  "Room Essentials",
  "Transport",
];
