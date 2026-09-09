import type { Course, Instructor, Learner } from "@/types";
import { ago } from "./_seedHelpers";
import { createLocalStore } from "@/lib/localStore";

export const mockInstructors: Instructor[] = [
  "Dr. Reina Park", "Mateo Conti", "Aurelia Sims", "Nikhil Arora", "Yara Halabi", "Ben Caldera",
].map((name, i) => ({
  id: `inst_${i + 1}`,
  name,
  email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@rivera.academy",
  expertise: ["Design Systems", "Data Science", "Frontend", "Marketing", "Leadership", "Photography"][i],
  coursesCount: 2 + i,
  studentsCount: 240 + i * 180,
  rating: +(4.3 + (i * 0.07) % 0.6).toFixed(1),
  createdAt: ago(600 - i * 50),
  updatedAt: ago(i),
}));

export const instructorsStore = createLocalStore<Instructor>({
  key: "data:instructors",
  seed: mockInstructors,
  idPrefix: "inst",
});

const LEVELS: Course["level"][] = ["beginner", "intermediate", "advanced"];
const STATUSES: Course["status"][] = ["draft", "published", "published", "published", "archived"];
const CATEGORIES = ["Design", "Engineering", "Business", "Marketing", "Data", "Soft skills"];

export const mockCourses: Course[] = Array.from({ length: 18 }).map((_, i) => ({
  id: `course_${i + 1}`,
  title: `${CATEGORIES[i % CATEGORIES.length]} Masterclass ${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length],
  level: LEVELS[i % LEVELS.length],
  status: STATUSES[i % STATUSES.length],
  instructorId: `inst_${(i % mockInstructors.length) + 1}`,
  durationMinutes: 60 + i * 45,
  lessons: 6 + (i % 18),
  enrolled: 30 + i * 28,
  rating: +(4 + ((i * 0.11) % 1)).toFixed(1),
  price: 49 + (i % 8) * 20,
  currency: "USD",
  createdAt: ago(180 - i * 5),
  updatedAt: ago(i),
}));

export const coursesStore = createLocalStore<Course>({
  key: "data:courses",
  seed: mockCourses,
  idPrefix: "course",
});

const LEARNER_NAMES = [
  "Ines Romero", "Tarik Aziz", "Sasha Lin", "Quinn Ortega", "Elif Demir", "Rafe Holloway",
  "Mira Whitlock", "Nico Bertolini", "Greta Lund", "Pavel Sokolov", "Ifeoma Obi", "Dario Vela",
];

export const mockLearners: Learner[] = LEARNER_NAMES.map((name, i) => ({
  id: `learn_${i + 1}`,
  name,
  email: name.toLowerCase().replace(/[^a-z]+/g, ".") + "@learners.rivera",
  enrolledCourses: 1 + (i % 6),
  completedCourses: i % 4,
  progress: 10 + ((i * 13) % 90),
  lastActiveAt: ago(i % 14),
  createdAt: ago(120 - i * 6),
  updatedAt: ago(i),
}));

export const learnersStore = createLocalStore<Learner>({
  key: "data:learners",
  seed: mockLearners,
  idPrefix: "learn",
});