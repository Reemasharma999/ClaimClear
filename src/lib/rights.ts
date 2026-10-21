// Policyholder rights used in the appeal letter. Each fact carries its source so
// the model can cite it and the user can check it. Only facts we could trace to
// a published source are included; anything unverified is deliberately left out.

export type Right = { id: string; text: string; source: string; url: string };

export const RIGHTS: Right[] = [
  {
    id: "R1",
    text: "Insurers must decide on a cashless authorisation request within one hour and grant final discharge authorisation within three hours of the hospital's request; extra charges caused by a delay beyond three hours are borne by the insurer.",
    source: "IRDAI Master Circular on Health Insurance Business (29 May 2024), as reported",
    url: "https://www.theweek.in/news/india/2024/05/30/irdai-issues-new-master-circular-to-make-health-insurance-claims-process-more-seamless.amp.html",
  },
  {
    id: "R2",
    text: "After 60 continuous months of coverage (including portability and migration), a claim cannot be contested on grounds of non-disclosure or misrepresentation, except for established fraud.",
    source: "IRDAI Master Circular on Health Insurance Business (2024) — moratorium period",
    url: "https://www.basunivesh.com/irdas-new-health-insurance-changes-2024/",
  },
  {
    id: "R3",
    text: "No claim can be repudiated without the approval of the insurer's Claims Review Committee.",
    source: "IRDAI Master Circular on Health Insurance Business (2024), as reported",
    url: "https://www.theweek.in/news/india/2024/05/30/irdai-issues-new-master-circular-to-make-health-insurance-claims-process-more-seamless.amp.html",
  },
  {
    id: "R4",
    text: "A complaint can go to the Insurance Ombudsman after a written representation to the insurer has been rejected, left unanswered for one month, or answered unsatisfactorily. The Ombudsman can hear complaints up to Rs 50 lakh.",
    source: "Insurance Ombudsman Rules 2017, Rule 14(3); limit raised from Rs 30 lakh by the 10 Nov 2023 amendment",
    url: "https://news.cleartax.in/insurance-ombudsman-offices-can-admit-policyholder-complaints-of-up-to-rs-50-lakh/9807/amp",
  },
  {
    id: "R5",
    text: "Grievances against an insurer can also be registered on IRDAI's Bima Bharosa portal (bimabharosa.irdai.gov.in).",
    source: "IRDAI Bima Bharosa",
    url: "https://bimabharosa.irdai.gov.in/",
  },
];
