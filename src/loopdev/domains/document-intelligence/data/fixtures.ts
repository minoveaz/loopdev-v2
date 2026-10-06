import type { ExtractionRecord } from "../adapter/types";

export interface DocumentDemoFixture {
  id: string;
  name: string;
  description: string;
  documentType: ExtractionRecord["documentType"];
  mimeType: string;
  previewUrl: string;
  record: Omit<ExtractionRecord, "id" | "createdAt" | "updatedAt">;
}

// SVG data URI como preview visual limpia y de alta resolución para pruebas sin depender de archivos externos
const SAMPLE_DNI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
  <rect width="600" height="380" rx="16" fill="%23f8fafc" stroke="%23cbd5e1" stroke-width="4"/>
  <rect x="24" y="24" width="160" height="200" rx="8" fill="%23e2e8f0" stroke="%2394a3b8" stroke-width="2"/>
  <circle cx="104" cy="90" r="40" fill="%2394a3b8"/>
  <path d="M54,180 C54,140 154,140 154,180 Z" fill="%2394a3b8"/>
  <text x="210" y="55" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">ESPAÑA - DOCUMENTO NACIONAL DE IDENTIDAD</text>
  <text x="210" y="90" font-family="sans-serif" font-size="12" fill="%2364748b">1er APELLIDO / SURNAME</text>
  <text x="210" y="112" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">GARCÍA</text>
  <text x="210" y="145" font-family="sans-serif" font-size="12" fill="%2364748b">2º APELLIDO / SECOND SURNAME</text>
  <text x="210" y="167" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">LÓPEZ</text>
  <text x="210" y="200" font-family="sans-serif" font-size="12" fill="%2364748b">NOMBRE / GIVEN NAME</text>
  <text x="210" y="222" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">CARMEN</text>
  <text x="24" y="270" font-family="monospace" font-size="16" font-weight="bold" fill="%230f172a">NUM: 48392019K</text>
  <text x="240" y="270" font-family="sans-serif" font-size="14" fill="%23334155">NAC: ESP</text>
  <text x="350" y="270" font-family="sans-serif" font-size="14" fill="%23334155">SEXO: F</text>
  <text x="440" y="270" font-family="sans-serif" font-size="14" fill="%23334155">VAL: 14.10.2031</text>
  <rect x="24" y="300" width="552" height="56" rx="6" fill="%23f1f5f9"/>
  <text x="40" y="325" font-family="monospace" font-size="14" fill="%23475569">IDESPGARCIA&lt;&lt;CARMEN&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="40" y="345" font-family="monospace" font-size="14" fill="%23475569">4839201908ESP9208154F3110141&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
</svg>`;

const SAMPLE_PASSPORT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" rx="16" fill="%23fcfbf9" stroke="%23d6d3d1" stroke-width="4"/>
  <rect x="30" y="40" width="160" height="210" rx="8" fill="%23e7e5e4" stroke="%23a8a29e" stroke-width="2"/>
  <circle cx="110" cy="110" r="42" fill="%2378716c"/>
  <path d="M55,210 C55,160 165,160 165,210 Z" fill="%2378716c"/>
  <text x="210" y="60" font-family="sans-serif" font-size="22" font-weight="bold" fill="%231c1917">PASAPORTE / PASSPORT</text>
  <text x="210" y="85" font-family="sans-serif" font-size="14" fill="%2378716c">ESPAÑA / ESP</text>
  <text x="210" y="120" font-family="sans-serif" font-size="11" fill="%2378716c">APELLIDOS / SURNAMES</text>
  <text x="210" y="140" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23292524">MARTÍNEZ SANZ</text>
  <text x="210" y="170" font-family="sans-serif" font-size="11" fill="%2378716c">NOMBRES / GIVEN NAMES</text>
  <text x="210" y="190" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23292524">ALEJANDRO</text>
  <text x="210" y="220" font-family="sans-serif" font-size="11" fill="%2378716c">PASSPORT NO.</text>
  <text x="210" y="240" font-family="monospace" font-size="16" font-weight="bold" fill="%23292524">PAB983210</text>
  <rect x="30" y="290" width="540" height="80" rx="8" fill="%23f5f5f4"/>
  <text x="45" y="325" font-family="monospace" font-size="15" fill="%2344403c">P&lt;ESPMARTINEZ&lt;SANZ&lt;&lt;ALEJANDRO&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="45" y="355" font-family="monospace" font-size="15" fill="%2344403c">PAB9832104ESP8811203M3204128&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</text>
</svg>`;

