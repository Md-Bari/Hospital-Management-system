import {
  Ambulance,
  Baby,
  BedDouble,
  Bone,
  Brain,
  Eye,
  FlaskConical,
  HeartPulse,
  Pill,
  Ribbon,
  ScanLine,
  Smile,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

const unsplash = (id: string, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=75`;

export const CONTACT = {
  emergency: "+880 1700-000000",
  emergencyTel: "+8801700000000",
  front: "+880 2 9660000",
  frontTel: "+88029660000",
  email: "care@mediwellhospital.com",
  address: ["Plot 14, Road 7, Dhanmondi R/A", "Dhaka 1205, Bangladesh"],
};

export const NAV_LINKS = [
  { label: "Home", href: "#top" },
  { label: "Departments", href: "#departments" },
  { label: "Services", href: "#services" },
  { label: "Doctors", href: "#doctors" },
  { label: "Facilities", href: "#facilities" },
  { label: "Health Tips", href: "#news" },
  { label: "Contact", href: "#contact" },
];

export const IMAGES = {
  hero: unsplash("1631217868264-e5b90bb7e133", 1600),
  building: unsplash("1586773860418-d37222d8fce3", 1400),
  care: unsplash("1581056771107-24ca5f033842", 1000),
};

export type Department = {
  slug: string;
  name: string;
  blurb: string;
  icon: LucideIcon;
  /** Tailwind classes for the tile tint, icon chip and icon colour. */
  tone: { tile: string; chip: string; icon: string };
};

export const DEPARTMENTS: Department[] = [
  { slug: "cardiology", name: "Cardiology", blurb: "Heart & vascular care", icon: HeartPulse,
    tone: { tile: "bg-rose-50 hover:border-rose-200", chip: "bg-white", icon: "text-rose-500" } },
  { slug: "neurology", name: "Neurology", blurb: "Brain, spine & nerves", icon: Brain,
    tone: { tile: "bg-indigo-50 hover:border-indigo-200", chip: "bg-white", icon: "text-indigo-500" } },
  { slug: "orthopedics", name: "Orthopedics", blurb: "Bones, joints & sports", icon: Bone,
    tone: { tile: "bg-emerald-50 hover:border-emerald-200", chip: "bg-white", icon: "text-emerald-600" } },
  { slug: "pediatrics", name: "Pediatrics", blurb: "Newborns to teens", icon: Baby,
    tone: { tile: "bg-sky-50 hover:border-sky-200", chip: "bg-white", icon: "text-sky-500" } },
  { slug: "gynecology", name: "Gynecology", blurb: "Women's health & maternity", icon: Smile,
    tone: { tile: "bg-orange-50 hover:border-orange-200", chip: "bg-white", icon: "text-orange-500" } },
  { slug: "medicine", name: "General Medicine", blurb: "Everyday & chronic care", icon: Stethoscope,
    tone: { tile: "bg-teal-50 hover:border-teal-200", chip: "bg-white", icon: "text-teal-600" } },
  { slug: "ophthalmology", name: "Ophthalmology", blurb: "Vision & eye surgery", icon: Eye,
    tone: { tile: "bg-amber-50 hover:border-amber-200", chip: "bg-white", icon: "text-amber-600" } },
  { slug: "oncology", name: "Oncology", blurb: "Cancer diagnosis & therapy", icon: Ribbon,
    tone: { tile: "bg-violet-50 hover:border-violet-200", chip: "bg-white", icon: "text-violet-500" } },
];

export const SERVICES = [
  { name: "Specialist OPD", icon: Stethoscope, desc: "Consult 40+ specialties with same-week slots.", image: unsplash("1532938911079-1b06ac7ceec7", 600) },
  { name: "Inpatient Care", icon: BedDouble, desc: "Comfortable wards, cabins and dedicated nursing.", image: unsplash("1538108149393-fbbd81895907", 600) },
  { name: "24/7 Emergency", icon: Ambulance, desc: "Trauma team and triage on site around the clock.", image: unsplash("1551601651-2a8555f1a136", 600) },
  { name: "Radiology", icon: ScanLine, desc: "Digital X-ray, CT, MRI and ultrasound imaging.", image: unsplash("1530497610245-94d3c16cda28", 600) },
  { name: "Laboratory", icon: FlaskConical, desc: "Automated pathology with online report delivery.", image: unsplash("1582719471384-894fbb16e074", 600) },
  { name: "Pharmacy", icon: Pill, desc: "Genuine, batch-verified medicines on every floor.", image: unsplash("1580281657527-47f249e8f4df", 600) },
];

export type Doctor = {
  name: string;
  title: string;
  dept: string;
  experience: number;
  rating: number;
  days: string;
  image: string;
};

export const DOCTORS: Doctor[] = [
  { name: "Dr. Nusrat Karim", title: "Senior Consultant, Cardiology", dept: "cardiology", experience: 18, rating: 4.9, days: "Sun – Wed", image: unsplash("1559839734-2b71ea197ec2", 500) },
  { name: "Dr. Imran Haque", title: "Consultant, Neurology", dept: "neurology", experience: 12, rating: 4.8, days: "Sat – Tue", image: unsplash("1612349317150-e413f6a5b16d", 500) },
  { name: "Dr. Leena Das", title: "Consultant, Pediatrics", dept: "pediatrics", experience: 9, rating: 4.9, days: "Daily", image: unsplash("1594824476967-48c8b964273f", 500) },
  { name: "Dr. Rafiq Ahmed", title: "Orthopedic & Spine Surgeon", dept: "orthopedics", experience: 15, rating: 4.8, days: "Mon – Thu", image: unsplash("1622253692010-333f2da6031d", 500) },
  { name: "Dr. Helen Brooks", title: "Head of Internal Medicine", dept: "medicine", experience: 24, rating: 4.9, days: "Sun – Thu", image: unsplash("1576765608535-5f04d1e3f289", 500) },
  { name: "Dr. Tahmid Rahman", title: "Consultant, Oncology", dept: "oncology", experience: 11, rating: 4.7, days: "Sat, Mon, Wed", image: unsplash("1582750433449-648ed127bb54", 500) },
];

export const FACILITIES = [
  { name: "Critical Care Unit", image: unsplash("1551076805-e1869033e561", 600) },
  { name: "Modular Operating Theatres", image: unsplash("1516549655169-df83a0774514", 600) },
  { name: "Patient Lounges", image: unsplash("1519494026892-80bbd2d6fd0d", 600) },
  { name: "Diagnostic Imaging", image: unsplash("1666214280557-f1b5022eb634", 600) },
];

export const TESTIMONIALS = [
  { quote: "From the emergency desk to discharge, every person knew my father's case. The nurses explained each medicine and the follow-up was booked before we left.", name: "Shahana Parvin", role: "Daughter of cardiac patient" },
  { quote: "I booked online in the morning and saw the orthopedic consultant the same afternoon. My X-ray report was in my portal before I got home.", name: "Arif Chowdhury", role: "Outpatient, Orthopedics" },
  { quote: "Our son was nervous about his vaccination. Dr. Das and the pediatric team made it feel like a visit to friends, not a hospital.", name: "Mitali & Sajid", role: "Parents, Pediatrics" },
];

export const ARTICLES = [
  { tag: "Heart Health", title: "Seven daily habits that keep your heart strong", date: "28 Oct 2026", read: "5 min", image: unsplash("1530026405186-ed1f139313f8", 600) },
  { tag: "Recovery", title: "Caring for a loved one in the first week after surgery", date: "21 Oct 2026", read: "4 min", image: unsplash("1584515933487-779824d29309", 600) },
  { tag: "Medicines", title: "Organising daily medicines for older parents", date: "14 Oct 2026", read: "6 min", image: unsplash("1563213126-a4273aed2016", 600) },
];
