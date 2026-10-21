import type { Page } from "./types";

// A FICTIONAL policy wording written for this demo. It mirrors the structure and
// the kinds of clauses found in Indian retail health policies (room-rent caps,
// proportionate deduction, waiting periods, sub-limits, co-pay) so recruiters can
// try the product without uploading a real policy. It is not any insurer's wording.

export const SAMPLE_TITLE = "Suraksha Health Plus (fictional sample policy)";

export const SAMPLE_PAGES: Page[] = [
  {
    page: 1,
    text: `SURAKSHA HEALTH PLUS - POLICY WORDING
This is a fictional sample policy created for demonstration. It is not issued by any insurer.
Plan: Individual. Sum Insured: Rs 5,00,000 per policy year.

1. PREAMBLE
This Policy is a contract between the Insurer and the Insured Person. Subject to the terms, conditions and exclusions of this Policy, the Insurer will indemnify medically necessary expenses incurred during the Policy Period for Hospitalisation due to Illness or Injury.

2. DEFINITIONS
2.1 Hospitalisation
Hospitalisation means admission in a Hospital for a minimum period of 24 consecutive In-patient Care hours, except for Day Care Treatment procedures listed in Annexure I, where the 24-hour minimum does not apply.
2.2 Pre-Existing Disease
Pre-Existing Disease (PED) means any condition, ailment, injury or disease that was diagnosed by a physician, or for which medical advice or treatment was recommended or received, within 36 months prior to the date of commencement of the first policy issued by the Insurer.
2.3 Network Hospital
Network Hospital means a hospital empanelled by the Insurer to provide cashless treatment to Insured Persons.
2.4 Reasonable and Customary Charges
Reasonable and Customary Charges means charges for services which are consistent with the prevailing charges in the specific geographical area for identical or similar services.`,
  },
  {
    page: 2,
    text: `3. COVERAGE
3.1 In-patient Hospitalisation
The Insurer will pay for room, boarding, nursing, ICU, surgeon, anaesthetist, medical practitioner and consultant fees, anaesthesia, blood, oxygen, operation theatre charges, medicines, drugs, diagnostics and implants incurred during Hospitalisation, up to the Sum Insured.
3.2 Room Rent Limit
Room rent, boarding and nursing expenses are payable up to 1% of the Sum Insured per day for a normal room and up to 2% of the Sum Insured per day for ICU. For a Sum Insured of Rs 5,00,000 this means Rs 5,000 per day for a normal room and Rs 10,000 per day for ICU.
3.3 Proportionate Deduction
If the Insured Person occupies a room with a per-day rent higher than the limit in Clause 3.2, all associated medical expenses (including surgeon fees, nursing and doctor visit charges) will be reduced in the same proportion as the eligible room rent bears to the actual room rent. Proportionate deduction does not apply to pharmacy, consumables, implants and diagnostic costs.
3.4 Pre-Hospitalisation Expenses
Medical expenses incurred up to 30 days before the date of admission, for the same condition, are covered provided the Hospitalisation claim is admissible.
3.5 Post-Hospitalisation Expenses
Medical expenses incurred up to 60 days after the date of discharge, for the same condition, are covered provided the Hospitalisation claim is admissible.
3.6 Day Care Treatment
Day Care Treatment procedures listed in Annexure I, such as cataract surgery, chemotherapy, dialysis, and lithotripsy, are covered even when Hospitalisation is less than 24 hours.
3.7 Road Ambulance
Expenses for road ambulance to the hospital are covered up to Rs 2,000 per Hospitalisation.`,
  },
  {
    page: 3,
    text: `3.8 AYUSH Treatment
In-patient treatment under Ayurveda, Yoga and Naturopathy, Unani, Siddha and Homeopathy in a government-recognised AYUSH hospital is covered up to the Sum Insured.
3.9 Modern Treatment Methods
Robotic surgery, oral chemotherapy, immunotherapy and stem cell therapy (for haematological conditions) are covered up to 50% of the Sum Insured.
3.10 Cumulative Bonus
For every claim-free policy year, the Sum Insured will increase by 10% of the base Sum Insured, up to a maximum of 50%. If a claim is made, the cumulative bonus will reduce by 10% in the following year.
3.11 Restoration Benefit
If the Sum Insured and cumulative bonus are exhausted during a policy year, the Sum Insured will be restored once by 100% for subsequent claims for a different illness in the same policy year.

4. WAITING PERIODS
4.1 Initial Waiting Period
Expenses related to the treatment of any Illness within 30 days from the first policy commencement date are excluded, except claims arising due to an Accident.
4.2 Specific Waiting Period
Expenses for the following conditions and procedures are excluded until 24 months of continuous coverage have elapsed since the first policy commencement date, unless they arise from an Accident:
cataract; benign prostatic hypertrophy; hernia of all types; hydrocele; fistula and piles; sinusitis and related disorders; gall bladder stones and cholecystectomy; kidney and urinary tract stones; joint replacement surgery including knee and hip replacement; osteoarthritis and osteoporosis; varicose veins; hysterectomy for non-cancerous conditions; tonsillectomy and adenoidectomy.
4.3 Pre-Existing Disease Waiting Period
Expenses related to the treatment of a Pre-Existing Disease and its direct complications are excluded until 36 months of continuous coverage have elapsed since the first policy commencement date, provided the Pre-Existing Disease was declared in the proposal form and accepted by the Insurer.
4.4 Maternity
Maternity expenses, including childbirth and termination of pregnancy, are not covered under this Policy.`,
  },
  {
    page: 4,
    text: `5. SUB-LIMITS
5.1 Cataract
Cataract surgery is payable up to Rs 40,000 per eye per policy year.
5.2 Joint Replacement
Knee or hip replacement surgery is payable up to Rs 1,50,000 per joint, including the cost of the implant.
5.3 Mental Illness
In-patient treatment for mental illness is covered up to Rs 1,00,000 per policy year when the treatment is taken in a hospital with a qualified psychiatrist.
5.4 Bariatric Surgery
Bariatric surgery is payable up to Rs 2,00,000 only when the Body Mass Index is 40 or higher, or 35 or higher with severe co-morbidities, and after the 36-month waiting period in Clause 4.3.

6. CO-PAYMENT AND DEDUCTIBLES
6.1 Age-Related Co-payment
If the Insured Person was aged 61 years or above at the time of entering the Policy, a co-payment of 20% will apply to every admissible claim.
6.2 Non-Network Co-payment
If treatment is taken in a hospital that is not a Network Hospital, a co-payment of 10% will apply to the admissible claim amount, except in emergencies where the Insured Person was admitted to the nearest hospital.
6.3 Zone-Based Co-payment
If the premium was paid for Zone B (all cities other than Delhi NCR, Mumbai region, Bengaluru, Chennai, Hyderabad, Kolkata, Pune and Ahmedabad) and treatment is taken in a Zone A city, a co-payment of 15% will apply.
6.4 Order of Application
Co-payment is applied on the admissible amount after applying sub-limits and proportionate deduction. If more than one co-payment applies, they are applied one after another on the reduced amount.`,
  },
  {
    page: 5,
    text: `7. PERMANENT EXCLUSIONS
7.1 Cosmetic and Plastic Surgery
Treatment to change appearance is excluded unless it is reconstruction following an Accident, burns or cancer, or is medically necessary to restore function.
7.2 Obesity and Weight Control
Treatment for obesity and weight control is excluded, except bariatric surgery covered under Clause 5.4.
7.3 Dental Treatment
Dental treatment is excluded unless it requires Hospitalisation because of an Accident.
7.4 Spectacles, Contact Lenses and Hearing Aids
Expenses for spectacles, contact lenses, hearing aids and cochlear implants are excluded.
7.5 Out-patient Treatment
Out-patient consultations, diagnostics and medicines that are not followed by an admissible Hospitalisation are excluded.
7.6 Self-Inflicted Injury and Substance Abuse
Treatment for intentional self-inflicted injury, and for alcohol or drug abuse and its consequences, is excluded.
7.7 Unproven Treatments
Treatments that are experimental or not supported by medical evidence are excluded.
7.8 Rest Cure and Rehabilitation
Admission primarily for rest cure, rehabilitation or respite care is excluded.
7.9 Non-Medical Items
Items listed in Annexure II such as gloves, toiletries, diapers, attendant charges, admission kits, and registration fees are not payable.
7.10 Investigation-Only Admission
Admission primarily for diagnostics and evaluation, without active treatment, is excluded.`,
  },
  {
    page: 6,
    text: `8. CLAIMS PROCEDURE
8.1 Intimation
For planned Hospitalisation, the Insurer must be informed at least 48 hours before admission. For emergency Hospitalisation, the Insurer must be informed within 24 hours of admission.
8.2 Cashless Claims
Cashless treatment is available only in Network Hospitals. The Insurer will decide on a cashless authorisation request within 1 hour and on the final discharge authorisation within 3 hours of receiving the request from the hospital.
8.3 Reimbursement Claims
For reimbursement, the claim form with original bills, discharge summary, investigation reports and prescriptions must be submitted within 30 days of discharge. Delay may be condoned if the Insured Person shows reasons beyond their control.
8.4 Claim Settlement
The Insurer will settle or reject a claim within 30 days of receiving the last necessary document. If there is a delay, the Insurer will pay interest at 2% above the bank rate.

9. MORATORIUM PERIOD
After 60 continuous months of coverage, no claim under this Policy shall be contestable on the ground of non-disclosure or misrepresentation, except for established fraud.

10. GRIEVANCE REDRESSAL
If the Insured Person is not satisfied with a claim decision, they may write to the Insurer's Grievance Redressal Officer. If the grievance is not resolved within 30 days, or the Insured Person is not satisfied with the response, they may approach the Insurance Ombudsman or register a complaint on the IRDAI Bima Bharosa portal.

ANNEXURE I - DAY CARE PROCEDURES (EXTRACT)
Cataract surgery; chemotherapy; radiotherapy; dialysis; lithotripsy; coronary angiography; tonsillectomy; hernia repair (laparoscopic) where discharged within 24 hours.`,
  },
];