const SAMPLE_COLOMBIAN_PASSPORT_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <rect width="600" height="400" rx="16" fill="%23f8fafc" stroke="%2394a3b8" stroke-width="4"/>
  <rect x="30" y="42" width="150" height="200" rx="8" fill="%23dbeafe" stroke="%2360a5fa" stroke-width="2"/>
  <circle cx="105" cy="112" r="40" fill="%2364748b"/>
  <path d="M55,212 C55,164 155,164 155,212 Z" fill="%2364748b"/>
  <text x="205" y="62" font-family="sans-serif" font-size="21" font-weight="bold" fill="%230f172a">PASAPORTE / PASSPORT</text>
  <text x="205" y="90" font-family="sans-serif" font-size="14" fill="%23334155">COLOMBIA / COL</text>
  <text x="205" y="126" font-family="sans-serif" font-size="11" fill="%2364758b">APELLIDOS / SURNAMES</text>
  <text x="205" y="146" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">GOMEZ RIVERA</text>
  <text x="205" y="176" font-family="sans-serif" font-size="11" fill="%2364758b">NOMBRES / GIVEN NAMES</text>
  <text x="205" y="196" font-family="sans-serif" font-size="16" font-weight="bold" fill="%231e293b">VALENTINA</text>
  <text x="205" y="226" font-family="sans-serif" font-size="11" fill="%2364758b">PASSPORT NO.</text>
  <text x="205" y="246" font-family="monospace" font-size="16" font-weight="bold" fill="%231e293b">AS4827316</text>
  <rect x="30" y="290" width="540" height="80" rx="8" fill="%23e2e8f0"/>
  <text x="45" y="325" font-family="monospace" font-size="15" fill="%231e293b">P&lt;COLGOMEZ&lt;RIVERA&lt;&lt;VALENTINA&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="45" y="355" font-family="monospace" font-size="15" fill="%231e293b">AS4827316&lt;6COL9402148F3008127&lt;&lt;&lt;&lt;&lt;&lt;&lt;04</text>
</svg>`;

export const DEMO_DOCUMENT_FIXTURES: DocumentDemoFixture[] = [
  {
    id: "fixture-dni-carmen",
    name: "DNI Carmen García López (España)",
    description: "Documento Nacional de Identidad español con anverso y reverso MRZ.",
    documentType: "spanish-dni",
    mimeType: "image/svg+xml",
    previewUrl: SAMPLE_DNI_SVG,
    record: {
      organizationId: "local-development-organization",
      title: "DNI Carmen García López",
      documentType: "spanish-dni",
      status: "completed",
      sourceSuite: "standalone",
      files: {
        front: {
          name: "dni-carmen-garcia-front.svg",
          size: 42800,
          mimeType: "image/svg+xml",
          previewUrl: SAMPLE_DNI_SVG,
        },
        back: null,
      },
      fields: {
        documentType: "spanish-dni",
        issuingCountry: "ESP",
        fullName: "Carmen García López",
        givenNames: "Carmen",
        surnames: "García López",
        firstSurname: "García",
        secondSurname: "López",
        documentNumber: "48392019K",
        birthDate: "1992-08-15",
        nationality: "ESP",
        sex: "F",
        issueDate: "2021-10-14",
        expiryDate: "2031-10-14",
        birthplace: "Madrid (Madrid)",
        supportNumber: "AAA892102",
        address: "Calle Gran Vía 32, 4º B, 28013 Madrid",
        mrz: "IDESPGARCIA<<CARMEN<<<<<<<<<<<<<<<\n4839201908ESP9208154F3110141<<<<<<<<<<8",
      },
      fieldConfidence: {
        documentNumber: 0.98,
        supportNumber: 0.92,
        givenNames: 0.99,
        firstSurname: 0.99,
        secondSurname: 0.96,
        birthDate: 0.95,
        nationality: 0.99,
        sex: 0.98,
        expiryDate: 0.94,
        address: 0.88,
        mrz: 0.99,
      },
      overallConfidence: 0.96,
      extractedAt: "2026-09-12T10:15:30Z",
      completedAt: "2026-09-12T10:17:00Z",
    },
  },
  {
    id: "fixture-passport-alejandro",
    name: "Pasaporte Alejandro Martínez (España)",
    description: "Pasaporte ordinario con zona de lectura mecánica ICAO Doc 9303.",
    documentType: "passport",
    mimeType: "image/svg+xml",
    previewUrl: SAMPLE_PASSPORT_SVG,
    record: {
      organizationId: "local-development-organization",
      title: "Pasaporte Alejandro Martínez",
      documentType: "passport",
      status: "completed",
      sourceSuite: "crm",
      files: {
        front: {
          name: "pasaporte-alejandro-martinez.svg",
          size: 51200,
          mimeType: "image/svg+xml",
          previewUrl: SAMPLE_PASSPORT_SVG,
        },
        back: null,
      },
      fields: {
        documentType: "passport",
        issuingCountry: "ESP",
        fullName: "Alejandro Martínez Sanz",
        givenNames: "Alejandro",
        surnames: "Martínez Sanz",
        firstSurname: "Martínez",
        secondSurname: "Sanz",
        documentNumber: "PAB983210",
        birthDate: "1988-11-20",
        nationality: "ESP",
        sex: "M",
        issueDate: "2022-04-12",
        expiryDate: "2032-04-12",
        birthplace: "Valencia",
        supportNumber: null,
        address: null,
        mrz: "P<ESPMARTINEZ<SANZ<<ALEJANDRO<<<<<<<<<<<<<<<<<\nPAB9832104ESP8811203M3204128<<<<<<<<<<<<<<02",
      },
      fieldConfidence: {
        documentNumber: 0.99,
        givenNames: 0.97,
        surnames: 0.97,
        firstSurname: 0.98,
        secondSurname: 0.96,
        birthDate: 0.99,
        nationality: 0.99,
        sex: 0.99,
        expiryDate: 0.98,
        mrz: 0.99,
      },
      overallConfidence: 0.98,
      extractedAt: "2026-09-12T14:20:10Z",
      completedAt: "2026-09-12T14:22:00Z",
    },
  },
  {
    id: "fixture-passport-colombia-valentina",
    name: "Pasaporte Valentina Gómez Rivera (Colombia)",
    description: "Pasaporte latinoamericano con país emisor COL y zona MRZ ICAO.",
    documentType: "passport",
    mimeType: "image/svg+xml",
    previewUrl: SAMPLE_COLOMBIAN_PASSPORT_SVG,
    record: {
      organizationId: "local-development-organization",
      title: "Pasaporte Valentina Gómez Rivera",
      documentType: "passport",
      status: "completed",
      sourceSuite: "crm",
      files: {
        front: {
          name: "pasaporte-valentina-gomez-rivera.svg",
          size: 49800,
          mimeType: "image/svg+xml",
          previewUrl: SAMPLE_COLOMBIAN_PASSPORT_SVG,
        },
        back: null,
      },
      fields: {
        documentType: "passport",
        issuingCountry: "COL",
        fullName: "Valentina Gómez Rivera",
        givenNames: "Valentina",
        surnames: "Gómez Rivera",
        firstSurname: "Gómez",
        secondSurname: "Rivera",
        documentNumber: "AS4827316",
        birthDate: "1994-02-14",
        nationality: "COL",
        sex: "F",
        issueDate: "2023-08-12",
        expiryDate: "2030-08-12",
        birthplace: "Bogotá",
        supportNumber: null,
        address: null,
        mrz: "P<COLGOMEZ<RIVERA<<VALENTINA<<<<<<<<<<<<<<\nAS4827316<6COL9402148F3008127<<<<<<<04",
      },
      fieldConfidence: {
        documentNumber: 0.99,
        issuingCountry: 0.99,
        givenNames: 0.98,
        firstSurname: 0.97,
        secondSurname: 0.96,
        birthDate: 0.98,
        nationality: 0.99,
        sex: 0.99,
        expiryDate: 0.98,
        mrz: 0.99,
      },
      overallConfidence: 0.98,
      extractedAt: "2026-09-23T09:00:00Z",
      completedAt: "2026-09-23T09:00:30Z",
    },
  },
];

export const INITIAL_EXTRACTIONS_STORE: ExtractionRecord[] = [
  {
    ...DEMO_DOCUMENT_FIXTURES[0].record,
    id: "ext-101",
    createdAt: "2026-09-12T10:14:00Z",
    updatedAt: "2026-09-12T10:17:00Z",
  },
  {
    ...DEMO_DOCUMENT_FIXTURES[1].record,
    id: "ext-102",
    createdAt: "2026-09-12T14:19:00Z",
    updatedAt: "2026-09-12T14:22:00Z",
  },
  {
    id: "ext-103",
    organizationId: "local-development-organization",
    title: "DNI Javier De la Torre (WhatsApp)",
    documentType: "spanish-dni",
    status: "completed",
    sourceSuite: "communications",
    sourceReferenceId: "conv-wa-893",
    files: {
      front: {
        name: "wa-doc-javier-torre.svg",
        size: 38900,
        mimeType: "image/svg+xml",
        previewUrl: SAMPLE_DNI_SVG,
      },
      back: null,
    },
    fields: {
      documentType: "spanish-dni",
      issuingCountry: "ESP",
      fullName: "Javier De la Torre Morales",
      givenNames: "Javier",
      surnames: "De la Torre Morales",
      firstSurname: "De la Torre",
      secondSurname: "Morales",
      documentNumber: "51928471M",
      birthDate: "1985-03-24",
      nationality: "ESP",
      sex: "M",
      issueDate: "2020-01-10",
      expiryDate: "2030-01-10",
      birthplace: "Sevilla",
      supportNumber: "BBB129841",
      address: "Avenida de la Constitución 14, Sevilla",
      mrz: "IDESPDELATORRE<<JAVIER<<<<<<<<<<<<<\n5192847108ESP8503242M3001105<<<<<<<<<<4",
    },
    fieldConfidence: {
      documentNumber: 0.95,
      givenNames: 0.94,
      firstSurname: 0.91,
      secondSurname: 0.89,
      birthDate: 0.96,
      nationality: 0.99,
      address: 0.82,
    },
    overallConfidence: 0.93,
    extractedAt: "2026-09-12T16:05:00Z",
    completedAt: "2026-09-12T16:07:30Z",
    createdAt: "2026-09-12T16:04:00Z",
    updatedAt: "2026-09-12T16:07:30Z",
  },
];
